import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useTheme from '@/hooks/useTheme';

interface HomeStatCardsProps {
  totalTasks: number;
  doneTasks: number;
  notDoneTasks: number;
  toDoTasks?: number;
  isArabic?: boolean;
  onPressTotal?: () => void;
  onPressDone?: () => void;
  onPressNotDone?: () => void;
}

export const HomeStatCards: React.FC<HomeStatCardsProps> = ({
  totalTasks,
  doneTasks,
  notDoneTasks,
  toDoTasks,
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

  const displayToDo = toDoTasks !== undefined ? toDoTasks : totalTasks;

  return (
    <View style={[styles.container, isArabic && styles.containerRtl]}>
      {/* 1. To Do */}
      <TouchableOpacity
        style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}
        activeOpacity={onPressTotal ? 0.75 : 1}
        onPress={onPressTotal}
      >
        <Text numberOfLines={1} style={[styles.cardTitle, { color: labelColor }]}>
          {isArabic ? 'للقيام بها' : 'To Do'}
        </Text>
        <View style={[styles.valueRow, isArabic && styles.valueRowRtl]}>
          <Text style={[styles.cardValue, { color: valColor }]}>
            {displayToDo.toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
          </Text>
          <Text style={styles.emoji}>⏳</Text>
        </View>
      </TouchableOpacity>

      {/* 2. Done */}
      <TouchableOpacity
        style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}
        activeOpacity={onPressDone ? 0.75 : 1}
        onPress={onPressDone}
      >
        <Text numberOfLines={1} style={[styles.cardTitle, { color: labelColor }]}>
          {isArabic ? 'مكتمل' : 'Done'}
        </Text>
        <View style={[styles.valueRow, isArabic && styles.valueRowRtl]}>
          <Text style={[styles.cardValue, { color: valColor }]}>
            {doneTasks.toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
          </Text>
          <Text style={styles.emoji}>🔥</Text>
        </View>
      </TouchableOpacity>

      {/* 3. Not Done */}
      <TouchableOpacity
        style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}
        activeOpacity={onPressNotDone ? 0.75 : 1}
        onPress={onPressNotDone}
      >
        <Text numberOfLines={1} style={[styles.cardTitle, { color: labelColor }]}>
          {isArabic ? 'غير مكتمل' : 'Not Done'}
        </Text>
        <View style={[styles.valueRow, isArabic && styles.valueRowRtl]}>
          <Text style={[styles.cardValue, { color: valColor }]}>
            {notDoneTasks.toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
          </Text>
          <Text style={styles.emoji}>❌</Text>
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
    marginTop: 2,
    marginBottom: 4,
    width: '100%',
  },
  containerRtl: {
    flexDirection: 'row-reverse',
  },
  statCard: {
    flex: 1,
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  valueRowRtl: {
    flexDirection: 'row-reverse',
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emoji: {
    fontSize: 11,
  },
});

export default HomeStatCards;
