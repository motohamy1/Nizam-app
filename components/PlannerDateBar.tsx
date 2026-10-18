import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import LivePress from './LivePress';
import { getEffectiveTaskDay } from '@/utils/taskDateUtils';

interface PlannerDateBarProps {
  month: number; // 0 - 11
  year: number;
  todos: any[];
  onSelectDay: (day: number) => void;
  selectedDay?: number | null;
  isArabic?: boolean;
}

const ITEM_WIDTH = 48;
const ITEM_GAP = 8;
const ITEM_TOTAL_SIZE = ITEM_WIDTH + ITEM_GAP;

const weekdays_en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdays_ar = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const PlannerDateBar: React.FC<PlannerDateBarProps> = ({
  month,
  year,
  todos,
  onSelectDay,
  selectedDay = null,
  isArabic = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const isDark = colors.statusBarStyle === 'light-content';
  const activeFill = isDark ? '#C8F135' : '#FD8B2D';
  const activeInk = isDark ? '#16270E' : '#FFFFFF';

  const today = useMemo(() => new Date(), []);
  const isCurrentMonthAndYear = today.getFullYear() === year && today.getMonth() === month;
  const todayDay = isCurrentMonthAndYear ? today.getDate() : null;

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);

  const daysList = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Precompute tasks for each day of this month & year
  const taskCountByDay = useMemo(() => {
    const counts = new Map<number, number>();
    if (!todos || todos.length === 0) return counts;

    for (const todo of todos) {
      const ts = getEffectiveTaskDay(todo);
      const d = new Date(ts);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        counts.set(day, (counts.get(day) || 0) + 1);
      }
    }
    return counts;
  }, [todos, year, month]);

  const activeDayNumber = selectedDay !== undefined && selectedDay !== null
    ? selectedDay
    : (isCurrentMonthAndYear ? todayDay : null);

  // Center on today or scroll to start on month/year changes
  const scrollToTarget = useCallback((index: number, animated = true) => {
    if (index < 0 || index >= daysList.length) return;
    try {
      flatListRef.current?.scrollToIndex({
        index,
        animated,
        viewPosition: 0.5,
      });
    } catch {
      // Handled by onScrollToIndexFailed
    }
  }, [daysList.length]);

  useEffect(() => {
    const targetIndex = isCurrentMonthAndYear && todayDay ? todayDay - 1 : 0;
    const timer = setTimeout(() => {
      scrollToTarget(targetIndex, false);
    }, 80);
    return () => clearTimeout(timer);
  }, [month, year, isCurrentMonthAndYear, todayDay, scrollToTarget]);

  const renderDayItem = ({ item: day }: { item: number; index: number }) => {
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay();
    const weekdayStr = isArabic ? weekdays_ar[dayOfWeek] : weekdays_en[dayOfWeek];
    const isActive = activeDayNumber === day;
    const taskCount = taskCountByDay.get(day) || 0;

    return (
      <LivePress
        key={day}
        pressScale={0.92}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelectDay(day);
        }}
        style={[
          styles.dayCard,
          isActive
            ? [
                styles.dayCardActive,
                {
                  backgroundColor: activeFill,
                  borderColor: activeFill,
                  shadowColor: activeFill,
                },
              ]
            : [
                styles.dayCardInactive,
                {
                  backgroundColor: isDark ? '#20222B' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
                },
              ],
        ]}
      >
        <Text
          style={[
            styles.weekdayText,
            {
              color: isActive ? activeInk : colors.textMuted,
              fontWeight: isActive ? '800' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {weekdayStr}
        </Text>

        <Text
          style={[
            styles.dayNumText,
            {
              color: isActive ? activeInk : colors.text,
              fontWeight: isActive ? '900' : '700',
            },
          ]}
        >
          {day}
        </Text>

        {/* Task indicator dot */}
        {taskCount > 0 && (
          <View
            style={[
              styles.taskDot,
              { backgroundColor: isActive ? activeInk : activeFill },
            ]}
          />
        )}
      </LivePress>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header above the day wheel */}
      <View
        style={[
          styles.headerRow,
          isArabic && { flexDirection: 'row-reverse' },
        ]}
      >
        <View style={[styles.headerLabelGroup, isArabic && { flexDirection: 'row-reverse' }]}>
          <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
          <Text style={[styles.headerTitle, { color: colors.textMuted }]}>
            {isArabic ? 'أيام الشهر' : 'Days of Month'}
          </Text>
        </View>

        {isCurrentMonthAndYear && todayDay && (
          <LivePress
            pressScale={0.94}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              scrollToTarget(todayDay - 1, true);
            }}
            style={[
              styles.todayBtn,
              {
                backgroundColor: isDark ? 'rgba(200, 241, 53, 0.16)' : 'rgba(253, 139, 45, 0.14)',
                borderColor: isDark ? 'rgba(200, 241, 53, 0.32)' : 'rgba(253, 139, 45, 0.34)',
              },
            ]}
          >
            <View style={[styles.todayIndicator, { backgroundColor: activeFill }]} />
            <Text style={[styles.todayBtnText, { color: activeFill }]}>
              {isArabic ? 'اليوم' : 'Today'}
            </Text>
          </LivePress>
        )}
      </View>

      {/* Horizontal Day Wheel */}
      <FlatList
        ref={flatListRef}
        data={daysList}
        renderItem={renderDayItem}
        keyExtractor={(day) => String(day)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.stripContainer,
          isArabic && { flexDirection: 'row-reverse' },
        ]}
        getItemLayout={(_data, index) => ({
          length: ITEM_TOTAL_SIZE,
          offset: ITEM_TOTAL_SIZE * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
              viewPosition: 0.5,
            });
          }, 100);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  todayBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stripContainer: {
    paddingHorizontal: 16,
    gap: ITEM_GAP,
    paddingVertical: 6,
  },
  dayCard: {
    width: ITEM_WIDTH,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayCardInactive: {},
  dayCardActive: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  weekdayText: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
  dayNumText: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  taskDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default PlannerDateBar;
