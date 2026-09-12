import { useEffect, useRef } from 'react';
import { scheduleTimerCompletion, cancelTaskNotification } from '../utils/notifications';

/**
 * Subtask countdown notifications.
 * The home sweeper (useTaskTimers) only sees top-level tasks, so a subtask
 * timer finishing was previously silent. This mirrors it for subtasks with
 * the subtask channel/sound (isSubtask = true). Identifiers match the ones
 * used anywhere else, so concurrent mounts overwrite instead of duplicating.
 */
export function useSubtaskTimerNotifications(subtasks: any[] | undefined, language: string = 'en') {
  const scheduled = useRef(new Map<string, string>());

  useEffect(() => {
    if (!subtasks || !Array.isArray(subtasks)) return;

    const activeIds = new Set<string>();

    subtasks.forEach((sub) => {
      if (!sub || typeof sub._id !== 'string' || sub._id.startsWith('temp_')) return;
      activeIds.add(sub._id);
      if (
        sub.status === 'in_progress' &&
        sub.timerStartTime &&
        sub.timerDuration &&
        sub.timerDirection !== 'up'
      ) {
        // Elapsed clock is wall-clock based; remaining derives from the server time.
        const remaining = Math.max(0, sub.timerDuration - (Date.now() - sub.timerStartTime));
        if (remaining > 0) {
          const key = `${sub.timerStartTime}-${sub.timerDuration}`;
          if (scheduled.current.get(sub._id) !== key) {
            if (scheduled.current.has(sub._id)) cancelTaskNotification(sub._id);
            scheduleTimerCompletion(sub._id, sub.text, remaining, true, language);
            scheduled.current.set(sub._id, key);
          }
        }
      } else {
        if (scheduled.current.has(sub._id)) {
          cancelTaskNotification(sub._id);
          scheduled.current.delete(sub._id);
        }
      }
    });

    for (const [id] of scheduled.current.entries()) {
      if (!activeIds.has(id)) {
        cancelTaskNotification(id);
        scheduled.current.delete(id);
      }
    }
  }, [subtasks, language]);
}
