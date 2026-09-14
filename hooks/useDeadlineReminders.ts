import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIdMappings, getServerNow } from '../utils/offlineStorage';
import {
  Notifications,
  scheduleDeadlineReminder,
  cancelDeadlineReminder,
  showOverdueNudge,
  scheduleRepeatingReminder,
  scheduleReminderNotification,
  cancelReminderSeries,
  type RepeatPeriod,
} from '../utils/notifications';

const isTempId = (id: any) => typeof id === 'string' && id.startsWith('temp_');
const ACTIVE = new Set(['not_started', 'in_progress', 'paused']);

// ---------------------------------------------------------------------------
// Persistent overdue dedupe
// ---------------------------------------------------------------------------
// An overdue nudge must fire ONCE per task per deadline. Keeping this in a
// ref alone re-fired the whole backlog on every cold start and every
// foreground resume — the "spam you can't clear" bug. Persist the set.
const NUDGED_KEY = 'OVERDUE_NUDGED_V1';
const nudgeKey = (id: string, dueDate: number) => `${id}::${dueDate}`;
let nudgedSet: Set<string> | null = null;
let nudgedLoaded = false;

const loadNudged = async (): Promise<Set<string>> => {
  if (nudgedLoaded && nudgedSet) return nudgedSet;
  try {
    const raw = await AsyncStorage.getItem(NUDGED_KEY);
    nudgedSet = new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    nudgedSet = new Set<string>();
  }
  nudgedLoaded = true;
  return nudgedSet!;
};

const persistNudged = async () => {
  try {
    await AsyncStorage.setItem(NUDGED_KEY, JSON.stringify(Array.from(nudgedSet ?? [])));
  } catch {}
};

const markNudged = async (key: string) => {
  const set = await loadNudged();
  set.add(key);
  await persistNudged();
};

const isNudged = async (key: string): Promise<boolean> => {
  const set = await loadNudged();
  return set.has(key);
};

// Synchronous same-tick reservation. The main effect re-runs on every
// `todos` identity change and the foreground-resume path runs concurrently:
// two passes can both clear `await isNudged()` before either `markNudged()`
// lands and the nudge fires twice (same class as the double-submit race —
// a state/persisted flag alone is stale across the await gap). Reserving the
// key synchronously before the first await closes it.
const nudgeInflight = new Set<string>();
const tryReserveNudge = (key: string): boolean => {
  if (nudgeInflight.has(key)) return false;
  nudgeInflight.add(key);
  return true;
};

/**
 * Best-practice deadline notifications.
 * Tasks carrying a future dueDate get a DATE-trigger reminder at the due
 * moment; when a deadline passes, fire ONE immediate overdue nudge — deduped
 * persistently per task+deadline so restarts and resumes can't re-spam it.
 * Stale schedules for done/deleted tasks are cancelled.
 */
export function useDeadlineReminders(todos: any[] | undefined, language: string = 'en') {
  const appState = useRef(AppState.currentState);
  const todosRef = useRef(todos);
  const scheduled = useRef(new Map<string, string>());
  const stateRef = useRef(todos);
  // Temp ids whose scheduled notifications were already swept after syncing.
  const sweptTempIds = useRef(new Set<string>());

  useEffect(() => {
    todosRef.current = todos;
    stateRef.current = todos;
    if (!todos || !Array.isArray(todos)) return;

    let cancelled = false;
    const seen = new Set<string>();
    // Server-corrected clock: dueDate comes from the server, so comparing it
    // against the raw device clock made "past due" wrong whenever the device
    // and server clocks disagreed (the same class of bug the timer math had).
    const now = getServerNow();

    const run = async () => {
      // Offline-created events scheduled their notifications under the temp
      // id. Once the queued create syncs, that temp entry would fire a second
      // time alongside the real one — sweep it (idempotent, once per session).
      let idMap: Record<string, string> = {};
      try {
        idMap = await getIdMappings();
        for (const tempKey of Object.keys(idMap)) {
          if (sweptTempIds.current.has(tempKey)) continue;
          sweptTempIds.current.add(tempKey);
          cancelReminderSeries(tempKey);
        }
      } catch {
        // id mappings unavailable — scheduling continues without the sweep
      }

      for (const todo of todos) {
        if (cancelled) return;
        if (isTempId(todo?._id)) {
          // Already mapped to a real id (server echo may lag): never schedule
          // under a temp id that already has a real counterpart — that's the
          // duplicate the sweep above just removed.
          if (idMap[String(todo._id)]) continue;
          // Offline-created reminder/meeting: schedule its series right away
          // under the temp id (the hook skips temp ids for the normal paths,
          // and the sync sweep cancels this copy once the real id exists) —
          // otherwise an offline-created repeating reminder never alerts.
          if (todo.type === 'reminder' || todo.type === 'meeting' || todo.type === 'appointment') {
            const tempId = String(todo._id);
            const tempSig = `${todo.dueDate}|${todo.repeatPeriod || 'none'}|${todo.repeatCount || 1}`;
            if (
              ACTIVE.has(todo.status) &&
              !todo.isCompleted &&
              typeof todo.dueDate === 'number' &&
              scheduled.current.get(tempId) !== tempSig
            ) {
              const tempPeriod: RepeatPeriod = (todo.repeatPeriod as RepeatPeriod) || 'none';
              if (tempPeriod !== 'none') {
                const n = await scheduleRepeatingReminder(
                  tempId,
                  todo.text || 'Task',
                  todo.dueDate,
                  tempPeriod,
                  todo.repeatCount || 1,
                  language
                );
                if (n > 0) scheduled.current.set(tempId, tempSig);
              } else if (todo.dueDate > now) {
                const nid = await scheduleReminderNotification(todo.text || 'Task', todo.dueDate, language, tempId);
                if (nid) scheduled.current.set(tempId, tempSig);
              }
            }
          }
          continue;
        }
        const id = String(todo._id);
        const active = ACTIVE.has(todo.status) && !todo.isCompleted;
        const repeatPeriod: RepeatPeriod = (todo.repeatPeriod as RepeatPeriod) || 'none';
        const isRepeating = repeatPeriod !== 'none';
        // Reminder/meeting cards get their notification through the reminder
        // series path (below); deadline reminders are for plain tasks only,
        // otherwise the same dueDate would notify twice.
        const isReminderCard = todo.type === 'reminder' || todo.type === 'meeting' || todo.type === 'appointment';
        // Signature of everything that affects scheduling: editing the time,
        // period or count must re-schedule, not be skipped as "already done".
        const scheduleSignature = `${todo.dueDate}|${repeatPeriod}|${todo.repeatCount || 1}`;

        if (!active || typeof todo.dueDate !== 'number') {
          if (scheduled.current.has(id)) {
            cancelDeadlineReminder(id);
            scheduled.current.delete(id);
          }
          if (typeof todo.dueDate === 'number') {
            // Done/cancelled item: drop any scheduled reminder occurrences
            // (covers both a repeat series and a one-shot entry).
            cancelReminderSeries(id);
          }
          continue;
        }

        seen.add(id);

        if (isReminderCard) {
          // Repeating → schedule the whole series; one-shot → single entry.
          // Both are idempotent (date-keyed identifiers), and neither raises
          // an overdue nudge: a recurring item is still active by definition.
          if (scheduled.current.get(id) !== scheduleSignature) {
            if (scheduled.current.has(id)) {
              // Parameters changed since the last pass — clear old entries.
              cancelReminderSeries(id);
            }
            if (isRepeating) {
              const n = await scheduleRepeatingReminder(
                id,
                todo.text || 'Task',
                todo.dueDate,
                repeatPeriod,
                todo.repeatCount || 1,
                language
              );
              if (n > 0) scheduled.current.set(id, scheduleSignature);
            } else if (todo.dueDate > now) {
              const nid = await scheduleReminderNotification(todo.text || 'Task', todo.dueDate, language, id);
              if (nid) scheduled.current.set(id, scheduleSignature);
            } else {
              scheduled.current.set(id, scheduleSignature); // past one-shot
            }
          }
          continue;
        }

        if (todo.dueDate > now + 5000) {
          if (scheduled.current.get(id) !== scheduleSignature) {
            const nid = await scheduleDeadlineReminder(id, todo.text || 'Task', todo.dueDate, language);
            if (nid) scheduled.current.set(id, scheduleSignature);
          }
        } else if (todo.dueDate <= now) {
          // Deduped persistently: one nudge per task per deadline, ever.
          const key = nudgeKey(id, todo.dueDate);
          if (!tryReserveNudge(key)) continue;
          if (!(await isNudged(key))) {
            await markNudged(key);
            await showOverdueNudge(todo.text || 'Task', language, id);
            if (scheduled.current.has(id)) scheduled.current.delete(id);
          }
        }
      }

      for (const [id] of Array.from(scheduled.current.entries())) {
        if (!seen.has(id)) {
          cancelDeadlineReminder(id);
          scheduled.current.delete(id);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [todos, language]);

  // Dismiss leftover overdue notifications for tasks that are no longer
  // overdue (completed / rescheduled) — the "old notification you can't
  // clear" that reappears even after swiping it away.
  useEffect(() => {
    const notifApi = Notifications;
    if (!notifApi?.dismissNotificationAsync || !todos || !Array.isArray(todos)) return;
    todos.forEach((todo) => {
      if (isTempId(todo?._id)) return;
      const notOverdue = todo.status === 'done' || todo.isCompleted;
      if (notOverdue && typeof todo._id === 'string') {
        notifApi.dismissNotificationAsync(`overdue_${todo._id}`).catch(() => {});
      }
    });
  }, [todos]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const current = todosRef.current;
        if (current && Array.isArray(current)) {
          // Re-check against the persisted set: anything not yet nudged for
          // its current deadline fires once; everything else stays quiet.
          const now = getServerNow();
          (async () => {
            for (const todo of current) {
              if (isTempId(todo?._id)) continue;
              // Repeating series never raise an overdue nudge (see run()).
              if ((todo.repeatPeriod || 'none') !== 'none') continue;
              if (
                ACTIVE.has(todo.status) &&
                !todo.isCompleted &&
                typeof todo.dueDate === 'number' &&
                todo.dueDate <= now
              ) {
                const key = nudgeKey(String(todo._id), todo.dueDate);
                if (!tryReserveNudge(key)) continue;
                if (!(await isNudged(key))) {
                  await markNudged(key);
                  await showOverdueNudge(todo.text || 'Task', language, String(todo._id));
                }
              }
            }
          })();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [language]);
}
