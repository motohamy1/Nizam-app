import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import { modeColor } from '@/utils/colorUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'checkmark-done-circle-outline',
    titleEn: 'Welcome to ToDoIt',
    titleAr: 'مرحباً بك في ToDoIt',
    descEn: 'Your premium task manager. Stay focused, organized, and on top of everything.',
    descAr: 'مدير مهامك المتميز. ابقَ مركزاً ومنظماً وفوق كل شيء.',
    accentColor: '#dbd4fd',
  },
  {
    icon: 'timer-outline',
    titleEn: 'Smart Timers',
    titleAr: 'مؤقتات ذكية',
    descEn: 'Set countdown or count-up timers on any task. Get notified when time is up.',
    descAr: 'ضع مؤقتات تنازلية أو تصاعدية على أي مهمة. احصل على إشعار عند انتهاء الوقت.',
    accentColor: '#defef9',
  },
  {
    icon: 'git-branch-outline',
    titleEn: 'Nested Subtasks',
    titleAr: 'مهام فرعية متداخلة',
    descEn: 'Break big goals into subtasks, each with their own timer and status.',
    descAr: 'قسّم الأهداف الكبيرة إلى مهام فرعية، لكل منها مؤقتها وحالتها.',
    accentColor: '#e5f19d',
  },
  {
    icon: 'folder-open-outline',
    titleEn: 'Projects & Planning',
    titleAr: 'المشاريع والتخطيط',
    descEn: 'Group tasks into projects. Use the Daily Planner to organize your day.',
    descAr: 'جمّع المهام في مشاريع. استخدم المخطط اليومي لتنظيم يومك.',
    accentColor: '#f6e5c9',
  },
  {
    icon: 'notifications-outline',
    titleEn: 'Reminders & Notes',
    titleAr: 'التذكيرات والملاحظات',
    descEn: 'Create rich notes and schedule reminders with custom alarm tones.',
    descAr: 'أنشئ ملاحظات غنية وجدول تذكيرات مع نغمات تنبيه مخصصة.',
    accentColor: '#dbd4fd',
  },
];

interface Props {
  onComplete: (language: string) => void;
}

export default function WelcomeOnboarding({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const [step, setStep] = useState<'language' | 'slides'>('language');
  const [selectedLang, setSelectedLang] = useState<'en' | 'ar'>('en');
  const [currentSlide, setCurrentSlide] = useState(0);

  const isArabic = selectedLang === 'ar';
  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  if (step === 'language') {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.logoRow}>
          <Ionicons name="checkmark-done-circle" size={48} color={colors.primary} />
          <Text style={[styles.appName, { color: colors.surfaceText }]}>ToDoIt</Text>
        </View>

        <Text style={[styles.langTitle, { color: colors.surfaceText }]}>Choose Your Language</Text>
        <Text style={[styles.langSubtitle, { color: colors.textMuted }]}>اختر لغتك / Select your language</Text>

        <View style={styles.langOptions}>
          <TouchableOpacity
            style={[
              styles.langCard,
              { backgroundColor: colors.surface },
              selectedLang === 'en' && { borderColor: colors.primary, backgroundColor: colors.primary + '14' },
            ]}
            onPress={() => setSelectedLang('en')}
            activeOpacity={0.97}
          >
            <Text style={styles.flag}>🇺🇸</Text>
            <Text style={[styles.langLabel, { color: selectedLang === 'en' ? colors.primary : colors.textMuted }]}>English</Text>
            {selectedLang === 'en' && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.langCard,
              { backgroundColor: colors.surface },
              selectedLang === 'ar' && { borderColor: colors.primary, backgroundColor: colors.primary + '14' },
            ]}
            onPress={() => setSelectedLang('ar')}
            activeOpacity={0.97}
          >
            <Text style={styles.flag}>🇸🇦</Text>
            <Text style={[styles.langLabel, { color: selectedLang === 'ar' ? colors.primary : colors.textMuted }]}>العربية</Text>
            {selectedLang === 'ar' && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary, ...colors.shadows.glow }]} onPress={() => setStep('slides')} activeOpacity={0.97}>
          <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>{isArabic ? 'متابعة' : 'Continue'}</Text>
          <Ionicons name={isArabic ? 'arrow-back' : 'arrow-forward'} size={20} color={colors.primaryText} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      {/* Skip */}
      <TouchableOpacity style={[styles.skipBtn, isArabic && { left: 24, right: undefined }]} onPress={() => onComplete(selectedLang)}>
        <Text style={[styles.skipText, { color: colors.textMuted }]}>{isArabic ? 'تخطي' : 'Skip'}</Text>
      </TouchableOpacity>

      {/* Slide */}
      <View style={styles.slideArea}>
        <View style={[styles.iconCircle, { backgroundColor: modeColor(slide.accentColor, isDarkMode) + '18' }]}>
          <Ionicons name={slide.icon} size={56} color={modeColor(slide.accentColor, isDarkMode)} />
        </View>
        <Text style={[styles.slideTitle, { color: colors.surfaceText }, isArabic && { textAlign: 'right' }]}>
          {isArabic ? slide.titleAr : slide.titleEn}
        </Text>
        <Text style={[styles.slideDesc, { color: colors.textMuted }, isArabic && { textAlign: 'right' }]}>
          {isArabic ? slide.descAr : slide.descEn}
        </Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: colors.border }, currentSlide === i && { backgroundColor: colors.primary, width: 20 }]} />
        ))}
      </View>

      {/* Nav */}
      <View style={[styles.navRow, isArabic && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }, currentSlide === 0 && { opacity: 0.3 }]}
          onPress={() => currentSlide > 0 && setCurrentSlide(p => p - 1)}
          disabled={currentSlide === 0}
        >
          <Ionicons name={isArabic ? 'arrow-forward' : 'arrow-back'} size={20} color={colors.surfaceText} />
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.primary, ...colors.shadows.glow }]} onPress={() => onComplete(selectedLang)} activeOpacity={0.97}>
            <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>{isArabic ? 'لنبدأ! 🚀' : "Let's Go! 🚀"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.primary, ...colors.shadows.glow }]} onPress={() => setCurrentSlide(p => p + 1)} activeOpacity={0.97}>
            <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>{isArabic ? 'التالي' : 'Next'}</Text>
            <Ionicons name={isArabic ? 'arrow-back' : 'arrow-forward'} size={18} color={colors.primaryText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  langTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  langSubtitle: {
    fontSize: 15,
    marginBottom: 40,
  },
  langOptions: {
    gap: 14,
    flex: 1,
    justifyContent: 'center',
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 14,
  },
  flag: {
    fontSize: 30,
  },
  langLabel: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 16,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '800',
  },
  skipBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  slideArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  slideDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
