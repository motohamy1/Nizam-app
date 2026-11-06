import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/hooks/useAuth';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { api } from '@/convex/_generated/api';

interface HomeTopWidgetProps {
  selectedDate?: number;
  todayStart?: number;
  onSelectDate?: (dayStart: number) => void;
  onOpenDayPlanner?: (dayTimestamp: number) => void;
  homeStyles?: any;
  isArabic?: boolean;
  taskCounts?: Map<number, number>;
  onActivePillLayout?: (layout: { x: number; y: number; width: number; height: number; cx: number }) => void;
}

export const LIME_ACCENT = '#d4ff32';
export const LIME_TOP_GRADIENT = ['#cbf42e', '#d4ff32', '#daf848', '#c4ef28'] as const;
export const COLOR_VIOLET = '#6D28D9'; // Vibrant, unmistakable Royal Violet
export const COLOR_BLACK = COLOR_VIOLET; // Backward-compatible alias
export const COLOR_GOLD_ORANGE = '#B85000';
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

  const handleProfilePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/settings');
  }, [router]);

  const handleOpenPlanner = useCallback(() => {
    if (onOpenDayPlanner) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onOpenDayPlanner(todayStart || selectedDate || Date.now());
    } else {
      router.push('/(tabs)/planner');
    }
  }, [onOpenDayPlanner, todayStart, selectedDate, router]);

  const todayFormatted = useMemo(() => {
    const ts = todayStart || selectedDate || Date.now();
    const d = new Date(ts);
    return d.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [todayStart, selectedDate, isArabic]);

  const userName = userSettings?.name?.trim() || (isArabic ? 'المبدع' : 'Creator');

  return (
    <View ref={widgetRef} style={styles.shadowWrapper}>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top + 4, Platform.OS === 'android' ? 18 : 8),
          },
        ]}
      >
        {/* 1. Base Rich Lime Gradient */}
        <LinearGradient
          colors={LIME_TOP_GRADIENT}
          locations={[0, 0.35, 0.72, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* 2. Micro-Shimmer Texture Overlay */}
        <Image
          source={require('@/assets/images/purple-shimmer.jpg')}
          contentFit="cover"
          style={[StyleSheet.absoluteFill, { opacity: 0.20 }]}
        />

        {/* 3. Granules / Film Grain Texture Overlay */}
        <Image
          source={require('@/assets/images/grain.png')}
          contentFit="cover"
          style={[StyleSheet.absoluteFill, { opacity: 0.24 }]}
        />

        {/* 4. Soft Specular Sheen Overlay */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.30)', 'rgba(255, 255, 255, 0.08)', 'transparent']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 0.85 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Content Container (Sleek, ~30% Reduced Height Footprint) */}
        <View style={styles.innerContent}>
          {/* Top Row: User Welcome Pill + Action Buttons (Planner Shortcut + Profile Avatar) */}
          <View style={[styles.topRow, isArabic && styles.rowRtl]}>
            <View style={[styles.welcomeBadge, isArabic && styles.rowRtl]}>
              <View style={styles.liveDot} />
              <Text style={styles.welcomeBadgeText} numberOfLines={1}>
                {isArabic ? `أهلاً، ${userName}` : `HI, ${userName.toUpperCase()}`}
              </Text>
              <Text style={styles.badgeDivider}>•</Text>
              <Text style={styles.badgeDateText}>{todayFormatted}</Text>
            </View>

            <View style={[styles.topActions, isArabic && styles.rowRtl]}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={handleOpenPlanner}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'فتح المخطط اليومي' : 'Open Day Planner'}
                style={styles.plannerBtn}
              >
                <Ionicons name="calendar-outline" size={14} color={COLOR_VIOLET} />
                <Text style={styles.plannerBtnText}>
                  {isArabic ? 'المخطط' : 'Planner'}
                </Text>
              </TouchableOpacity>

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
                  <Ionicons name="person" size={15} color={COLOR_VIOLET} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Bold Text Section with Two Contrasted Colors: Violet & Orange tend to Gold */}
          <View style={styles.heroSection}>
            <Text style={[styles.headline, isArabic && styles.textRtl]}>
              <Text style={styles.textViolet}>
                {isArabic ? 'خطّط بوضوح، ' : 'PLAN WITH CLARITY. '}
              </Text>
              <Text style={styles.textGoldOrange}>
                {isArabic ? 'وأنجز بأثر حقيقي.' : 'OWN YOUR MOMENTUM.'}
              </Text>
            </Text>

            <Text style={[styles.paragraph, isArabic && styles.textRtl]}>
              {isArabic ? (
                <>
                  <Text style={styles.textViolet}>مساحتك اليومية </Text>
                  <Text style={styles.textGoldOrange}>للتركيز العميق </Text>
                  <Text style={styles.textViolet}>وتنظيم المهام؛ حوّل أهدافك إلى </Text>
                  <Text style={styles.textGoldOrange}>إنجازات ملموسة </Text>
                  <Text style={styles.textViolet}>واصنع يومك بكل ثقة.</Text>
                </>
              ) : (
                <>
                  <Text style={styles.textViolet}>Your daily space to </Text>
                  <Text style={styles.textGoldOrange}>plan with intention </Text>
                  <Text style={styles.textViolet}>and execute with deep focus. Turn bold ambitions into </Text>
                  <Text style={styles.textGoldOrange}>effortless daily momentum.</Text>
                </>
              )}
            </Text>
          </View>

          {/* Productivity Pillars Pill Row */}
          <View style={[styles.pillarsRow, isArabic && styles.rowRtl]}>
            <View style={styles.pillarTag}>
              <Ionicons name="flash" size={10} color={COLOR_GOLD_ORANGE} />
              <Text style={styles.pillarText}>
                {isArabic ? 'تركيز فائق' : 'Deep Focus'}
              </Text>
            </View>
            <View style={styles.pillarTag}>
              <Ionicons name="layers-outline" size={10} color={COLOR_VIOLET} />
              <Text style={styles.pillarText}>
                {isArabic ? 'تنظيم ذكي' : 'Smart Planning'}
              </Text>
            </View>
            <View style={styles.pillarTag}>
              <Ionicons name="checkmark-done" size={10} color={COLOR_GOLD_ORANGE} />
              <Text style={styles.pillarText}>
                {isArabic ? 'إنجاز يومي' : 'Daily Flow'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: COLOR_VIOLET,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
    backgroundColor: 'transparent',
  },
  container: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 13,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: LIME_ACCENT,
  },
  innerContent: {
    paddingHorizontal: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  welcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(109, 40, 217, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(109, 40, 217, 0.16)',
    maxWidth: '68%',
  },
  liveDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    backgroundColor: COLOR_GOLD_ORANGE,
  },
  welcomeBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: COLOR_VIOLET,
    letterSpacing: 0.3,
  },
  badgeDivider: {
    fontSize: 9.5,
    color: 'rgba(109, 40, 217, 0.45)',
    fontWeight: '900',
  },
  badgeDateText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(109, 40, 217, 0.85)',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  plannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(109, 40, 217, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(109, 40, 217, 0.16)',
  },
  plannerBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLOR_VIOLET,
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(109, 40, 217, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(109, 40, 217, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: COLOR_VIOLET,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  profileAvatar: {
    width: 29,
    height: 29,
    borderRadius: 14.5,
  },
  heroSection: {
    marginTop: 2,
    marginBottom: 8,
  },
  headline: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  textViolet: {
    color: COLOR_VIOLET,
  },
  textBlack: {
    color: COLOR_VIOLET,
  },
  textGoldOrange: {
    color: COLOR_GOLD_ORANGE,
  },
  textRtl: {
    textAlign: 'right',
  },
  pillarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  pillarTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: 'rgba(109, 40, 217, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(109, 40, 217, 0.14)',
  },
  pillarText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLOR_VIOLET,
  },
});

export default HomeTopWidget;
