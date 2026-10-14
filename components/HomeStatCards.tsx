import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useTheme from '@/hooks/useTheme';

interface HomeStatCardsProps {
  totalTasks: number;
  doneTasks: number;
  notDoneTasks: number;
  isArabic?: boolean;
  onPressTotal?: () => void;
  onPressDone?: () => void;
  onPressNotDone?: () => void;
}

export const HomeStatCards: React.FC<HomeStatCardsProps> = ({
  totalTasks,
  doneTasks,
  notDoneTasks,
  isArabic = false,
  onPressTotal,
  onPressDone,
  onPressNotDone,
}) => {
  const { colors, isDarkMode } = useTheme();

  const cardBg = isDarkMode ? '#1c1c1e' : colors.surface;
  const borderColor = isDarkMode ? '#2f2f35' : colors.border;
  const labelColor = isDarkMode ? '#d4d4d8' : colors.textMuted;
  const valColor = isDarkMode ? '#ffffff' : colors.text;

  return (
    <View style={[styles.container, isArabic && styles.containerRtl]}>
      {/* 1. Total Tasks Today */}
      <TouchableOpacity
        style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}
        activeOpacity={onPressTotal ? 0.75 : 1}
        onPress={onPressTotal}
      >
        <Text numberOfLines={2} style={[styles.cardTitle, { color: labelColor }]}>
          {isArabic ? 'إجمالي مهام اليوم' : 'Total Tasks for Today is'}
        </Text>
        <View style={styles.valueRow}>
          <Text style={[styles.cardValue, { color: valColor }]}>
            {totalTasks.toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
          </Text>
          <Text style={styles.emoji}>🔥</Text>
        </View>
      </TouchableOpacity>

      {/* 2. Tasks Done Today */}
      <TouchableOpacity
        style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}
        activeOpacity={onPressDone ? 0.75 : 1}
        onPress={onPressDone}
      >
        <Text numberOfLines={2} style={[styles.cardTitle, { color: labelColor }]}>
          {isArabic ? 'المهام المكتملة اليوم' : 'Total Tasks Done Today is'}
        </Text>
        <View style={styles.valueRow}>
          <Text style={[styles.cardValue, { color: valColor }]}>
            {doneTasks.toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
          </Text>
          <Text style={styles.emoji}>🔥</Text>
        </View>
      </TouchableOpacity>

      {/* 3. Tasks Not Done */}
      <TouchableOpacity
        style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}
        activeOpacity={onPressNotDone ? 0.75 : 1}
        onPress={onPressNotDone}
      >
        <Text numberOfLines={2} style={[styles.cardTitle, { color: labelColor }]}>
          {isArabic ? 'المهام غير المكتملة' : 'Total Tasks Not Done is'}
        </Text>
        <View style={styles.valueRow}>
          <Text style={[styles.cardValue, { color: valColor }]}>
            {notDoneTasks.toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
          </Text>
          <Text style={styles.emoji}>⏳</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 5,
    marginBottom: 6,
    width: '100%',
  },
  containerRtl: {
    flexDirection: 'row-reverse',
  },
  statCard: {
    flex: 1,
    minHeight: 74,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  emoji: {
    fontSize: 12,
  },
});

export default HomeStatCards;
