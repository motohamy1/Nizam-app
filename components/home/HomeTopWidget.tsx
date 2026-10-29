import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { api } from '@/convex/_generated/api';
import DateBar from '@/components/DateBar';

interface HomeTopWidgetProps {
  selectedDate: number;
  todayStart: number;
  onSelectDate: (dayStart: number) => void;
  onOpenDayPlanner?: (dayTimestamp: number) => void;
  homeStyles: any;
  isArabic?: boolean;
  taskCounts?: Map<number, number>;
  onActivePillLayout?: (layout: { x: number; y: number; width: number; height: number; cx: number }) => void;
}

export const LIME_ACCENT = '#8E2CAC';
export const SAND_GOLD_ACCENT = '#f6d7a1';
export const PURPLE_SHIMMER_ACCENT = '#641D7F';
export const PURPLE_SHIMMER_GRADIENT = ['#3B0E4C', '#641D7F', '#8E2CAC', '#521466'] as const;

export const HomeTopWidget: React.FC<HomeTopWidgetProps> = ({
  selectedDate,
  todayStart,
  onSelectDate,
  onOpenDayPlanner,
  homeStyles,
  isArabic = false,
  taskCounts,
  onActivePillLayout,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();
  const isLocalGuest = typeof userId === 'string' && userId.startsWith('guest_');
  const userSettings = useOfflineQuery<any>(
    'auth.getUserSettings',
    api.auth.getUserSettings,
    userId && !isLocalGuest ? { userId } : 'skip'
  );

  const widgetRef = useRef<any>(null);
  const widgetWindowRef = useRef<{ pageX: number; pageY: number } | null>(null);

  const measureWidget = useCallback(() => {
    widgetRef.current?.measureInWindow((widgetPageX: number, widgetPageY: number) => {
      if (widgetPageX !== undefined && widgetPageY !== undefined) {
        widgetWindowRef.current = { pageX: widgetPageX, pageY: widgetPageY };
      }
    });
  }, []);

  const handleProfilePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/settings');
  }, [router]);

  const handlePillWindowLayout = useCallback(
    (pillLayout: { pageX: number; pageY: number; width: number; height: number }) => {
      if (!onActivePillLayout) return;
      const widget = widgetWindowRef.current;
      if (widget) {
        const x = pillLayout.pageX - widget.pageX;
        const y = pillLayout.pageY - widget.pageY;
        onActivePillLayout({
          x,
          y,
          width: pillLayout.width,
          height: pillLayout.height,
          cx: x + pillLayout.width / 2,
        });
      } else {
        widgetRef.current?.measureInWindow((widgetPageX: number, widgetPageY: number) => {
          if (widgetPageX !== undefined && widgetPageY !== undefined) {
            widgetWindowRef.current = { pageX: widgetPageX, pageY: widgetPageY };
            const x = pillLayout.pageX - widgetPageX;
            const y = pillLayout.pageY - widgetPageY;
            onActivePillLayout({
              x,
              y,
              width: pillLayout.width,
              height: pillLayout.height,
              cx: x + pillLayout.width / 2,
            });
          }
        });
      }
    },
    [onActivePillLayout]
  );

  const profileButton = (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handleProfilePress}
      accessibilityRole="button"
      accessibilityLabel={isArabic ? 'الملف الشخصي' : 'User Profile'}
      style={styles.profileBtn}
    >
      {userSettings?.profilePictureUrl ? (
        <Image
          source={{ uri: userSettings.profilePictureUrl }}
          style={styles.profileAvatar}
          contentFit="cover"
        />
      ) : (
        <Ionicons name="person" size={17} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <View ref={widgetRef} onLayout={measureWidget} style={styles.shadowWrapper}>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top + 6, Platform.OS === 'android' ? 24 : 10),
          },
        ]}
      >
        {/* 1. Base Royal Purple Rich Gradient */}
        <LinearGradient
          colors={PURPLE_SHIMMER_GRADIENT}
          locations={[0, 0.35, 0.72, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* 2. Micro-Shimmer Glitter Texture Overlay */}
        <Image
          source={require('@/assets/images/purple-shimmer.jpg')}
          contentFit="cover"
          style={[StyleSheet.absoluteFill, { opacity: 0.38 }]}
        />

        {/* 3. Soft Specular Sheen Overlay */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.14)', 'rgba(206, 126, 237, 0.08)', 'transparent']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 0.85 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Row 1 & 2: Date info + Profile avatar in row 1, DateBar wheel in row 2 */}
        <DateBar
          selectedDate={selectedDate}
          todayStart={todayStart}
          onSelectDate={onSelectDate}
          onOpenDayPlanner={onOpenDayPlanner}
          homeStyles={homeStyles}
          isArabic={isArabic}
          taskCounts={taskCounts}
          defaultCollapsed={false}
          tone="purpleShimmer"
          onActivePillLayout={onActivePillLayout ? handlePillWindowLayout : undefined}
          rightAccessory={profileButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: '#2B0839',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  container: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#3B0E4C',
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
});

export default HomeTopWidget;
