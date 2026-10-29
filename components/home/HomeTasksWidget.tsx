import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { Id } from '@/convex/_generated/dataModel';
import { ActiveTaskCard } from '@/components/ActiveTaskCard';
import { CardStack } from '@/components/CardStack';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PURPLE_ACCENT = '#A084E8';
export const TASK_UNIFIED_COLOR = '#FF9470';

// Unified tasks card section bg color to be strictly the coral peach color of the first card (#FF9470)
export const TASK_STACK_PALETTES = [
  '#FF9470', // Card 0 (Active Task): Warm Coral Peach
  '#FF9470', // Card 1: Unified Warm Coral Peach
  '#FF9470', // Card 2: Unified Warm Coral Peach
  '#FF9470', // Card 3: Unified Warm Coral Peach
];

interface TaskItem {
  _id: Id<'todos'>;
  text: string;
  status: string;
  priority?: string;
  description?: string;
  timerDuration?: number;
  timerDirection?: 'down' | 'up';
  categoryId?: Id<'projectCategories'>;
  projectId?: string;
  goalId?: Id<'yearlyGoals'>;
}

interface HomeTasksWidgetProps {
  tasks: TaskItem[];
  doneCount: number;
  totalCount: number;
  isArabic?: boolean;
  onRunTask: (task: any) => void;
  onPauseTask: (task: any) => void;
  onCompleteTask: (task: any) => void;
  onOpenDetail?: (id: Id<'todos'>) => void;
  onEditTask?: (id: Id<'todos'>) => void;
  onAddTask: () => void;
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
  onOpenDetail,
  onEditTask,
  onAddTask,
  onViewAll,
}) => {
  const { colors, isDarkMode } = useTheme();

  const handleOpenTask = onOpenDetail || onEditTask || (() => {});

  // 4 Default / Placeholder tasks shown when user has fewer than 4 tasks
  // Ensures the fan stack always displays 4 full cards exactly like the reference UI
  const sampleTasks: TaskItem[] = useMemo(() => [
    {
      _id: 'sample_task_1' as Id<'todos'>,
      text: isArabic ? 'إضافة مهمة جديدة لليوم' : 'Add your first task for today',
      description: isArabic ? 'اضغط هنا أو على الزر بالأسفل لإنشاء مهمة' : 'Tap here or on the button below to create a task',
      status: 'not_started',
      priority: 'High',
    },
    {
      _id: 'sample_task_2' as Id<'todos'>,
      text: isArabic ? 'جلسة تركيز بومودورو' : 'Deep Focus Sprint',
      description: isArabic ? 'جلسة عمل مركزة لمدة ٢٥ دقيقة بدون مقاطعة' : '25-minute distraction-free focus block',
      status: 'not_started',
      priority: 'Medium',
      timerDuration: 25 * 60 * 1000,
      timerDirection: 'down',
    },
    {
      _id: 'sample_task_3' as Id<'todos'>,
      text: isArabic ? 'مراجعة أولويات اليوم' : 'Daily Priorities Review',
      description: isArabic ? 'حدد أهم أولوياتك لتحقيق أهدافك' : 'Identify your top needle-moving priorities',
      status: 'not_started',
      priority: 'Low',
    },
    {
      _id: 'sample_task_4' as Id<'todos'>,
      text: isArabic ? 'تنظيم المشاريع والمساحات' : 'Organize Spaces & Projects',
      description: isArabic ? 'قسّم مهامك بحسب مجالات عملك وحياتك' : 'Group work, health, and personal growth',
      status: 'not_started',
      priority: 'Low',
    },
  ], [isArabic]);

  // Combine real user tasks with placeholders to ensure exactly 4 cards in the stack
  const safeTasks = useMemo(() => {
    return (Array.isArray(tasks) ? tasks : []).filter(
      (t): t is TaskItem => Boolean(t && t._id)
    );
  }, [tasks]);

  const stackTasks = useMemo(() => {
    const userSlice = safeTasks.slice(0, 4);
    if (userSlice.length >= 4) return userSlice;
    const needed = 4 - userSlice.length;
    const placeholders = sampleTasks.slice(0, needed);
    return [...userSlice, ...placeholders];
  }, [safeTasks, sampleTasks]);

  // Generate 4 distinct cards for the CardStack all sharing the unified #FF9470 color
  const cards = useMemo(() => {
    return stackTasks.map((task, index) => {
      const isPlaceholder = String(task._id).startsWith('sample_');

      return (
        <ActiveTaskCard
          key={String(task._id)}
          task={task}
          cardColor={TASK_UNIFIED_COLOR}
          cardBadgeLabel={
            index === 0
              ? isArabic ? 'المهمة النشطة' : 'Active Task'
              : `${isArabic ? 'مهمة' : 'Task'} #${index + 1}`
          }
          isArabic={isArabic}
          onRunTask={isPlaceholder ? onAddTask : () => onRunTask(task)}
          onPauseTask={isPlaceholder ? onAddTask : () => onPauseTask(task)}
          onCompleteTask={isPlaceholder ? onAddTask : () => onCompleteTask(task)}
          onOpenDetail={isPlaceholder ? onAddTask : () => handleOpenTask(task._id)}
          onAddTask={onAddTask}
          style={{ width: '100%', height: '100%' }}
        />
      );
    });
  }, [
    stackTasks,
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
          <Text style={[styles.titleText, { color: colors.text }]}>
            {isArabic ? 'مهام اليوم' : "Today's Tasks"}
          </Text>

          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.10)'
                  : 'rgba(0, 0, 0, 0.06)',
                borderColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.16)'
                  : 'rgba(0, 0, 0, 0.10)',
              },
            ]}
          >
            <Text style={[styles.countBadgeText, { color: colors.text }]}>
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
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.14)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
              isArabic && { flexDirection: 'row-reverse' },
            ]}
          >
            <Text style={[styles.viewAllText, { color: colors.text }]}>
              {isArabic ? 'عرض الكل' : 'View all'}
            </Text>
            <Ionicons
              name={isArabic ? 'chevron-back' : 'chevron-forward'}
              size={13}
              color={colors.text}
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
          cards={cards}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 6,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 19,
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
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});

export default HomeTasksWidget;
