import { ThemeProvider } from "@/hooks/useTheme";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import "fast-text-encoding";
import "react-native-get-random-values";
import "../utils/periodicSyncManager";
import {
  useFonts,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
  Cairo_900Black,
} from '@expo-google-fonts/cairo';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "https://dummy-fallback.convex.cloud";
const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

import WelcomeOnboarding from "@/components/WelcomeOnboarding";
import ScreenBackground from "@/components/ScreenBackground";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useOfflineFirstInit } from "@/hooks/useOfflineFirstInit";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useSyncManager } from "@/hooks/useSyncManager";
import { useTranslation } from "@/utils/i18n";
import { NOTIFICATION_CATEGORIES, Notifications, TIMER_ACTIONS } from "@/utils/notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

// Register the background task (already defined in backgroundTask.ts via defineTask)

function RootLayoutContent() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
    Cairo_900Black,
    ArchivoBlack_400Regular,
  });

  useSyncManager();
  const { isInitialized, migrationInProgress, error: offlineError } = useOfflineFirstInit();
  const { hasPermission } = useNotifications();
  const { isLoading, language, setLanguage } = useAuth();
  const { t } = useTranslation(language);
  const { isFirstLaunch, completeOnboarding } = useOnboarding();

  useEffect(() => {
    if (Platform.OS !== 'web' && Notifications?.setNotificationCategoryAsync) {
      Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.TIMER_ACTIVE, [
        {
          identifier: TIMER_ACTIONS.PAUSE,
          buttonTitle: t.pause || 'Pause',
        },
        {
          identifier: TIMER_ACTIONS.RESUME,
          buttonTitle: t.resume || 'Resume',
        },
        {
          identifier: TIMER_ACTIONS.RESET,
          buttonTitle: t.reset || 'Reset',
          options: {
            isDestructive: true,
          }
        },
      ]);

      Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.TIMER_COMPLETED, [
        {
          identifier: TIMER_ACTIONS.RESET,
          buttonTitle: t.reset || 'Reset',
          options: {
            isDestructive: true,
          }
        },
      ]);
    }

    
    // Hide splash screen once loading, onboarding check, and font assets are complete
    if (!isLoading && isFirstLaunch !== null && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [language, t, isLoading, isFirstLaunch, fontsLoaded]);

  // Still checking storage, auth, or fonts
  if (isLoading || isFirstLaunch === null || !fontsLoaded) return null;

  if (isFirstLaunch) {
    return (
      <WelcomeOnboarding
        onComplete={async (lang) => {
          await setLanguage(lang);
          await completeOnboarding();
        }}
      />
    );
  }

  return (
    <ScreenBackground>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goals-detail" options={{ animation: 'slide_from_right', gestureEnabled: true }} />
      </Stack>
    </ScreenBackground>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <KeyboardProvider>
          <ConvexProvider client={convex}>
            <AuthProvider>
              <RootLayoutContent />
            </AuthProvider>
          </ConvexProvider>
        </KeyboardProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
