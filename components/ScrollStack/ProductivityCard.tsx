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
          <View style={[styles.iconBadge, { backgroundColor: frame.badgeBg, flexShrink: 0 }]}>
            <Ionicons name="flame" size={18} color={frame.badgeFg} />
          </View>
          <View style={[{ flex: 1, minWidth: 0 }, isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            <Text style={[styles.cardTitle, { color: frame.text }]} numberOfLines={1} ellipsizeMode="tail">
              {t.productivityFocus}
            </Text>
            <Text style={[styles.cardSubtitle, { color: frame.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
              {weeklyRate}% {t.weeklyRate}
            </Text>
          </View>
        </View>
      </View>

      {/* Body: Streak and Focus Launcher */}
      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', gap: 10, marginVertical: 8 }}>
        {/* Streak Counter Box */}
        <View style={{ flex: 1, flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, borderWidth: 1, backgroundColor: frame.rowBg, borderColor: frame.rowBorder }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: frame.accent }}>
            <Ionicons name="flame" size={22} color="#FFFFFF" />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: frame.text }}>{streakDays}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: frame.textMuted }}>{t.dailyStreak}</Text>
          </View>
        </View>

        {/* Start Focus Button */}
        <TouchableOpacity
          style={{ flex: 1, flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 14, backgroundColor: frame.ctaBg }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onStartFocus();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="timer-outline" size={18} color={frame.ctaFg} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: frame.ctaFg }}>{t.startFocus}</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.checklistStats, { borderTopColor: frame.footerBorder, marginTop: 4, paddingTop: 8 }]}>
        <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="trophy-outline" size={16} color={frame.footerText} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: frame.footerText }}>{t.statistics}</Text>
        </View>

        <Text style={{ fontSize: 11, color: frame.text, fontWeight: '700' }}>Deep Focus Mode</Text>
      </View>
    </LinearGradient>
  );
};

export default ProductivityCard;
