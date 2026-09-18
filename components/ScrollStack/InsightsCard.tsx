import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { 
  createScrollStackStyles, 
  STACK_CARD_PALETTES, 
  createMonthCardFrame, 
  MonthPalette 
} from '@/assets/styles/scrollStack.styles';

interface InsightsCardProps {
  insights: any;
  onPress: () => void;
  palette?: MonthPalette;
}

export const InsightsCard: React.FC<InsightsCardProps> = ({
  insights,
  onPress,
  palette = STACK_CARD_PALETTES.insights,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const baseStyles = createScrollStackStyles(colors, isArabic, isDarkMode);
  const frame = createMonthCardFrame(palette, isDarkMode, colors);

  const productivity = insights?.productivityScore ?? 85;
  const balance = insights?.balanceScore ?? 78;
  const streak = insights?.consistencyStreak ?? 0;
  const neglectedCount = insights?.neglectedTopics?.length ?? 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.danger;
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <View style={[baseStyles.card, { backgroundColor: frame.cardBg, borderColor: frame.cardBorder }]}>
      {/* Header */}
      <TouchableOpacity
        style={baseStyles.cardHeader}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={baseStyles.cardHeaderLeft}>
          <View
            style={[
              baseStyles.iconBadge,
              { backgroundColor: frame.badgeBg },
            ]}
          >
            <Ionicons name="analytics" size={20} color={frame.badgeFg} />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={[baseStyles.cardTitle, { color: frame.text }]}>
              {t.tabInsights || (isArabic ? 'رؤى الذكاء الاصطناعي' : 'AI Insights & Wellbeing')}
            </Text>
            <Text style={[baseStyles.cardSubtitle, { color: frame.textMuted }]}>
              {productivity}% {isArabic ? 'درجة الإنتاجية' : 'Productivity Score'}
            </Text>
          </View>
        </View>

        <View style={[baseStyles.headerPill, { backgroundColor: frame.pillBg }]}>
          <Ionicons name="sparkles" size={13} color={frame.pillFg} />
          <Text style={[baseStyles.headerPillText, { color: frame.pillFg }]}>
            {isArabic ? 'تحليل ذكي' : 'AI Health'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Metrics Row */}
      <TouchableOpacity
        style={styles.metricsRow}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={[styles.metricPill, { backgroundColor: frame.rowBg, borderColor: frame.rowBorder, borderWidth: 1 }]}>
          <View style={[styles.miniDot, { backgroundColor: getScoreColor(productivity) }]} />
          <Text style={[styles.metricVal, { color: frame.text }]}>{productivity}%</Text>
          <Text style={[styles.metricLbl, { color: frame.textMuted }]}>{isArabic ? 'إنتاجية' : 'Productivity'}</Text>
        </View>

        <View style={[styles.metricPill, { backgroundColor: frame.rowBg, borderColor: frame.rowBorder, borderWidth: 1 }]}>
          <View style={[styles.miniDot, { backgroundColor: getScoreColor(balance) }]} />
          <Text style={[styles.metricVal, { color: frame.text }]}>{balance}%</Text>
          <Text style={[styles.metricLbl, { color: frame.textMuted }]}>{isArabic ? 'توازن' : 'Balance'}</Text>
        </View>

        <View style={[styles.metricPill, { backgroundColor: frame.rowBg, borderColor: frame.rowBorder, borderWidth: 1 }]}>
          <View style={[styles.miniDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.metricVal, { color: frame.text }]}>{streak}d</Text>
          <Text style={[styles.metricLbl, { color: frame.textMuted }]}>{isArabic ? 'استمرار' : 'Streak'}</Text>
        </View>
      </TouchableOpacity>

      {/* Focus & Neglected highlight strip */}
      {neglectedCount > 0 ? (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.85}
          style={[
            styles.alertBanner,
            {
              backgroundColor: frame.pillBg,
              borderColor: frame.cardBorder,
            },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={16} color={frame.text} />
          <Text style={[styles.alertText, { color: frame.text }]} numberOfLines={1}>
            {neglectedCount} {isArabic ? 'مجالات تحتاج إلى انتباه اليوم' : 'areas need attention today'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.85}
          style={[
            styles.alertBanner,
            {
              backgroundColor: frame.pillBg,
              borderColor: frame.cardBorder,
            },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color={frame.accent} />
          <Text style={[styles.alertText, { color: frame.text }]} numberOfLines={1}>
            {isArabic ? 'كل مجالات التركيز متوازنة بشكل ممتاز' : 'All focus topics are on track'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Footer */}
      <TouchableOpacity 
        style={[baseStyles.cardFooter, { borderTopColor: frame.footerBorder }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={baseStyles.footerActionBtn}>
          <Ionicons name="arrow-forward" size={14} color={frame.footerText} />
          <Text style={[baseStyles.footerActionText, { color: frame.footerText }]}>
            {isArabic ? 'عرض التقرير الكامل ورادار التركيز' : 'View Full Insights & Radar'}
          </Text>
        </View>

        <Text style={[baseStyles.footerHintText, { color: frame.text, fontWeight: '700' }]}>
          {isArabic ? 'تحديث يومي' : 'Daily Sync'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  metricPill: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    gap: 3,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '500',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 4,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});

export default InsightsCard;
