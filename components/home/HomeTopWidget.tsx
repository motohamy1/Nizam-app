import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import DateBar from '@/components/DateBar';

interface HomeTopWidgetProps {
  selectedDate: number;
  todayStart: number;
  onSelectDate: (dayStart: number) => void;
  onOpenDayPlanner?: (dayTimestamp: number) => void;
  homeStyles: any;
  isArabic?: boolean;
  taskCounts?: Map<number, number>;
}

export const LIME_ACCENT = '#d4ff32';

export const HomeTopWidget: React.FC<HomeTopWidgetProps> = ({
  selectedDate,
  todayStart,
  onSelectDate,
  onOpenDayPlanner,
  homeStyles,
  isArabic = false,
  taskCounts,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 28 : 20),
        },
      ]}
    >
      <Header tone="onLime" />

      <DateBar
        selectedDate={selectedDate}
        todayStart={todayStart}
        onSelectDate={onSelectDate}
        onOpenDayPlanner={onOpenDayPlanner}
        homeStyles={homeStyles}
        isArabic={isArabic}
        taskCounts={taskCounts}
        defaultCollapsed={false}
        tone="onLime"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LIME_ACCENT,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
});

export default HomeTopWidget;
