import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { CardStack } from '@/components/CardStack';
import ActiveTaskCard from '@/components/ActiveTaskCard';

export const TASK_UNIFIED_COLOR = '#d4ff32';
export const PURPLE_ACCENT = '#A084E8';
export const SECTION_VIOLET = '#C084FC';

interface HomeTasksWidgetProps {
  tasks: any[];
  doneCount: number;
  totalCount: number;
  isArabic?: boolean;
  onRunTask: (task: any) => void;
  onPauseTask: (task: any) => void;
  onCompleteTask: (task: any) => void;
  onEditTask?: (id: any, section?: any) => void;
  onOpenTaskDetail?: (taskId: string) => void;
  onAddTask?: () => void;
  onViewAll?: () => void;
}

export const HomeTasksWidget: React.FC<HomeTasksWidgetProps> = ({
  tasks,
  doneCount,
  totalCount,
  isArabic = false,
  onRunTask,
  onPauseTask,
  onCompleteTask,
  onEditTask,
  onOpenTaskDetail,
  onAddTask,
  onViewAll,
}) => {
  const { colors, isDarkMode } = useTheme();

  const sectionVioletColor = isDarkMode ? '#C084FC' : '#7C3AED';

  // Defensive array checks
  const safeTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((t) => t && typeof t === 'object' && t._id);
  }, [tasks]);

  const handleOpenTask = useCallback(
    (taskId: string) => {
      onOpenTaskDetail?.(taskId);
    },
    [onOpenTaskDetail]
  );

  // Render cards for the CardStack (up to 4 cards)
  const stackCards = useMemo(() => {
    // If no tasks exist for today, show 1 prominent creation card + 3 empty cards behind it
    if (safeTasks.length === 0) {
      return [
        <ActiveTaskCard
          key="empty_prompt_0"
          task={null}
          isFirstTaskPrompt={true}
          cardIndex={0}
          cardColor={TASK_UNIFIED_COLOR}
          isArabic={isArabic}
          onRunTask={() => {}}
          onPauseTask={() => {}}
          onCompleteTask={() => {}}
          onOpenDetail={() => {}}
          onAddTask={onAddTask}
          style={{ width: '100%', height: '100%' }}
        />,
        <ActiveTaskCard
          key="empty_prompt_1"
          task={null}
          isEmptySlot={true}
          cardIndex={1}
          cardColor={TASK_UNIFIED_COLOR}
          isArabic={isArabic}
          onRunTask={() => {}}
          onPauseTask={() => {}}
          onCompleteTask={() => {}}
          onOpenDetail={() => {}}
          onAddTask={onAddTask}
          style={{ width: '100%', height: '100%' }}
        />,
        <ActiveTaskCard
          key="empty_prompt_2"
          task={null}
          isEmptySlot={true}
          cardIndex={2}
          cardColor={TASK_UNIFIED_COLOR}
          isArabic={isArabic}
          onRunTask={() => {}}
          onPauseTask={() => {}}
          onCompleteTask={() => {}}
          onOpenDetail={() => {}}
          onAddTask={onAddTask}
          style={{ width: '100%', height: '100%' }}
        />,
        <ActiveTaskCard
          key="empty_prompt_3"
          task={null}
          isEmptySlot={true}
          cardIndex={3}
          cardColor={TASK_UNIFIED_COLOR}
          isArabic={isArabic}
          onRunTask={() => {}}
          onPauseTask={() => {}}
          onCompleteTask={() => {}}
          onOpenDetail={() => {}}
          onAddTask={onAddTask}
          style={{ width: '100%', height: '100%' }}
        />,
      ];
    }

    // Always fill up to 4 slots
    const totalSlots = Math.max(4, Math.min(safeTasks.length, 4));
    return Array.from({ length: totalSlots }).map((_, slotIndex) => {
      const task = safeTasks[slotIndex];

      if (task) {
        return (
          <ActiveTaskCard
            key={task._id}
            task={task}
            cardIndex={slotIndex}
            cardColor={TASK_UNIFIED_COLOR}
            isArabic={isArabic}
            onRunTask={onRunTask}
            onPauseTask={onPauseTask}
            onCompleteTask={onCompleteTask}
            onOpenDetail={handleOpenTask}
            onAddTask={onAddTask}
            style={{ width: '100%', height: '100%' }}
          />
        );
      }

      // Remaining slot behind real user tasks
      return (
        <ActiveTaskCard
          key={`empty_slot_${slotIndex}`}
          task={null}
          isEmptySlot={true}
          cardIndex={slotIndex}
          cardColor={TASK_UNIFIED_COLOR}
          isArabic={isArabic}
          onRunTask={() => {}}
          onPauseTask={() => {}}
          onCompleteTask={() => {}}
          onOpenDetail={() => {}}
          onAddTask={onAddTask}
          style={{ width: '100%', height: '100%' }}
        />
      );
    });
  }, [
    safeTasks,
    isArabic,
    onRunTask,
    onPauseTask,
    onCompleteTask,
    handleOpenTask,
    onAddTask,
  ]);

  return (
    <View style={styles.container}>
      {/* Widget Section Header */}
      <View
        style={[
          styles.headerRow,
          isArabic && { flexDirection: 'row-reverse' },
        ]}
      >
        <View
          style={[
            styles.titleGroup,
            isArabic && { flexDirection: 'row-reverse' },
          ]}
        >
          <Text style={[styles.titleText, { color: sectionVioletColor }]}>
            {isArabic ? 'مهام اليوم' : "Today's Tasks"}
          </Text>

          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(192, 132, 252, 0.12)'
                  : 'rgba(124, 58, 237, 0.08)',
                borderColor: isDarkMode
                  ? 'rgba(192, 132, 252, 0.28)'
                  : 'rgba(124, 58, 237, 0.20)',
              },
            ]}
          >
            <Text style={[styles.countBadgeText, { color: sectionVioletColor }]}>
              {doneCount}/{totalCount}
            </Text>
          </View>
        </View>

        {onViewAll && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onViewAll();
            }}
            style={[
              styles.viewAllBtn,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(192, 132, 252, 0.10)'
                  : 'rgba(124, 58, 237, 0.06)',
                borderColor: isDarkMode
                  ? 'rgba(192, 132, 252, 0.24)'
                  : 'rgba(124, 58, 237, 0.16)',
              },
              isArabic && { flexDirection: 'row-reverse' },
            ]}
          >
            <Text style={[styles.viewAllText, { color: sectionVioletColor }]}>
              {isArabic ? 'عرض الكل' : 'View all'}
            </Text>
            <Ionicons
              name={isArabic ? 'chevron-back' : 'chevron-forward'}
              size={13}
              color={sectionVioletColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 4-Task CardStack with React Bits 'fan' layout */}
      <View
        style={{
          zIndex: 10,
          elevation: Platform.OS === 'android' ? 20 : undefined,
          overflow: 'visible',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 14,
          marginBottom: 10,
        }}
      >
        <CardStack
          cards={stackCards}
          layout="fan"
          cardWidth={330}
          cardHeight={215}
          isRTL={isArabic}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});

export default HomeTasksWidget;
