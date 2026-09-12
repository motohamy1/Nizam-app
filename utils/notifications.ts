import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type * as NotificationsType from 'expo-notifications';
import { resolveKindSound, TYPE_SOUND, type NotificationKind } from './soundPreferences';

export const getTimerNotificationId = (taskId: string) => `timer_${taskId}`;
export const getMorningNotificationId = () => `daily_morning_9am`;
export const getEveningNotificationId = () => `daily_evening_8pm`;
export const getDeadlineNotificationId = (taskId: string) => `deadline_${taskId}`;

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

/** One Android channel per notification kind — each with its own sound. */
export const CHANNEL_IDS = {
  tasks: 'tasks',
  subtasks: 'subtasks',
  reminders: 'reminders',
  completion: 'completion',
  morning: 'daily_morning',
  evening: 'daily_evening',
  overdue: 'overdue',
} as const;

/** Legacy single daily channel from before the morning/evening split. */
const LEGACY_CHANNELS = ['daily'];

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
 * Create (or recreate) every channel with its curated per-type sound.
 * Idempotent — safe to call on every launch. This MUST run independent of
 * permission state: Android silently drops notifications scheduled to a
 * missing channel, and the OS caches channel config permanently.
 */
export async function ensureNotificationChannels(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return;

  for (const legacy of LEGACY_CHANNELS) {
    try {
      await Notifications.deleteNotificationChannelAsync(legacy);
    } catch (_) {}
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
    const file = await resolveKindSound(def.kind).catch(() => TYPE_SOUND[def.kind]);
    try {
      await Notifications.deleteNotificationChannelAsync(def.id);
    } catch (_) {}
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
    } as any);
  }
}

export async function updateNotificationSoundPreference(_soundFile: any) {
  if (!Notifications || Platform.OS !== 'android') return;
  // The preference is read per-kind inside ensureNotificationChannels via
  // resolveKindSound, so re-ensuring applies the new pick to all channels.
  // Pending timers keep their already-queued channel snapshot and pick the
  // new sound up on their next schedule cycle.
  await ensureNotificationChannels();
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
      const { status } = await Notifications.requestPermissionsAsync();
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

import { translations } from './i18n';

export async function scheduleTimerCompletion(
  taskId: string,
  text: string,
  durationMs: number,
  isSubtask = false,
  language: string = 'en'
): Promise<string> {
  if (!Notifications) return '';

  const t: any = translations[language as keyof typeof translations] || translations.en;

  try {
    const kind: NotificationKind = isSubtask ? 'subtask' : 'task';
    const file = await resolveKindSound(kind).catch(() => TYPE_SOUND[kind]);
    const seconds = Math.floor(durationMs / 1000);
    const identifier = getTimerNotificationId(taskId);
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
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: seconds > 0 ? seconds : 1,
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
  if (!Notifications) return;
  const identifier = getTimerNotificationId(taskId);
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const existing = scheduled.find((n) => n.identifier === identifier);
    if (existing) {
      const t: any = translations[language as keyof typeof translations] || translations.en;
      await Notifications.cancelScheduledNotificationAsync(identifier);
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
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.log('Error cancelling notification:', error);
  }
}

/**
 * Schedule a notification for a specific reminder at its due date/time.
 */
export async function scheduleReminderNotification(
  title: string,
  dueDateMs: number,
  language: string = 'en'
): Promise<string> {
  if (!Notifications) return '';

  const t: any = translations[language as keyof typeof translations] || translations.en;

  try {
    const file = await resolveKindSound('reminder').catch(() => TYPE_SOUND.reminder);
    const now = Date.now();
    // If the reminder time already passed, don't schedule
    if (dueDateMs <= now) return '';

    await ensureNotificationChannels().catch(() => {});

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: t.reminderNotifTitle || '⏰ Reminder',
        body: (t.reminderNotifBody || 'Time for: ') + `"${title}"`,
        sound: iosSound(file),
        priority: Notifications.AndroidNotificationPriority?.MAX,
        sticky: false,
        autoDismiss: false,
        vibrate: [0, 500, 200, 500, 200, 500],
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(dueDateMs),
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
 */
export async function showTaskCompletedNotification(title: string, language: string = 'en') {
  if (!Notifications) return;

  const t: any = translations[language as keyof typeof translations] || translations.en;

  try {
    const file = await resolveKindSound('completion').catch(() => TYPE_SOUND.completion);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.taskCompletedNotifTitle || '🎯 Task Completed!',
        body: (t.taskCompletedNotifBody || 'Great job finishing: ') + `"${title}"`,
        sound: iosSound(file),
        priority: Notifications.AndroidNotificationPriority?.HIGH,
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
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
export async function showOverdueNudge(title: string, language: string = 'en') {
  if (!Notifications) return;

  const t: any = translations[language as keyof typeof translations] || translations.en;

  try {
    const file = await resolveKindSound('overdue').catch(() => TYPE_SOUND.overdue);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.overdueNotifTitle || '⚠️ Overdue',
        body: (t.overdueNotifBody || 'You missed the deadline for: ') + `"${title}"`,
        sound: iosSound(file),
        priority: Notifications.AndroidNotificationPriority?.MAX,
        vibrate: [0, 500, 200, 500, 200, 500],
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
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
