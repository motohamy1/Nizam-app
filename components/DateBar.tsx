import { useAuth } from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutAnimation, Platform, Text, UIManager, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import LivePress from './LivePress';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DateBarProps {
  selectedDate: number;
  todayStart: number;
  onSelectDate: (dayStart: number) => void;
  onOpenDayPlanner?: (dayTimestamp: number) => void;
  homeStyles: any;
  isArabic?: boolean;
  taskCounts?: Map<number, number>;
  defaultCollapsed?: boolean;
}

const ITEM_WIDTH = 48;
const ITEM_GAP = 8;
const ITEM_TOTAL_SIZE = ITEM_WIDTH + ITEM_GAP;

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const DateBar: React.FC<DateBarProps> = ({
  selectedDate,
  todayStart,
  onSelectDate,
  onOpenDayPlanner,
  homeStyles,
  isArabic = false,
  taskCounts,
  defaultCollapsed = true,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const flatListRef = useRef<FlatList>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const selectedDateObj = useMemo(() => new Date(selectedDate), [selectedDate]);
  const selectedYear = selectedDateObj.getFullYear();
  const selectedMonth = selectedDateObj.getMonth();

  // Generate days strictly for the selected month (Day 1 to Last Day of Month)
  const daysList = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days: number[] = [];
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(selectedYear, selectedMonth, day, 0, 0, 0, 0).getTime());
    }
    return days;
  }, [selectedYear, selectedMonth]);

  const selectedIndex = useMemo(() => {
    const dayNum = new Date(selectedDate).getDate();
    return Math.max(0, Math.min(daysList.length - 1, dayNum - 1));
  }, [daysList.length, selectedDate]);

  const autoReturnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoReturnTimer = () => {
    if (autoReturnTimer.current) {
      clearTimeout(autoReturnTimer.current);
      autoReturnTimer.current = null;
    }
  };

  const scheduleAutoReturn = () => {
    clearAutoReturnTimer();
    autoReturnTimer.current = setTimeout(() => {
      if (!isCollapsed && selectedIndex >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: selectedIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }
    }, 5000);
  };

  useEffect(() => {
    return () => {
      clearAutoReturnTimer();
    };
  }, []);

  // Center on the selected day when day, month, year changes or when expanded
  useEffect(() => {
    if (!isCollapsed && selectedIndex >= 0 && flatListRef.current) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }, 60);

      return () => clearTimeout(timer);
    }
  }, [isCollapsed, selectedIndex, selectedMonth, selectedYear]);

  const isSelectedToday = startOfDay(selectedDate) === startOfDay(todayStart);

  const dateLabel = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDate();
    const month = d.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }, [selectedDate, isArabic]);

  const handleToggleCollapse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(prev => !prev);
  };

  const renderDay = ({ item: dayStart, index }: { item: number; index: number }) => {
    const d = new Date(dayStart);
    const isActive = dayStart === startOfDay(selectedDate);
    const hasTasks = (taskCounts?.get(dayStart) || 0) > 0;
    const weekdayStr = d.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { weekday: 'short' });
    const dayNum = d.getDate();

    return (
      <LivePress
        key={dayStart}
        onPress={() => {
          const isAlreadyActive = dayStart === startOfDay(selectedDate);
          clearAutoReturnTimer();
          onSelectDate(dayStart);
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
          if (isAlreadyActive && onOpenDayPlanner) {
            onOpenDayPlanner(dayStart);
          }
        }}
        onLongPress={() => {
          if (onOpenDayPlanner) {
            onOpenDayPlanner(dayStart);
          }
        }}
        style={[homeStyles.dateBarDay, isActive && homeStyles.dateBarDayActive]}
      >
        <Text
          style={[homeStyles.dateBarWeekday, isActive && homeStyles.dateBarWeekdayActive]}
          numberOfLines={1}
        >
          {weekdayStr}
        </Text>
        <Text
          style={[homeStyles.dateBarDayNum, isActive && homeStyles.dateBarDayNumActive]}
        >
          {dayNum}
        </Text>
        {hasTasks && (
          <View
            style={[
              homeStyles.dateBarDot,
              isActive && { backgroundColor: '#16270E' },
            ]}
          />
        )}
      </LivePress>
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).easing(Easing.out(Easing.cubic))}
      style={homeStyles.dateBarContainer}
    >
      {/* Header: Day Month Year with Dropdown/Collapse Chevron & Today Reset Button / Planner Detail */}
      <View
        style={[
          homeStyles.dateBarHeader,
          isCollapsed && { marginBottom: 6 },
          isArabic && { flexDirection: 'row-reverse' },
        ]}
      >
        <LivePress
          style={[homeStyles.dateBarMonthWrapper, isArabic && { flexDirection: 'row-reverse' }]}
          onPress={handleToggleCollapse}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowDatePicker(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={
            isCollapsed
              ? (isArabic ? 'فتح شريط الأيام' : 'Expand day bar')
              : (isArabic ? 'طي شريط الأيام' : 'Collapse day bar')
          }
        >
          <Text style={homeStyles.dateBarMonth} numberOfLines={1}>
            {dateLabel}
          </Text>
          <Ionicons
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={16}
            color={colors.textMuted}
            style={homeStyles.dateBarChevron}
          />
        </LivePress>

        <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
          {onOpenDayPlanner && (
            <LivePress
              style={homeStyles.dateBarPlannerBtn}
              onPress={() => onOpenDayPlanner(selectedDate)}
            >
              <Ionicons name="calendar-outline" size={13} color={colors.primary} />
              <Text style={homeStyles.dateBarPlannerBtnText}>
                {isArabic ? 'تفاصيل اليوم' : 'Day Detail'}
              </Text>
            </LivePress>
          )}

          {!isSelectedToday && (
            <LivePress
              style={homeStyles.dateBarReset}
              onPress={() => {
                clearAutoReturnTimer();
                onSelectDate(todayStart);
              }}
            >
              <Text style={homeStyles.dateBarResetText}>{t.today}</Text>
            </LivePress>
          )}
        </View>
      </View>

      {/* Horizontally Scrollable Month Days Carousel */}
      {!isCollapsed && (
        <FlatList
          ref={flatListRef}
          data={daysList}
          renderItem={renderDay}
          keyExtractor={item => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={selectedIndex >= 0 ? selectedIndex : undefined}
          getItemLayout={(_data, index) => ({
            length: ITEM_TOTAL_SIZE,
            offset: ITEM_TOTAL_SIZE * index,
            index,
          })}
          onScrollBeginDrag={() => {
            clearAutoReturnTimer();
          }}
          onScrollEndDrag={() => {
            scheduleAutoReturn();
          }}
          onMomentumScrollBegin={() => {
            clearAutoReturnTimer();
          }}
          onMomentumScrollEnd={() => {
            scheduleAutoReturn();
          }}
          onScrollToIndexFailed={info => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: false,
                viewPosition: 0.5,
              });
            }, 100);
          }}
          contentContainerStyle={[
            homeStyles.dateBarStrip,
            isArabic && { flexDirection: 'row-reverse' },
          ]}
        />
      )}

      {/* Date Picker Dialog */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(selectedDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant={isDarkMode ? 'dark' : 'light'}
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date && (Platform.OS === 'ios' || event.type === 'set')) {
              onSelectDate(startOfDay(date.getTime()));
            }
          }}
        />
      )}
    </Animated.View>
  );
};

export default DateBar;
