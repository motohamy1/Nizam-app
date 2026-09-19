import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { 
  createScrollStackStyles, 
  STACK_CARD_PALETTES, 
  createMonthCardFrame, 
  MonthPalette 
} from '@/assets/styles/scrollStack.styles';

interface ProductivityCardProps {
  streakDays: number;
  weeklyRate: number; // Percentage 0 - 100
  onStartFocus: () => void;
  palette?: MonthPalette;
}

export const ProductivityCard: React.FC<ProductivityCardProps> = ({
  streakDays,
  weeklyRate,
  onStartFocus,
  palette = STACK_CARD_PALETTES.productivity,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);
  const frame = createMonthCardFrame(palette, isDarkMode, colors);

  return (
    <LinearGradient
      colors={[frame.gradTop, frame.gradBottom]}
      style={[styles.card, { borderColor: frame.cardBorder, overflow: 'hidden' }]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: frame.badgeBg }]}>
            <Ionicons name="flame" size={20} color={frame.badgeFg} />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={[styles.cardTitle, { color: frame.text }]}>{t.productivityFocus}</Text>
            <Text style={[styles.cardSubtitle, { color: frame.textMuted }]}>
              {weeklyRate}% {t.weeklyRate}
            </Text>
          </View>
        </View>

        <View style={[styles.headerPill, { backgroundColor: frame.pillBg }]}>
          <Ionicons name="flash" size={14} color={frame.pillFg} />
          <Text style={[styles.headerPillText, { color: frame.pillFg }]}>{streakDays}d Streak</Text>
        </View>
      </View>

      {/* Body: Streak and Focus Launcher */}
      <View style={styles.productivityRow}>
        {/* Streak Counter Box */}
        <View style={[styles.streakCard, { backgroundColor: frame.rowBg, borderColor: frame.rowBorder }]}>
          <View style={[styles.streakIconCircle, { backgroundColor: frame.accent }]}>
            <Ionicons name="flame" size={22} color="#FFFFFF" />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={[styles.streakNumber, { color: frame.text }]}>{streakDays}</Text>
            <Text style={[styles.streakLabel, { color: frame.textMuted }]}>{t.dailyStreak}</Text>
          </View>
        </View>

        {/* Start Focus Button */}
        <TouchableOpacity
          style={[styles.focusActionBtn, { backgroundColor: frame.ctaBg }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onStartFocus();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="timer-outline" size={18} color={frame.ctaFg} />
          <Text style={[styles.focusActionBtnText, { color: frame.ctaFg }]}>{t.startFocus}</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.cardFooter, { borderTopColor: frame.footerBorder }]}>
        <View style={styles.footerActionBtn}>
          <Ionicons name="trophy-outline" size={16} color={frame.footerText} />
          <Text style={[styles.footerActionText, { color: frame.footerText }]}>{t.statistics}</Text>
        </View>

        <Text style={[styles.footerHintText, { color: frame.text, fontWeight: '700' }]}>Deep Focus Mode</Text>
      </View>
    </LinearGradient>
  );
};

export default ProductivityCard;
