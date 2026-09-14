import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { scheduleTimerCompletion, cancelTaskNotification, showTaskCompletedNotification } from '../utils/notifications';
import { isDayPastCutoff, startOfDay } from '../utils/taskDateUtils';
import { getServerNow, patchTempTodo } from '../utils/offlineStorage';

const isTempId = (id: any) => typeof id === 'string' && id.startsWith('temp_');

// A parent countdown that hits zero while timed subtasks are still running
// must NOT auto-complete — extend it to cover the latest subtask end first.
// Returns ms to add, or 0 when nothing needs extending.
const computeSubtaskExtension = (todo: any, subs: any[] | undefined, serverTime: number): number => {
  if (!todo?.timerDuration || !Array.isArray(subs) || subs.length === 0) return 0;
  let latestEnd = 0;
  subs.forEach((sub) => {
    if (!sub || sub.parentId !== todo._id) return;
    if (sub.status !== 'in_progress') return; // only currently-running subtasks
    if (!sub.timerDuration || sub.timerDirection === 'up' || !sub.timerStartTime) return;
    latestEnd = Math.max(latestEnd, sub.timerStartTime + sub.timerDuration);
  });
  if (latestEnd <= 0) return 0;
  const parentEnd = todo.timerStartTime + todo.timerDuration;
  return Math.max(0, latestEnd - parentEnd);
};

export function useTaskTimers(todos: any[] | undefined, updateStatus: any, subtasks?: any[], setTimer?: any, language: string = 'en') {
  const appState = useRef(AppState.currentState);
  const todosRef = useRef(todos);
  const subtasksRef = useRef(subtasks);
  const setTimerRef = useRef(setTimer);
  const languageRef = useRef(language);
  const scheduledNotifications = useRef(new Map<string, string>());

  useEffect(() => {
    todosRef.current = todos;
    subtasksRef.current = subtasks;
    setTimerRef.current = setTimer;
    languageRef.current = language;
    
    if (!todos || !Array.isArray(todos)) return;

    const activeTaskIds = new Set<string>();

    todos.forEach((todo) => {
      activeTaskIds.add(todo._id);
      if (todo.status === 'in_progress' && todo.timerStartTime && todo.timerDuration && todo.timerDirection !== 'up') {
        const elapsed = getServerNow() - todo.timerStartTime;
        const remaining = Math.max(0, todo.timerDuration - elapsed);
        
        if (remaining > 0) {
           const lastScheduled = scheduledNotifications.current.get(todo._id);
           const scheduleKey = `${todo.timerStartTime}-${todo.timerDuration}`;
           if (lastScheduled !== scheduleKey) {
             if (lastScheduled) {
               cancelTaskNotification(todo._id);
             }
             scheduleTimerCompletion(todo._id, todo.text, remaining);
             scheduledNotifications.current.set(todo._id, scheduleKey);
           }
        }
      } else {
        if (scheduledNotifications.current.has(todo._id)) {
          cancelTaskNotification(todo._id);
          scheduledNotifications.current.delete(todo._id);
        }
      }
    });

    for (const [taskId] of scheduledNotifications.current.entries()) {
      if (!activeTaskIds.has(taskId)) {
        cancelTaskNotification(taskId);
        scheduledNotifications.current.delete(taskId);
      }
    }
  }, [todos]);

  useEffect(() => {
    // Guard against the 1s sweeper re-dispatching the same auto-status change
    // on every tick while the server echo is still in flight.
    const autoDispatched = new Set<string>();

    const dispatchAutoStatus = (id: string, status: string) => {
      const key = `${id}:${status}`;
      if (autoDispatched.has(key)) return;
      autoDispatched.add(key);
      Promise.resolve(updateStatus({ id, status })).catch(() => {
        autoDispatched.delete(key);
      });
    };

    const checkTasks = (currentTodos: any[]) => {
      if (!currentTodos || !Array.isArray(currentTodos)) return;

      const now = Date.now();
      const serverTime = getServerNow();
      currentTodos.forEach((todo) => {
        try {
          if (todo.status === 'done' && autoDispatched.has(`${todo._id}:done`)) {
            autoDispatched.delete(`${todo._id}:done`); // re-arm if reopened later
          }
          if ((todo.status === 'not_done' || todo.status === 'done') && autoDispatched.has(`${todo._id}:not_done`)) {
            autoDispatched.delete(`${todo._id}:not_done`);
          }

          // 1. Timer expiry → done (count-down only)
          if (todo.status === 'in_progress' && todo.timerStartTime && todo.timerDuration) {
            if (todo.timerDirection !== 'up') {
              const elapsed = serverTime - todo.timerStartTime;
              const remaining = Math.max(0, todo.timerDuration - elapsed);

              if (remaining === 0) {
                // Parent ran out while a timed subtask is still running →
                // extend the parent to cover it instead of completing early.
                const extension = computeSubtaskExtension(todo, subtasksRef.current, serverTime);
                if (extension > 0) {
                  const newDuration = (todo.timerDuration || 0) + extension;
                  if (isTempId(todo._id)) {
                    patchTempTodo(todo._id, { timerDuration: newDuration });
                  } else if (setTimerRef.current) {
                    // setTimer adjusts elapsed internally and keeps the
                    // running clock consistent; updateStatus has no duration arg.
                    Promise.resolve(
                      setTimerRef.current({ id: todo._id, duration: newDuration })
                    ).catch(() => {});
                  }
                  return;
                }
                if (isTempId(todo._id)) {
                  patchTempTodo(todo._id, { status: 'done', completedAt: now, timerStartTime: undefined });
                } else {
                  dispatchAutoStatus(todo._id, 'done');
                }
                // The countdown finishing IS the task completing — announce it.
                // Previously only manual completion paths fired this, so a
                // timer-ended task silently flipped to done.
                showTaskCompletedNotification(todo.text, languageRef.current);
                return;
              }
            }
          }

          // 2. Deadline passed without completion → not_done.
          // Honors the 7:00 AM extended-day cutoff: a task from "today" stays
          // alive until 7 AM of the next day, so a timer that crosses midnight
          // is never force-reset to not_done.
          // Reminders / meetings / appointments are exempt: their status must
          // only ever change on explicit user action (complete or restore).
          const isReminderCard =
            todo.type === 'reminder' || todo.type === 'meeting' || todo.type === 'appointment';
          if (
            !isReminderCard &&
            (todo.status === 'not_started' || todo.status === 'in_progress' || todo.status === 'paused') &&
            todo.dueDate
          ) {
            if (isDayPastCutoff(startOfDay(todo.dueDate), now)) {
              if (isTempId(todo._id)) {
                patchTempTodo(todo._id, { status: 'not_done', timerStartTime: undefined });
              } else {
                dispatchAutoStatus(todo._id, 'not_done');
              }
            }
          }
        } catch (err) {
          // One failing task must never abort the sweep for the rest.
          console.warn('checkTasks failed for todo', todo?._id, err);
        }
      });
    };

    // Initial check
    if (todosRef.current) {
      checkTasks(todosRef.current);
    }

    // Periodic check: the countdown must complete (status → done) even while
    // the app sits open in the foreground, not only on resume/mount.
    const interval = setInterval(() => {
      if (todosRef.current) {
        checkTasks(todosRef.current);
      }
    }, 1000);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (todosRef.current) {
          checkTasks(todosRef.current);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [updateStatus]);
}
