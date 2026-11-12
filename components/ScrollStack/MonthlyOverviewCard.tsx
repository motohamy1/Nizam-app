import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { 
  createScrollStackStyles, 
  STACK_CARD_PALETTES, 
  createMonthCardFrame, 
  MonthPalette 
} from '@/assets/styles/scrollStack.styles';

interface MonthlyOverviewCardProps {
  monthName: string;
  year: number;
  completedTasks: number;
  totalTasks: number;
  activeGoalsCount: number;
  onPress: () => void;
  palette?: MonthPalette;
}

export const MonthlyOverviewCard: React.FC<MonthlyOverviewCardProps> = ({
  monthName,
  year,
  completedTasks,
  totalTasks,
  activeGoalsCount,
  onPress,
  palette = STACK_CARD_PALETTES.monthly,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);
  const frame = createMonthCardFrame(palette, isDarkMode, colors);
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const handlePress = () => {
    onPress();
  };

  return (
    <View
      style={[styles.card, { backgroundColor: frame.cardBg, borderColor: 'transparent' }]}
    >
      {/* Header */}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(175, 230, 7, 0.22)', borderWidth: 1, borderColor: 'rgba(132, 204, 22, 0.40)', flexShrink: 0 }]}>
            <Ionicons name="stats-chart" size={18} color="#6D28D9" />
          </View>
          <View style={[{ flex: 1, minWidth: 0 }, isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            <Text style={[styles.cardTitle, { color: frame.text }]} numberOfLines={1} ellipsizeMode="tail">
              {t.monthlyOverview}
            </Text>
            <Text style={[styles.cardSubtitle, { color: frame.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
              {monthName} {year}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Body: Monthly Stats Grid */}
      <TouchableOpacity 
        style={styles.monthlyStatsGrid}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Stat 1: Tasks Completion */}
        <View style={[styles.monthlyStatItem, { backgroundColor: frame.rowBg, borderColor: frame.rowBorder }]}>
          <Text style={[styles.monthlyStatNumber, { color: frame.text }]}>{completionRate}%</Text>
          <Text style={[styles.monthlyStatLabel, { color: frame.textMuted }]}>
            {completedTasks}/{totalTasks} {t.completed}
          </Text>
          <View style={[styles.monthlyProgressBarContainer, { backgroundColor: frame.pillBg }]}>
            <View 
              style={[
                styles.monthlyProgressBarFill, 
                { width: `${Math.min(100, Math.max(0, completionRate))}%`, backgroundColor: '#AFE607' }
              ]} 
            />
          </View>
        </View>

        {/* Stat 2: Active Goals */}
        <View style={[styles.monthlyStatItem, { backgroundColor: frame.rowBg, borderColor: frame.rowBorder }]}>
          <Text style={[styles.monthlyStatNumber, { color: frame.accent }]}>{activeGoalsCount}</Text>
          <Text style={[styles.monthlyStatLabel, { color: frame.textMuted }]}>{t.activeGoals}</Text>
          <View style={[styles.monthlyProgressBarContainer, { backgroundColor: frame.pillBg }]}>
            <View 
              style={[
                styles.monthlyProgressBarFill, 
                { width: activeGoalsCount > 0 ? '75%' : '0%', backgroundColor: frame.accent }
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Footer */}
      <TouchableOpacity 
        style={[styles.checklistStats, { borderTopColor: frame.footerBorder, marginTop: 8, paddingTop: 8 }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar-outline" size={16} color={frame.badgeFg} />
          <Text style={{ fontSize: 12, fontWeight: '800', color: frame.text }}>{t.tapToOpenPlanner}</Text>
        </View>

        <Ionicons name={isArabic ? 'arrow-back' : 'arrow-forward'} size={16} color={frame.badgeFg} />
      </TouchableOpacity>
    </View>
  );
};

export default MonthlyOverviewCard;
