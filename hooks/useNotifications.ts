import { useState, useEffect } from 'react';
import { requestPermissionsAsync, ensureNotificationChannels, Notifications } from '../utils/notifications';

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
      } catch (_) {}

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
