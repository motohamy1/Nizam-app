import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { createScrollStackStyles, CARD_ACCENTS, createCardFrame } from '@/assets/styles/scrollStack.styles';

interface ProductivityCardProps {
  streakDays: number;
  weeklyRate: number; // Percentage 0 - 100
  onStartFocus: () => void;
}

export const ProductivityCard: React.FC<ProductivityCardProps> = ({
  streakDays,
  weeklyRate,
  onStartFocus,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);
  const frame = createCardFrame(CARD_ACCENTS.mint, isDarkMode, colors.secondaryText);

  return (
    <View style={[styles.card, { borderColor: frame.edge }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: frame.badgeBg }]}>
            <Ionicons name="flame" size={20} color={frame.badgeFg} />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={styles.cardTitle}>{t.productivityFocus}</Text>
            <Text style={styles.cardSubtitle}>
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
        <View style={styles.streakCard}>
          <View style={[styles.streakIconCircle, { backgroundColor: CARD_ACCENTS.mint.pastel }]}>
            <Ionicons name="flame" size={22} color={colors.secondaryText} />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={[styles.streakNumber, { color: frame.fg }]}>{streakDays}</Text>
            <Text style={styles.streakLabel}>{t.dailyStreak}</Text>
          </View>
        </View>

        {/* Start Focus Button — pastel gem chip in dark, a committed deep CTA in light */}
        <TouchableOpacity
          style={[styles.focusActionBtn, { backgroundColor: isDarkMode ? CARD_ACCENTS.mint.pastel : '#C7C2FF' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onStartFocus();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="timer-outline" size={18} color={isDarkMode ? colors.secondaryText : '#23173D'} />
          <Text style={[styles.focusActionBtnText, { color: isDarkMode ? colors.secondaryText : colors.primaryText }]}>{t.startFocus}</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerActionBtn}>
          <Ionicons name="trophy-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerActionText}>{t.statistics}</Text>
        </View>

        <Text style={styles.footerHintText}>Deep Focus Mode</Text>
      </View>
    </View>
  );
};

export default ProductivityCard;
