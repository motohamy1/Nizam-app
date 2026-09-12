import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_PREFERENCE_KEY = 'notificationSoundPreference';

/** Bundled .wav files in assets/sounds (plus legacy alarm_tone.wav). */
export type BundledSound =
  | 'timer_done.wav'
  | 'subtask_done.wav'
  | 'reminder.wav'
  | 'success.wav'
  | 'morning.wav'
  | 'evening.wav'
  | 'overdue.wav';

export type NotificationSound = 'default' | BundledSound | 'alarm_tone.wav' | 'chime' | 'alert' | 'zen' | 'success';

export type NotificationKind =
  | 'task'
  | 'subtask'
  | 'reminder'
  | 'completion'
  | 'morning'
  | 'evening'
  | 'overdue';

/** Curated sound per notification kind — the "unique sound per type" map. */
export const TYPE_SOUND: Record<NotificationKind, BundledSound> = {
  task: 'timer_done.wav',
  subtask: 'subtask_done.wav',
  reminder: 'reminder.wav',
  completion: 'success.wav',
  morning: 'morning.wav',
  evening: 'evening.wav',
  overdue: 'overdue.wav',
};

export const SOUND_META: { file: BundledSound; labelEn: string; labelAr: string; purposeEn: string; purposeAr: string }[] = [
  { file: 'timer_done.wav', labelEn: 'Timer Done', labelAr: 'انتهاء المؤقت', purposeEn: 'Task countdown finished', purposeAr: 'انتهاء العد التنازلي للمهمة' },
  { file: 'subtask_done.wav', labelEn: 'Subtask Done', labelAr: 'انتهاء مهمة فرعية', purposeEn: 'Lighter chime for subtasks', purposeAr: 'نغمة خفيفة للمهام الفرعية' },
  { file: 'reminder.wav', labelEn: 'Reminder', labelAr: 'تذكير', purposeEn: 'Note & task reminders', purposeAr: 'تذكيرات المهام والملاحظات' },
  { file: 'success.wav', labelEn: 'Success', labelAr: 'إنجاز', purposeEn: 'Task completed confirmation', purposeAr: 'تأكيد إتمام المهمة' },
  { file: 'morning.wav', labelEn: 'Morning', labelAr: 'صباحي', purposeEn: 'Morning daily summary', purposeAr: 'ملخص الصباح اليومي' },
  { file: 'evening.wav', labelEn: 'Evening', labelAr: 'مسائي', purposeEn: 'Evening review', purposeAr: 'مراجعة المساء' },
  { file: 'overdue.wav', labelEn: 'Overdue', labelAr: 'متأخر', purposeEn: 'Deadline passed nudge', purposeAr: 'تنبيه تجاوز الموعد' },
];

/** Legacy values from the old picker map to real bundled files. */
const LEGACY_MAP: Record<string, BundledSound> = {
  'alarm_tone.wav': 'timer_done.wav',
  chime: 'reminder.wav',
  alert: 'overdue.wav',
  zen: 'evening.wav',
  success: 'success.wav',
};

const VALID: string[] = ['default', ...SOUND_META.map((s) => s.file)];

export const getNotificationSound = async (): Promise<NotificationSound> => {
  try {
    const sound = await AsyncStorage.getItem(SOUND_PREFERENCE_KEY);
    if (!sound) return 'default';
    if ((VALID as string[]).includes(sound)) return sound as NotificationSound;
    if (sound in LEGACY_MAP) {
      const mapped = LEGACY_MAP[sound];
      await AsyncStorage.setItem(SOUND_PREFERENCE_KEY, mapped);
      return mapped;
    }
  } catch (error) {
    console.error('Error getting notification sound preference:', error);
  }
  return 'default';
};

export const setNotificationSound = async (sound: NotificationSound): Promise<void> => {
  try {
    // Persist legacy picks as their mapped modern file so channels always resolve.
    const persist = sound in LEGACY_MAP ? LEGACY_MAP[sound] : sound;
    await AsyncStorage.setItem(SOUND_PREFERENCE_KEY, persist);
  } catch (error) {
    console.error('Error setting notification sound preference:', error);
  }
};

/**
 * Resolve the actual .wav file for a notification kind.
 * 'default' (or unknown) => curated per-type sound. A concrete user pick
 * overrides every kind so the Settings preview/selection stays meaningful.
 */
export const resolveKindSound = async (kind: NotificationKind): Promise<BundledSound> => {
  const pref = await getNotificationSound();
  if (pref === 'default') return TYPE_SOUND[kind];
  if ((VALID as string[]).includes(pref as string)) return pref as BundledSound;
  return TYPE_SOUND[kind];
};
