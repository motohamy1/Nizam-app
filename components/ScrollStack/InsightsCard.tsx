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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <View
      style={[baseStyles.card, { backgroundColor: frame.cardBg, borderColor: 'transparent' }]}
    >
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
              { backgroundColor: 'rgba(175, 230, 7, 0.22)', borderWidth: 1, borderColor: 'rgba(132, 204, 22, 0.40)', flexShrink: 0 },
            ]}
          >
            <Ionicons name="analytics" size={18} color="#6D28D9" />
          </View>
          <View style={[{ flex: 1, minWidth: 0 }, isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            <Text style={[baseStyles.cardTitle, { color: frame.text }]} numberOfLines={1} ellipsizeMode="tail">
              {t.tabInsights || (isArabic ? 'رؤى الذكاء الاصطناعي' : 'AI Insights & Wellbeing')}
            </Text>
            <Text style={[baseStyles.cardSubtitle, { color: frame.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
              {productivity}% {isArabic ? 'درجة الإنتاجية' : 'Productivity Score'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Metrics Row */}
      <TouchableOpacity
        style={styles.metricsRow}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={[styles.metricPill, { backgroundColor: frame.rowBg, borderColor: frame.rowBorder, borderWidth: 1 }]}>
          <View style={[styles.miniDot, { backgroundColor: '#84CC16' }]} />
          <Text style={[styles.metricVal, { color: frame.text }]}>{productivity}%</Text>
          <Text style={[styles.metricLbl, { color: frame.textMuted }]}>{isArabic ? 'إنتاجية' : 'Productivity'}</Text>
        </View>

        <View style={[styles.metricPill, { backgroundColor: frame.rowBg, borderColor: frame.rowBorder, borderWidth: 1 }]}>
          <View style={[styles.miniDot, { backgroundColor: frame.badgeFg }]} />
          <Text style={[styles.metricVal, { color: frame.text }]}>{balance}%</Text>
          <Text style={[styles.metricLbl, { color: frame.textMuted }]}>{isArabic ? 'توازن' : 'Balance'}</Text>
        </View>

        <View style={[styles.metricPill, { backgroundColor: frame.rowBg, borderColor: frame.rowBorder, borderWidth: 1 }]}>
          <View style={[styles.miniDot, { backgroundColor: '#84CC16' }]} />
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
              borderColor: frame.rowBorder,
            },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={16} color={frame.badgeFg} />
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
              borderColor: frame.rowBorder,
            },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color={frame.badgeFg} />
          <Text style={[styles.alertText, { color: frame.text }]} numberOfLines={1}>
            {isArabic ? 'كل مجالات التركيز متوازنة بشكل ممتاز' : 'All focus topics are on track'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Footer */}
      <TouchableOpacity 
        style={[baseStyles.checklistStats, { borderTopColor: frame.footerBorder, marginTop: 8, paddingTop: 8 }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="arrow-forward" size={14} color={frame.badgeFg} />
          <Text style={{ fontSize: 12, fontWeight: '800', color: frame.text }}>
            {isArabic ? 'عرض التقرير الكامل ورادار التركيز' : 'View Full Insights & Radar'}
          </Text>
        </View>

        <Text style={{ color: frame.badgeFg, fontWeight: '800', fontSize: 11.5 }}>
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
