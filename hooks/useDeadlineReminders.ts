import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  scheduleDeadlineReminder,
  cancelDeadlineReminder,
  showOverdueNudge,
} from '../utils/notifications';

const isTempId = (id: any) => typeof id === 'string' && id.startsWith('temp_');
const ACTIVE = new Set(['not_started', 'in_progress', 'paused']);

/**
 * Best-practice deadline notifications.
 * Tasks carrying a future dueDate get a DATE-trigger reminder at the due
 * moment; when a deadline passes while the app is open, fire one immediate
 * overdue nudge (deduped per task per session). Stale schedules for
 * done/deleted tasks are cancelled.
 */
export function useDeadlineReminders(todos: any[] | undefined, language: string = 'en') {
  const appState = useRef(AppState.currentState);
  const todosRef = useRef(todos);
  const scheduled = useRef(new Set<string>());
  const nudged = useRef(new Set<string>());

  useEffect(() => {
    todosRef.current = todos;
    if (!todos || !Array.isArray(todos)) return;

    const seen = new Set<string>();
    const now = Date.now();

    todos.forEach((todo) => {
      if (isTempId(todo?._id)) return;
      const id = String(todo._id);
      const active = ACTIVE.has(todo.status) && !todo.isCompleted;
      if (!active || typeof todo.dueDate !== 'number') {
        if (scheduled.current.has(id)) {
          cancelDeadlineReminder(id);
          scheduled.current.delete(id);
        }
        return;
      }
      seen.add(id);
      if (todo.dueDate > now + 5000 && !scheduled.current.has(id)) {
        scheduleDeadlineReminder(id, todo.text || 'Task', todo.dueDate, language).then((nid) => {
          if (nid) scheduled.current.add(id);
        });
      } else if (todo.dueDate <= now && !nudged.current.has(id)) {
        nudged.current.add(id);
        showOverdueNudge(todo.text || 'Task', language);
        if (scheduled.current.has(id)) scheduled.current.delete(id);
      }
    });

    for (const id of Array.from(scheduled.current)) {
      if (!seen.has(id)) {
        cancelDeadlineReminder(id);
        scheduled.current.delete(id);
      }
    }
  }, [todos, language]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Re-arm session nudges so a deadline crossed while killed still nudges on open.
        nudged.current.clear();
        const current = todosRef.current;
        if (current && Array.isArray(current)) {
          const now = Date.now();
          current.forEach((todo: any) => {
            if (isTempId(todo?._id)) return;
            if (
              ACTIVE.has(todo.status) &&
              !todo.isCompleted &&
              typeof todo.dueDate === 'number' &&
              todo.dueDate <= now
            ) {
              const key = String(todo._id);
              if (!nudged.current.has(key)) {
                nudged.current.add(key);
                showOverdueNudge(todo.text || 'Task', language);
              }
            }
          });
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [language]);
}
