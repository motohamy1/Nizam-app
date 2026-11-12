import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { scheduleMorningReminder, scheduleEveningReminder } from '../utils/notifications';

export function useDailyReminders(todos: any[] | undefined, language: string = 'en') {
  const appState = useRef(AppState.currentState);
  const todosRef = useRef(todos);
  const lastDailySignature = useRef<string>('');

  const syncDaily = (items: any[], lang: string) => {
    if (!items || !Array.isArray(items)) return;
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayCount = items.filter((t) => t.status !== 'done' && (!t.date || (t.date >= todayStart && t.date < todayStart + 86400000))).length;
    const missedCount = items.filter((t) => t.status !== 'done' && (t.status === 'not_done' || (t.date !== undefined && t.date < todayStart))).length;
    const sig = `${todayStart}:${todayCount}:${missedCount}:${lang}`;
    if (lastDailySignature.current === sig) return;
    lastDailySignature.current = sig;
    scheduleMorningReminder(items, lang);
    scheduleEveningReminder(items, lang);
  };

  useEffect(() => {
    todosRef.current = todos;
    if (todos && Array.isArray(todos)) {
      syncDaily(todos, language);
    }
  }, [todos, language]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current?.match(/inactive|background/) && nextAppState === 'active') {
        if (todosRef.current && Array.isArray(todosRef.current)) {
          syncDaily(todosRef.current, language);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [language]);
}
