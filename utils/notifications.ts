import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type * as NotificationsType from 'expo-notifications';
import { resolveKindSound, TYPE_SOUND, type NotificationKind } from './soundPreferences';
import { translations } from './i18n';

export const getTimerNotificationId = (taskId: string) => `timer_${taskId}`;
export const getMorningNotificationId = () => `daily_morning_9am`;
export const getEveningNotificationId = () => `daily_evening_8pm`;
export const getDeadlineNotificationId = (taskId: string) => `deadline_${taskId}`;

/** Repeat periods supported for reminders/meetings. */
export type RepeatPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';

export const REPEAT_PERIODS: Exclude<RepeatPeriod, 'none'>[] = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];

/** Hard cap on scheduled occurrences — protects the OS notification budget. */
export const MAX_REPEAT_COUNT = 60;

/**
 * Stable per-task+date id for a reminder occurrence. Using the date (not an
 * index) makes rescheduling idempotent: the same occurrence replaces its
 * previous entry instead of stacking a duplicate. The same scheme covers
 * one-shot reminders (single occurrence) and repeat series alike, so a
 * repeat can be turned off without leaving orphans.
 */
export const getReminderNotificationId = (taskId: string, occurrenceMs: number) =>
  `reminder_${taskId}_${Math.floor(occurrenceMs)}`;

/**
 * Nth occurrence of a repeat series, anchored on the first occurrence.
 * monthly/yearly clamp the day so e.g. Jan 31 + 1 month lands on the last
 * day of February instead of overflowing into March.
 */
export function computeRepeatOccurrence(firstMs: number, period: RepeatPeriod, index: number): number {
  if (period === 'none' || index <= 0) return firstMs;
  const d = new Date(firstMs);
  switch (period) {
    case 'hourly':
      return firstMs + index * 3600000;
    case 'daily':
      return firstMs + index * 86400000;
    case 'weekly':
      return firstMs + index * 7 * 86400000;
    case 'monthly': {
      const day = d.getDate();
      const target = new Date(d.getFullYear(), d.getMonth() + index, 1, d.getHours(), d.getMinutes(), 0, 0);
      const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      target.setDate(Math.min(day, lastDay));
      return target.getTime();
    }
    case 'yearly': {
      const target = new Date(d.getFullYear() + index, d.getMonth(), 1, d.getHours(), d.getMinutes(), 0, 0);
      const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      target.setDate(Math.min(d.getDate(), lastDay));
      return target.getTime();
    }
    default:
      return firstMs;
  }
}

/** Last occurrence timestamp of a repeat series (== first for one-shots). */
export function computeRepeatEnd(firstMs: number, period: RepeatPeriod, count: number): number {
  if (period === 'none' || !count || count <= 1) return firstMs;
  return computeRepeatOccurrence(firstMs, period, count - 1);
}

const clampRepeatCount = (count: number) => Math.max(1, Math.min(MAX_REPEAT_COUNT, Math.floor(count) || 1));

/**
 * Schedule every occurrence of a repeat series. Each occurrence is an
 * independent DATE trigger with a date-keyed identifier, so re-running this
 * (app relaunch, edit) replaces instead of duplicating. Past occurrences are
 * skipped; nothing is scheduled when the whole series is in the past.
 *
 * `repeatCount` specifies how many times it should repeat beyond the first occurrence.
 * (e.g. repeatCount = 1 means 1 repeat after the initial occurrence, total 2).
 */
export async function scheduleRepeatingReminder(
  taskId: string,
  title: string,
  firstOccurrenceMs: number,
  repeatPeriod: RepeatPeriod = 'none',
  repeatCount: number = 1,
  language: string = 'en'
): Promise<number> {
  if (!Notifications) return 0;
  if (repeatPeriod === 'none') return 0; // one-shots go through scheduleReminderNotification

  const t: any = translations[language as keyof typeof translations] || translations.en;
  // repeatCount is the number of times it repeats; total occurrences can be up to count + 1.
  const maxOccurrences = clampRepeatCount(repeatCount) + 1;
  const now = Date.now();

  try {
    const file = await resolveKindSound('reminder').catch(() => TYPE_SOUND.reminder);
    await ensureNotificationChannels().catch(() => {});

    let scheduled = 0;
    let idx = 0;
    const maxScan = 500;
    while (scheduled < maxOccurrences && idx < maxScan) {
      const occurrence = computeRepeatOccurrence(firstOccurrenceMs, repeatPeriod, idx);
      idx++;
      // If occurrence is more than 30s in the past, skip it.
      // If it is due right now (or within the last 30s), trigger 1.5s in future.
      let triggerDate = new Date(occurrence);
      if (occurrence <= now) {
        if (scheduled === 0 && idx === 1 && occurrence >= now - 30000) {
          triggerDate = new Date(now + 1500);
        } else {
          continue;
        }
      }

      await Notifications.scheduleNotificationAsync({
        identifier: getReminderNotificationId(taskId, occurrence),
        content: {
          title: t.reminderNotifTitle || '⏰ Reminder',
          body: (t.reminderNotifBody || 'Time for: ') + `"${title}"`,
          sound: iosSound(file),
          priority: Notifications.AndroidNotificationPriority?.MAX,
          autoDismiss: true,
          vibrate: [0, 500, 200, 500, 200, 500],
          data: { taskId, occurrence } as any,
        } as any,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: CHANNEL_IDS.reminders,
        } as any,
      });
      scheduled++;
    }
    return scheduled;
  } catch (error) {
    console.warn('Error scheduling repeating reminder:', error);
    return 0;
  }
}

/**
 * Cancel every scheduled occurrence of a reminder series AND dismiss any delivered
 * notifications from the device tray for this task.
 */
export async function cancelReminderSeries(taskId: string): Promise<void> {
  if (!Notifications || !taskId) return;
  try {
    const prefix = `reminder_${taskId}_`;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
    for (const item of scheduled) {
      const identifier = item?.identifier;
      if (typeof identifier !== 'string') continue;
      if (identifier.startsWith(prefix) || identifier === `reminder_${taskId}`) {
        await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
      }
    }
    // Also dismiss any already delivered to notification center
    if (Notifications.dismissNotificationAsync) {
      await Notifications.dismissNotificationAsync(`reminder_${taskId}`).catch(() => {});
      const presented = await Notifications.getPresentedNotificationsAsync().catch(() => []);
      for (const item of presented) {
        const id = item?.request?.identifier;
        if (typeof id === 'string' && (id.startsWith(prefix) || id === `reminder_${taskId}`)) {
          await Notifications.dismissNotificationAsync(id).catch(() => {});
        }
      }
    }
  } catch (error) {
    console.warn('Error cancelling reminder series:', error);
  }
}

/**
 * Dismiss ALL active / delivered notifications for a given taskId from the OS notification center.
 */
export async function dismissAllNotificationsForTask(taskId: string): Promise<void> {
  if (!Notifications || !taskId) return;
  try {
    await Notifications.dismissNotificationAsync(getTimerNotificationId(taskId)).catch(() => {});
    await Notifications.dismissNotificationAsync(getDeadlineNotificationId(taskId)).catch(() => {});
    await Notifications.dismissNotificationAsync(`overdue_${taskId}`).catch(() => {});
    await Notifications.dismissNotificationAsync(`completion_${taskId}`).catch(() => {});
    await cancelReminderSeries(taskId).catch(() => {});
  } catch {}
}

export interface TimerNotificationData {
  taskId: string;
  durationMinutes: number;
}

export const NOTIFICATION_CATEGORIES = {
  TIMER_ACTIVE: 'TIMER_ACTIVE',
  TIMER_COMPLETED: 'TIMER_COMPLETED',
} as const;

export const TIMER_ACTIONS = {
  PAUSE: 'pause_timer',
  RESUME: 'resume_timer',
  RESET: 'reset_timer',
} as const;

/** One Android channel per notification kind — each with its own sound.
 *  v2: channel IDs were versioned because Android caches a channel's sound
 *  permanently; bumping the id is the only way an installed app actually
 *  picks up a changed/absent sound (delete+recreate of the same id can be
 *  ignored by some OEM ROMs). */
export const CHANNEL_IDS = {
  tasks: 'tasks_v2',
  subtasks: 'subtasks_v2',
  reminders: 'reminders_v2',
  completion: 'completion_v2',
  morning: 'daily_morning_v2',
  evening: 'daily_evening_v2',
  overdue: 'overdue_v2',
} as const;

/** Channels from earlier builds — deleted once so the OS forgets them. */
const LEGACY_CHANNELS = [
  'daily',
  'tasks',
  'subtasks',
  'reminders',
  'completion',
  'daily_morning',
  'daily_evening',
  'overdue',
];

const isExpoGo = Constants.executionEnvironment === 'storeClient';

function getNotificationsAPI(): typeof NotificationsType | null {
  if (isExpoGo && Platform.OS === 'android') {
    return null;
  }
  try {
    return require('expo-notifications');
  } catch (e) {
    console.warn('Failed to load expo-notifications:', e);
    return null;
  }
}

export const Notifications = getNotificationsAPI();

/** Android wants the basename, iOS wants the full filename. */
const androidSound = (file: string) => file.replace(/\.wav$/i, '');
const iosSound = (file: string) => file;

/**
 * Create every channel with its curated per-type sound.
 * Idempotent — will NOT delete existing channels unless forceRecreate is true.
 * This prevents Android from dropping in-flight notifications or corrupting sound.
 */
let channelsInitialized = false;

export async function ensureNotificationChannels(forceRecreate = false): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return;
  if (channelsInitialized && !forceRecreate) return;

  for (const legacy of LEGACY_CHANNELS) {
    try {
      await Notifications.deleteNotificationChannelAsync(legacy);
    } catch {}
  }

  const defs: {
    id: string;
    name: string;
    importance: any;
    kind: NotificationKind;
    vibrationPattern: number[];
    lightColor: string;
    bypassDnd: boolean;
  }[] = [
    { id: CHANNEL_IDS.tasks, name: 'Task Timers', importance: Notifications.AndroidImportance.MAX, kind: 'task', vibrationPattern: [0, 500, 200, 500, 200, 500], lightColor: '#FF231F7C', bypassDnd: true },
    { id: CHANNEL_IDS.subtasks, name: 'Subtask Timers', importance: Notifications.AndroidImportance.HIGH, kind: 'subtask', vibrationPattern: [0, 400, 150, 400, 150, 400], lightColor: '#D4F82D', bypassDnd: false },
    { id: CHANNEL_IDS.reminders, name: 'Reminders', importance: Notifications.AndroidImportance.MAX, kind: 'reminder', vibrationPattern: [0, 500, 200, 500, 200, 500], lightColor: '#FF5C77', bypassDnd: true },
    { id: CHANNEL_IDS.completion, name: 'Completions', importance: Notifications.AndroidImportance.HIGH, kind: 'completion', vibrationPattern: [0, 250, 150, 250], lightColor: '#4ADE80', bypassDnd: false },
    { id: CHANNEL_IDS.morning, name: 'Morning Summary', importance: Notifications.AndroidImportance.HIGH, kind: 'morning', vibrationPattern: [0, 250, 150, 250], lightColor: '#4A90D9', bypassDnd: false },
    { id: CHANNEL_IDS.evening, name: 'Evening Review', importance: Notifications.AndroidImportance.HIGH, kind: 'evening', vibrationPattern: [0, 250, 150, 250], lightColor: '#4A90D9', bypassDnd: false },
    { id: CHANNEL_IDS.overdue, name: 'Overdue Alerts', importance: Notifications.AndroidImportance.MAX, kind: 'overdue', vibrationPattern: [0, 500, 200, 500, 200, 500], lightColor: '#FF3B30', bypassDnd: true },
  ];

  for (const def of defs) {
    try {
      if (forceRecreate) {
        await Notifications.deleteNotificationChannelAsync(def.id).catch(() => {});
      } else {
        const existing = await Notifications.getNotificationChannelAsync(def.id).catch(() => null);
        if (existing) continue;
      }
    } catch {}

    const file = await resolveKindSound(def.kind).catch(() => TYPE_SOUND[def.kind]);
    await Notifications.setNotificationChannelAsync(def.id, {
      name: def.name,
      importance: def.importance,
      sound: androidSound(file),
      enableVibrate: true,
      vibrationPattern: def.vibrationPattern,
      lightColor: def.lightColor,
      enableLights: true,
      bypassDnd: def.bypassDnd,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    } as any).catch(() => {});
  }
  channelsInitialized = true;
}

export async function updateNotificationSoundPreference(_soundFile: any) {
  if (!Notifications || Platform.OS !== 'android') return;
  // Bumping or recreating on explicit user change in Settings
  await ensureNotificationChannels(true);
}

/**
 * One-time migration after a channel-ID version bump: drop every scheduled
 * notification that targets a legacy channel, so stale entries can't fire
 * with the old (wrong/missing) sound after the update. The hooks reschedule
 * everything on the next pass.
 */
export async function cleanupLegacyScheduledNotifications(): Promise<void> {
  if (!Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      const channelId = (item?.trigger as any)?.channelId;
      if (channelId && LEGACY_CHANNELS.includes(channelId)) {
        try {
          await Notifications.cancelScheduledNotificationAsync(item.identifier);
        } catch {}
      }
    }
  } catch (e) {
    console.warn('Legacy scheduled-notification cleanup failed:', e);
  }
}

if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority?.MAX,
      } as any),
    });
  } catch (error) {
    console.warn('Error setting notification handler:', error);
  }
}

export async function requestPermissionsAsync() {
  if (!Notifications) {
    console.warn('Notifications bypassed for Expo Go Android.');
    return false;
  }

  try {
    // Always ensure channels first — never gate this behind granted status.
    await ensureNotificationChannels();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    // Re-ensure after grant in case the OS wiped channels on a fresh grant.
    if (finalStatus === 'granted') {
      await ensureNotificationChannels();
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
}

export async function scheduleTimerCompletion(
  taskId: string,
  text: string,
  durationMs: number,
  isSubtask = false,
  language: string = 'en'
): Promise<string> {
  if (!Notifications || !taskId) return '';

  const t: any = translations[language as keyof typeof translations] || translations.en;

  try {
    const kind: NotificationKind = isSubtask ? 'subtask' : 'task';
    const file = await resolveKindSound(kind).catch(() => TYPE_SOUND[kind]);
    const identifier = getTimerNotificationId(taskId);
    const triggerDate = new Date(Date.now() + Math.max(1000, durationMs));

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: isSubtask ? t.notifSubtaskTitle : t.notifTaskTitle,
        body: (isSubtask ? t.notifSubtaskBody : t.notifTaskBody) + `"${text}"`,
        sound: iosSound(file),
        priority: Notifications.AndroidNotificationPriority?.MAX,
        vibrate: [0, 500, 200, 500, 200, 500],
        categoryIdentifier: NOTIFICATION_CATEGORIES.TIMER_COMPLETED,
        data: { taskId, durationMinutes: Math.round(durationMs / 60000) } as TimerNotificationData,
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: isSubtask ? CHANNEL_IDS.subtasks : CHANNEL_IDS.tasks,
      } as any,
    });
    return identifier;
  } catch (error) {
    console.warn('Error scheduling timer notification:', error);
    return '';
  }
}

export async function updateTimerNotificationText(
  taskId: string,
  newText: string,
  isSubtask = false,
  language: string = 'en'
) {
  if (!Notifications || !taskId) return;
  const identifier = getTimerNotificationId(taskId);
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
    const existing = scheduled.find((n) => n.identifier === identifier);
    if (existing) {
      const t: any = translations[language as keyof typeof translations] || translations.en;
      await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          ...existing.content,
          title: isSubtask ? t.notifSubtaskTitle : t.notifTaskTitle,
          body: (isSubtask ? t.notifSubtaskBody : t.notifTaskBody) + `"${newText}"`,
        } as any,
        trigger: existing.trigger as any,
      });
    }
  } catch (error) {
    console.warn('Error updating timer notification:', error);
  }
}

export async function cancelTaskNotification(taskId: string) {
  if (!Notifications || !taskId) return;

  try {
    const identifier = getTimerNotificationId(taskId);
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
    if (Notifications.dismissNotificationAsync) {
      await Notifications.dismissNotificationAsync(identifier).catch(() => {});
    }
  } catch (error) {
    console.log('Error cancelling notification:', error);
  }
}

/**
 * Schedule a notification for a specific reminder at its due date/time.
 * `taskId` is optional but recommended: it keys the identifier by task+date
 * so re-saving the same reminder replaces the previous entry instead of
 * stacking duplicates (and so the series-cancel sweep can find it).
 */
export async function scheduleReminderNotification(
  title: string,
  dueDateMs: number,
  language: string = 'en',
  taskId?: string
): Promise<string> {
  if (!Notifications) return '';

  const t: any = translations[language as keyof typeof translations] || translations.en;

  try {
    const file = await resolveKindSound('reminder').catch(() => TYPE_SOUND.reminder);
    const now = Date.now();
    // If the reminder time passed more than 30s ago without repeat, skip it.
    if (dueDateMs < now - 30000) return '';
    const triggerDate = dueDateMs <= now ? new Date(now + 1500) : new Date(dueDateMs);

    const identifier = taskId ? getReminderNotificationId(taskId, dueDateMs) : undefined;
    const id = await Notifications.scheduleNotificationAsync({
      ...(identifier ? { identifier } : {}),
      content: {
        title: t.reminderNotifTitle || '⏰ Reminder',
        body: (t.reminderNotifBody || 'Time for: ') + `"${title}"`,
        sound: iosSound(file),
        priority: Notifications.AndroidNotificationPriority?.MAX,
        sticky: false,
        autoDismiss: true,
        vibrate: [0, 500, 200, 500, 200, 500],
        data: taskId ? { taskId, dueDate: dueDateMs } : undefined,
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: CHANNEL_IDS.reminders,
      } as any,
    });
    return id;
  } catch (error) {
    console.warn('Error scheduling reminder notification:', error);
    return '';
  }
}

/**
 * Show an immediate notification when a task is completed.
 * Keyed by taskId to replace any existing completion notice in the tray.
 */
export async function showTaskCompletedNotification(title: string, language: string = 'en', taskId?: string) {
  if (!Notifications) return;

  const t: any = translations[language as keyof typeof translations] || translations.en;

  try {
    const file = await resolveKindSound('completion').catch(() => TYPE_SOUND.completion);
    const identifier = taskId ? `completion_${taskId}` : undefined;
    
    // Dismiss any active timer notification for this task first so they don't stack
    if (taskId && Notifications.dismissNotificationAsync) {
      await Notifications.dismissNotificationAsync(getTimerNotificationId(taskId)).catch(() => {});
    }

    await Notifications.scheduleNotificationAsync({
      ...(identifier ? { identifier } : {}),
      content: {
        title: t.taskCompletedNotifTitle || '🎯 Task Completed!',
        body: (t.taskCompletedNotifBody || 'Great job finishing: ') + `"${title}"`,
        sound: iosSound(file),
        priority: Notifications.AndroidNotificationPriority?.HIGH,
        data: taskId ? { taskId } : undefined,
      } as any,
      trigger: {
        channelId: CHANNEL_IDS.completion,
      } as any,
    });
  } catch (error) {
    console.warn('Error showing task completed notification:', error);
  }
}

/**
 * Schedule a DATE-trigger reminder when a task's dueDate arrives.
 * Best practice: tasks with deadlines notify at the deadline instead of
 * silently flipping to overdue.
 */
export async function scheduleDeadlineReminder(
  taskId: string,
  title: string,
  dueDateMs: number,
  language: string = 'en'
): Promise<string> {
  if (!Notifications) return '';

  const t: any = translations[language as keyof typeof translations] || translations.en;

  try {
    const now = Date.now();
    if (dueDateMs <= now) return '';
    const file = await resolveKindSound('overdue').catch(() => TYPE_SOUND.overdue);
    await ensureNotificationChannels().catch(() => {});
    const id = await Notifications.scheduleNotificationAsync({
      identifier: getDeadlineNotificationId(taskId),
      content: {
        title: t.deadlineNotifTitle || '⏳ Due now',
        body: (t.deadlineNotifBody || 'This task is due: ') + `"${title}"`,
        sound: iosSound(file),
        priority: Notifications.AndroidNotificationPriority?.MAX,
        vibrate: [0, 500, 200, 500, 200, 500],
        data: { taskId } as any,
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(dueDateMs),
        channelId: CHANNEL_IDS.overdue,
      } as any,
    });
    return id;
  } catch (error) {
    console.warn('Error scheduling deadline notification:', error);
    return '';
  }
}

export async function cancelDeadlineReminder(taskId: string) {
  if (!Notifications || !taskId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(getDeadlineNotificationId(taskId));
  } catch (error) {
    console.log('Error cancelling deadline notification:', error);
  }
}

/** Immediate nudge when a deadline has just passed. */
export async function showOverdueNudge(title: string, language: string = 'en', taskId?: string) {
  if (!Notifications) return;

  const t: any = translations[language as keyof typeof translations] || translations.en;

  try {
    const file = await resolveKindSound('overdue').catch(() => TYPE_SOUND.overdue);
    await Notifications.scheduleNotificationAsync({
      // Stable per-task identifier: a repeat for the same task REPLACES the
      // previous entry instead of stacking a new one (was the spam cause).
      identifier: taskId ? `overdue_${taskId}` : undefined,
      content: {
        title: t.overdueNotifTitle || '⚠️ Overdue',
        body: (t.overdueNotifBody || 'You missed the deadline for: ') + `"${title}"`,
        sound: iosSound(file),
        priority: Notifications.AndroidNotificationPriority?.MAX,
        vibrate: [0, 500, 200, 500, 200, 500],
      } as any,
      // Immediate delivery. Keep channelId so the overdue channel's sound
      // and importance still apply (Android reads them from the channel).
      trigger: {
        channelId: CHANNEL_IDS.overdue,
      } as any,
    });
  } catch (error) {
    console.warn('Error showing overdue nudge:', error);
  }
}

export async function scheduleMorningReminder(todos: any[], language: string = 'en') {
  if (!Notifications) return;

  try {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const tomorrowStart = todayStart + 86400000;

    const todayTasks = todos.filter((t) => {
      if (t.status === 'done') return false;
      return !t.date || (t.date >= todayStart && t.date < tomorrowStart);
    });

    const count = todayTasks.length;

    if (count === 0) {
      await Notifications.cancelScheduledNotificationAsync(getMorningNotificationId());
      return;
    }

    const file = await resolveKindSound('morning').catch(() => TYPE_SOUND.morning);
    const body = count === 1 ? `You have 1 task scheduled for today.` : `You have ${count} tasks scheduled for today.`;

    await Notifications.scheduleNotificationAsync({
      identifier: getMorningNotificationId(),
      content: {
        title: 'Good Morning! 🌅',
        body,
        sound: iosSound(file),
        categoryIdentifier: 'daily_morning',
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
        channelId: CHANNEL_IDS.morning,
      } as any,
    });
  } catch (error) {
    console.warn('Error scheduling morning reminder:', error);
  }
}

export async function scheduleEveningReminder(todos: any[], language: string = 'en') {
  if (!Notifications) return;

  try {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const missedTasks = todos.filter((t) => {
      if (t.status === 'done') return false;
      if (t.status === 'not_done') return true;
      if (t.date !== undefined && t.date < todayStart) return true;
      return false;
    });

    const count = missedTasks.length;

    if (count === 0) {
      await Notifications.cancelScheduledNotificationAsync(getEveningNotificationId());
      return;
    }

    const file = await resolveKindSound('evening').catch(() => TYPE_SOUND.evening);
    const body = count === 1 ? `You missed 1 task. Let's plan for tomorrow!` : `You missed ${count} tasks. Let's plan for tomorrow!`;

    await Notifications.scheduleNotificationAsync({
      identifier: getEveningNotificationId(),
      content: {
        title: 'Evening Summary 🌙',
        body,
        sound: iosSound(file),
        categoryIdentifier: 'daily_evening',
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
        channelId: CHANNEL_IDS.evening,
      } as any,
    });
  } catch (error) {
    console.warn('Error scheduling evening reminder:', error);
  }
}
