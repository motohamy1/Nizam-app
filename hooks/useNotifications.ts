import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestPermissionsAsync, ensureNotificationChannels, cleanupLegacyScheduledNotifications, Notifications } from '../utils/notifications';

const CLEANUP_FLAG = 'NOTIF_CHANNEL_MIGRATION_V2';

export function useNotifications() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    async function initNotifications() {
      if (!Notifications) {
        setHasPermission(false);
        return;
      }

      // Channels must exist independent of permission state — Android drops
      // notifications scheduled to a missing channel, and the OS caches
      // channel config permanently. Never gate this behind the granted check.
      try {
        await ensureNotificationChannels();
      } catch {}

      // One-time: purge scheduled notifications pointing at pre-v2 channels
      // so they can't fire with the old/missing sound after this update.
      try {
        const done = await AsyncStorage.getItem(CLEANUP_FLAG);
        if (!done) {
          await cleanupLegacyScheduledNotifications();
          await AsyncStorage.setItem(CLEANUP_FLAG, '1');
        }
      } catch {}

      // First check existing status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      // If already granted, channels are now ensured above — just set it.
      if (existingStatus === 'granted') {
        setHasPermission(true);
        return;
      }

      const granted = await requestPermissionsAsync();
      setHasPermission(granted);
    }

    initNotifications();
  }, []);

  return { hasPermission };
}
