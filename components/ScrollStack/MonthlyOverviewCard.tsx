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
    <View style={[styles.card, { backgroundColor: frame.cardBg, borderColor: frame.cardBorder }]}>
      {/* Header */}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: frame.badgeBg }]}>
            <Ionicons name="stats-chart" size={20} color={frame.badgeFg} />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={[styles.cardTitle, { color: frame.text }]}>{t.monthlyOverview}</Text>
            <Text style={[styles.cardSubtitle, { color: frame.textMuted }]}>
              {monthName} {year}
            </Text>
          </View>
        </View>

        <View style={[styles.headerPill, { backgroundColor: frame.pillBg }]}>
          <Ionicons name="open-outline" size={14} color={frame.pillFg} />
          <Text style={[styles.headerPillText, { color: frame.pillFg }]}>{t.tabPlanner}</Text>
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
          <View style={[styles.monthlyProgressBarContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : frame.pillBg }]}>
            <View 
              style={[
                styles.monthlyProgressBarFill, 
                { width: `${Math.min(100, Math.max(0, completionRate))}%`, backgroundColor: frame.accent }
              ]} 
            />
          </View>
        </View>

        {/* Stat 2: Active Goals */}
        <View style={[styles.monthlyStatItem, { backgroundColor: frame.rowBg, borderColor: frame.rowBorder }]}>
          <Text style={[styles.monthlyStatNumber, { color: frame.accent }]}>{activeGoalsCount}</Text>
          <Text style={[styles.monthlyStatLabel, { color: frame.textMuted }]}>{t.activeGoals}</Text>
          <View style={[styles.monthlyProgressBarContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : frame.pillBg }]}>
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
        style={[styles.cardFooter, { borderTopColor: frame.footerBorder }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.footerActionBtn}>
          <Ionicons name="calendar-outline" size={16} color={frame.footerText} />
          <Text style={[styles.footerActionText, { color: frame.footerText }]}>{t.tapToOpenPlanner}</Text>
        </View>

        <Ionicons name={isArabic ? 'arrow-back' : 'arrow-forward'} size={16} color={frame.text} />
      </TouchableOpacity>
    </View>
  );
};

export default MonthlyOverviewCard;
