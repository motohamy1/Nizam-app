import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/utils/i18n';
import AnimatedWavyHeader from '@/components/AnimatedWavyHeader';
import LivePress from '@/components/LivePress';
import { getMonthPalette } from '@/components/MonthCreditCard';

/**
 * Year section placeholder — opened from the planner's "Goals & To-dos" and
 * "Achievements" capsules. The full content lands later; this page tells the
 * user what's coming and keeps the year/palette context.
 */
const YearSection = () => {
  const params = useLocalSearchParams<{ kind?: string; year?: string }>();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { isArabic } = useTranslation(language);

  const isGoals = params.kind !== 'achievements';
  const year = parseInt(params.year ?? String(new Date().getFullYear()), 10);
  const monthIdx = new Date().getMonth();
  const palette = isGoals ? getMonthPalette(monthIdx) : { ...getMonthPalette(monthIdx), accent: '#D97706', bg: isDarkMode ? '#2A2113' : '#FDF3DC', ink: isDarkMode ? '#F5EAD6' : '#451A03' };

  const title = isGoals
    ? (isArabic ? 'أهداف ومهام العام' : 'Goals & To-dos')
    : (isArabic ? 'الإنجازات' : 'Achievements');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <AnimatedWavyHeader backgroundColor={colors.bg} waveHeight={10} contentStyle={{ paddingBottom: 2 }}>
          <View style={[styles.headerRow, isArabic && styles.rowReverse]}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.headerIconBtn}
            >
              <Ionicons name={isArabic ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.headerTitleText, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.headerSubtitleText, { color: colors.textMuted }]}>{year}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </AnimatedWavyHeader>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[
            styles.heroCard,
            {
              backgroundColor: palette.bg,
              shadowColor: palette.ink,
            },
          ]}>
            <View style={[styles.iconBadge, { backgroundColor: palette.ink + '14' }]}>
              <Ionicons
                name={isGoals ? 'flag-outline' : 'trophy-outline'}
                size={34}
                color={palette.accent}
              />
            </View>

            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              {isArabic ? 'قريبًا' : 'Coming Soon'}
            </Text>
            <Text style={[styles.heroBody, { color: palette.ink }]}>{isArabic
              ? `سنضيف هنا صفحة ${title} لعام ${year} — يمكنك الآن تسجيل أهدافك من الصفحة الرئيسية أو المخطط اليومي.`
              : `The full ${title.toLowerCase()} experience for ${year} is on its way. Until then, you can capture goals from the home screen or your daily planner.`}</Text>

            <View style={[styles.pill, { backgroundColor: palette.ink + '14', borderColor: palette.ink + '26' }]}>
              <Ionicons name="construct-outline" size={13} color={palette.ink} />
              <Text style={[styles.pillText, { color: palette.ink }]}>
                {isArabic ? 'قيد التطوير' : 'In development'}
              </Text>
            </View>
          </View>

          <LivePress
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.back()}
            pressScale={0.97}
          >
            <Ionicons name={isArabic ? 'arrow-forward' : 'arrow-back'} size={16} color={colors.primary} />
            <Text style={[styles.backBtnText, { color: colors.primary }]}>
              {isArabic ? 'العودة للمخطط' : 'Back to planner'}
            </Text>
          </LivePress>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  headerIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitleText: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  headerSubtitleText: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 60,
  },
  heroCard: {
    borderRadius: 28,
    paddingVertical: 44,
    paddingHorizontal: 26,
    alignItems: 'center',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroBody: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 340,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 22,
  },
  pillText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
  },
  backBtnText: { fontSize: 14, fontWeight: '800' },
});

export default YearSection;
