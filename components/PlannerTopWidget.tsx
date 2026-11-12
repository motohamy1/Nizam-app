import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LivePress from '@/components/LivePress';

interface PlannerTopWidgetProps {
  activeYear: number;
  currentYear: number;
  onOpenYearModal: () => void;
  onPressGoals: () => void;
  onPressAchievements: () => void;
  isArabic?: boolean;
}

export const PLANNER_LIGHT_TEXTURE_BG = '#FAF8F5';
export const PLANNER_DARK_CONTRAST_CARD = '#5B1497';
export const PLANNER_ACTIVITY_COLOR = '#FF9470';

export const PlannerTopWidget: React.FC<PlannerTopWidgetProps> = ({
  activeYear,
  currentYear,
  onOpenYearModal,
  onPressGoals,
  onPressAchievements,
  isArabic = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.shadowWrapper}>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top + 6, Platform.OS === 'android' ? 24 : 10),
          },
        ]}
      >
        {/* 1. Base light warm tone */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: PLANNER_LIGHT_TEXTURE_BG }]} />

        {/* 2. Granulated texture overlay matching ScreenBackground grain */}
        <Image
          source={require('@/assets/images/grain.png')}
          contentFit="cover"
          style={[StyleSheet.absoluteFill, { opacity: 0.28 }]}
        />

        {/* 3. Soft specular sheen overlay for tactile depth */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.20)', 'transparent']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 0.85 }}
          style={StyleSheet.absoluteFill}
        />

        {/* ─── Card 1: Upper Year Information Card (Transparent Background, No Month Labels) ─── */}
        <View style={styles.yearCardWrapper}>
          <LivePress
            pressScale={0.98}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onOpenYearModal();
            }}
            style={[styles.yearCardBody, isArabic && styles.rowReverse]}
          >
            <View style={[styles.yearInfoLeft, isArabic && styles.rowReverse]}>
              <View style={styles.calendarIconBox}>
                <Ionicons name="calendar" size={21} color="#1E1B18" />
              </View>

              <View style={[styles.yearTitleGroup, isArabic && styles.rowReverse]}>
                <Text style={styles.yearNumberText}>
                  {activeYear}
                </Text>

                {activeYear === currentYear && (
                  <View style={styles.currentYearBadge}>
                    <Text style={styles.currentYearBadgeText}>
                      {isArabic ? 'السنة الحالية' : 'Current Year'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.yearChevronBtn}>
              <Ionicons
                name="chevron-down"
                size={18}
                color="#1E1B18"
                style={{ opacity: 0.85 }}
              />
            </View>
          </LivePress>
        </View>

        {/* ─── Year Focus Capsules: Goals & To-dos (Card 2) | Achievements (Card 3) ─── */}
        <View style={[styles.focusCardsRow, isArabic && styles.rowReverse]}>
          {/* Card 2: Goals & To-dos — High-Contrast Dark Tone */}
          <LivePress
            style={[styles.focusCardBase, styles.goalsCard]}
            pressScale={0.96}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPressGoals();
            }}
          >
            <View style={[styles.cardTopNav, isArabic && styles.rowReverse]}>
              <View style={styles.goalsIconCircle}>
                <Ionicons name="flag-outline" size={19} color="#FF9470" />
              </View>
              <View style={styles.goalsArrowCircle}>
                <Ionicons
                  name={isArabic ? 'chevron-back' : 'chevron-forward'}
                  size={14}
                  color="#FFFFFF"
                  style={{ opacity: 0.85 }}
                />
              </View>
            </View>

            <View>
              <Text style={styles.goalsTitleText} numberOfLines={1}>
                {isArabic ? 'الأهداف والمهام' : 'Goals & To-dos'}
              </Text>
              <View style={[styles.metaRow, isArabic && styles.rowReverse]}>
                <View style={styles.goalsPill}>
                  <Text style={styles.goalsPillText}>
                    {isArabic ? 'قريبًا' : 'SOON'}
                  </Text>
                </View>
                <Text style={styles.goalsSubtitleText} numberOfLines={1}>
                  {isArabic ? 'اضغط للاكتشاف' : 'Tap to discover'}
                </Text>
              </View>
            </View>
          </LivePress>

          {/* Card 3: Achievements — Activity Color (#FF9470) */}
          <LivePress
            style={[styles.focusCardBase, styles.achievementsCard]}
            pressScale={0.96}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPressAchievements();
            }}
          >
            <View style={[styles.cardTopNav, isArabic && styles.rowReverse]}>
              <View style={styles.achievementsIconCircle}>
                <Ionicons name="trophy" size={19} color="#141311" />
              </View>
              <View style={styles.achievementsArrowCircle}>
                <Ionicons
                  name={isArabic ? 'chevron-back' : 'chevron-forward'}
                  size={14}
                  color="#141311"
                  style={{ opacity: 0.85 }}
                />
              </View>
            </View>

            <View>
              <Text style={styles.achievementsTitleText} numberOfLines={1}>
                {isArabic ? 'الإنجازات' : 'Achievements'}
              </Text>
              <View style={[styles.metaRow, isArabic && styles.rowReverse]}>
                <View style={styles.achievementsPill}>
                  <Text style={styles.achievementsPillText}>
                    {isArabic ? 'قريبًا' : 'SOON'}
                  </Text>
                </View>
                <Text style={styles.achievementsSubtitleText} numberOfLines={1}>
                  {isArabic ? 'اضغط للاكتشاف' : 'Tap to discover'}
                </Text>
              </View>
            </View>
          </LivePress>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
    backgroundColor: 'transparent',
  },
  container: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: PLANNER_LIGHT_TEXTURE_BG,
    borderWidth: 1,
    borderColor: 'rgba(30, 27, 24, 0.05)',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E1B18',
    letterSpacing: -0.4,
  },
  yearCardWrapper: {
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 6,
  },
  yearCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  yearInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 27, 24, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30, 27, 24, 0.10)',
  },
  yearTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  yearNumberText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E1B18',
    letterSpacing: -0.5,
  },
  currentYearBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 27, 24, 0.08)',
  },
  currentYearBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1E1B18',
    opacity: 0.9,
  },
  yearChevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 27, 24, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30, 27, 24, 0.08)',
  },
  focusCardsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  focusCardBase: {
    flex: 1,
    height: 130,
    borderRadius: 22,
    padding: 14,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  goalsCard: {
    backgroundColor: PLANNER_DARK_CONTRAST_CARD,
    shadowColor: PLANNER_DARK_CONTRAST_CARD,
  },
  goalsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalsArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalsTitleText: {
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  goalsPill: {
    paddingHorizontal: 6.5,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  goalsPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  goalsSubtitleText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.70)',
    flexShrink: 1,
  },
  achievementsCard: {
    backgroundColor: PLANNER_ACTIVITY_COLOR,
    shadowColor: PLANNER_ACTIVITY_COLOR,
  },
  achievementsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 19, 17, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementsArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(20, 19, 17, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementsTitleText: {
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: -0.2,
    color: '#141311',
  },
  achievementsPill: {
    paddingHorizontal: 6.5,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(20, 19, 17, 0.12)',
  },
  achievementsPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#141311',
    letterSpacing: 0.3,
  },
  achievementsSubtitleText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(20, 19, 17, 0.75)',
    flexShrink: 1,
  },
  cardTopNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
});
