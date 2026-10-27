import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CardStack } from '@/components/CardStack';
import ActiveTaskCard from '@/components/ActiveTaskCard';
import { TaskItem } from '@/components/ActiveTaskContext';
import { Id } from '@/convex/_generated/dataModel';

export const PURPLE_ACCENT = '#8A2BE2';

interface HomeTasksWidgetProps {
  tasks: TaskItem[];
  doneCount: number;
  totalCount: number;
  isArabic?: boolean;
  onRunTask: (task: TaskItem) => void;
  onPauseTask: (task: TaskItem) => void;
  onCompleteTask: (task: TaskItem) => void;
  onEditTask: (id: Id<'todos'>, section?: 'subtask') => void;
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
  onEditTask,
  onAddTask,
  onViewAll,
}) => {
  // Cap to 4 tasks as required
  const displayTasks = tasks.slice(0, 4);

  const cards = displayTasks.length > 0
    ? displayTasks.map((task) => (
        <ActiveTaskCard
          key={task._id}
          task={task}
          isArabic={isArabic}
          onRunTask={onRunTask}
          onPauseTask={onPauseTask}
          onCompleteTask={onCompleteTask}
          onOpenDetail={onEditTask}
          onAddTask={onAddTask}
          style={{ height: '100%' }}
        />
      ))
    : [
        <ActiveTaskCard
          key="empty-today-task"
          task={null}
          isArabic={isArabic}
          onRunTask={onRunTask}
          onPauseTask={onPauseTask}
          onCompleteTask={onCompleteTask}
          onOpenDetail={onEditTask}
          onAddTask={onAddTask}
          style={{ height: '100%' }}
        />,
      ];

  return (
    <View style={styles.container}>
      {/* Top Grab Handle Indicator */}
      <View style={styles.grabHandle} />

      {/* Header Row: Title + Progress Badge + View All */}
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
          <Text style={styles.titleText}>
            {isArabic ? 'مهام اليوم' : "Today's Tasks"}
          </Text>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
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
              isArabic && { flexDirection: 'row-reverse' },
            ]}
          >
            <Text style={styles.viewAllText}>
              {isArabic ? 'عرض الكل' : 'View all'}
            </Text>
            <Ionicons
              name={isArabic ? 'chevron-back' : 'chevron-forward'}
              size={14}
              color="rgba(255, 255, 255, 0.85)"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 4-Task CardStack with fan layout */}
      <View
        style={{
          zIndex: 10,
          elevation: Platform.OS === 'android' ? 20 : undefined,
          overflow: 'visible',
        }}
      >
        <CardStack
          layout="fan"
          visible={4}
          spread={0.6}
          depth={0.5}
          radius={32}
          cardHeight={275}
          peek={44}
          threshold={85}
          isRTL={isArabic}
          autoResetToTop={true}
          autoResetDelay={9000}
          style={{ marginTop: 8, marginBottom: 12 }}
          cards={cards}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: PURPLE_ACCENT,
    borderRadius: 36,
    marginHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  grabHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.88)',
  },
});

export default HomeTasksWidget;
