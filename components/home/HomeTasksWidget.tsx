import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { CardStack } from '@/components/CardStack';
import ActiveTaskCard from '@/components/ActiveTaskCard';
import { getAppFont } from '@/utils/globalFont';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const TASK_UNIFIED_COLOR = '#AFE607';
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
  onReopenTask?: (task: any) => void;
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
  onReopenTask,
  onEditTask,
  onOpenTaskDetail,
  onAddTask,
  onViewAll,
}) => {
  const { colors, isDarkMode } = useTheme();

  // Filter out placeholder items and ensure unfinished tasks sit in front while completed tasks move to the back
  const safeTasks = useMemo(() => {
    const valid = (Array.isArray(tasks) ? tasks : []).filter(
      (t) => Boolean(t && t._id && !String(t._id).startsWith('sample_'))
    );
    return [...valid].sort((a, b) => {
      const aDone = a.status === 'done' || a.status === 'completed' ? 1 : 0;
      const bDone = b.status === 'done' || b.status === 'completed' ? 1 : 0;
      return aDone - bDone;
    });
  }, [tasks]);

  const resetOrderKey = useMemo(() => {
    const doneKey = safeTasks
      .filter((t) => t.status === 'done' || t.status === 'completed')
      .map((t) => String(t._id))
      .sort()
      .join(',');
    const pendingKey = safeTasks
      .filter((t) => t.status !== 'done' && t.status !== 'completed')
      .map((t) => String(t._id))
      .join(',');
    return `${doneKey}|${pendingKey}`;
  }, [safeTasks]);

  const handleOpenDetail = useCallback(
    (taskId: string) => {
      if (onOpenTaskDetail) {
        onOpenTaskDetail(taskId);
      } else if (onEditTask) {
        onEditTask(taskId);
      }
    },
    [onOpenTaskDetail, onEditTask]
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

    // 1 to 4+ tasks: fill real tasks, and pad with clean empty guide slots up to 4 total
    const filled: React.ReactNode[] = [];
    const limit = safeTasks.length;

    for (let i = 0; i < limit; i++) {
      const task = safeTasks[i];
      filled.push(
        <ActiveTaskCard
          key={String(task._id)}
          task={task}
          cardIndex={i}
          cardColor={TASK_UNIFIED_COLOR}
          cardBadgeLabel={
            i === 0
              ? isArabic
                ? 'المهمة النشطة'
                : 'Active Task'
              : `${isArabic ? 'مهمة' : 'Task'} #${i + 1}`
          }
          isArabic={isArabic}
          onRunTask={() => onRunTask(task)}
          onPauseTask={() => onPauseTask(task)}
          onCompleteTask={() => onCompleteTask(task)}
          onReopenTask={onReopenTask ? () => onReopenTask(task) : undefined}
          onOpenDetail={() => handleOpenDetail(task._id)}
          onAddTask={onAddTask}
          style={{ width: '100%', height: '100%' }}
        />
      );
    }

    // Pad up to 4 cards so fan deck effect always looks layered
    while (filled.length < 4) {
      const slotIndex = filled.length;
      filled.push(
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
    }

    return filled;
  }, [
    safeTasks,
    isArabic,
    onRunTask,
    onPauseTask,
    onCompleteTask,
    onReopenTask,
    handleOpenDetail,
    onAddTask,
  ]);

  const sectionVioletColor = isDarkMode ? SECTION_VIOLET : '#8B53FE';

  return (
    <View style={styles.container}>
      {/* Widget Section Header */}
      <View
        style={[
          styles.headerRow,
          isArabic && styles.rowRtl,
        ]}
      >
        <View
          style={[
            styles.titleGroup,
            isArabic && styles.rowRtl,
          ]}
        >
          <Text
            style={[
              styles.titleText,
              {
                color: sectionVioletColor,
                fontFamily: getAppFont('black', isArabic),
              },
            ]}
          >
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
            <Text
              style={[
                styles.countBadgeText,
                {
                  color: sectionVioletColor,
                  fontFamily: getAppFont('black', isArabic),
                },
              ]}
            >
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
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'عرض كل المهام' : 'View all tasks'}
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
            ]}
          >
            <Text
              style={[
                styles.viewAllText,
                {
                  color: sectionVioletColor,
                  fontFamily: getAppFont('bold', isArabic),
                },
              ]}
            >
              {isArabic ? 'عرض الكل' : 'View All'}
            </Text>
            <Ionicons
              name={isArabic ? 'chevron-back' : 'chevron-forward'}
              size={13}
              color={sectionVioletColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Fan / Deck Stack Container with exact proportions */}
      <View style={styles.stackWrapper}>
        <CardStack
          cards={stackCards}
          layout="fan"
          visible={4}
          spread={0.65}
          depth={0.45}
          radius={28}
          cardHeight={270}
          cardWidth={Math.min(SCREEN_WIDTH - 52, 330)}
          peek={26}
          tilt={22}
          threshold={80}
          isRTL={isArabic}
          autoResetToTop={false}
          resetOrderKey={resetOrderKey}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    marginBottom: 12,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 16,
    zIndex: 20,
    elevation: Platform.OS === 'android' ? 25 : undefined,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  stackWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: Platform.OS === 'android' ? 20 : undefined,
    overflow: 'visible',
    marginTop: 6,
    marginBottom: 10,
  },
});

export default HomeTasksWidget;
