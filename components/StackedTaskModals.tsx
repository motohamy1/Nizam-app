import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Id } from '@/convex/_generated/dataModel';
import { useActiveTask } from './ActiveTaskContext';
import type { TaskItem } from './ActiveTaskContext';

export type { TaskItem } from './ActiveTaskContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface StackedTaskModalsProps {
  tasks: TaskItem[];
  isArabic?: boolean;
  now: number;
  goals?: any[];
  onRunTask: (task: TaskItem) => void;
  onPauseTask: (task: TaskItem) => void;
  onCompleteTask: (task: TaskItem) => void;
  onReopenTask: (task: TaskItem) => void;
  onOpenDetail: (id: Id<'todos'>, section?: 'subtask') => void;
  onAddTask: () => void;
}

export const StackedTaskModals: React.FC<StackedTaskModalsProps> = ({
  tasks,
  isArabic = false,
  now,
  goals,
  onRunTask,
  onPauseTask,
  onCompleteTask,
  onReopenTask,
  onOpenDetail,
  onAddTask,
}) => {
  // Pinned and expanded by default on the page — no popup modal
  const [isExpanded, setIsExpanded] = useState(true);

  const doneCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks]);
  const pendingCount = tasks.length - doneCount;

  const toggleExpanded = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  // Active Task synchronization with shared context
  const activeTaskState = useActiveTask();
  const activeTask = activeTaskState?.activeTask ?? null;
  const selectTask = activeTaskState?.selectTask;
  const advanceAfterComplete = activeTaskState?.advanceAfterComplete;

  const handleRunTaskAction = (task: TaskItem) => {
    selectTask?.(task);
    onRunTask(task);
  };

  const handlePauseTaskAction = (task: TaskItem) => {
    selectTask?.(task);
    onPauseTask(task);
  };

  const handleCompleteTaskAction = (task: TaskItem) => {
    advanceAfterComplete?.(task);
    onCompleteTask(task);
  };

  // Goal id → title mapping
  const goalNames = useMemo(() => {
    const map: Record<string, string> = {};
    (goals || []).forEach((g: any) => {
      if (g?._id && (g.text || g.title)) map[g._id] = g.text || g.title;
    });
    return map;
  }, [goals]);

  // Priority badge styling
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'Urgent':
        return {
          bg: 'rgba(232, 62, 140, 0.20)',
          text: '#f1498b',
          border: 'rgba(232, 62, 140, 0.40)',
          label: isArabic ? 'عاجل' : 'Urgent',
        };
      case 'High':
        return {
          bg: 'rgba(251, 191, 36, 0.20)',
          text: '#fbbf24',
          border: 'rgba(251, 191, 36, 0.40)',
          label: isArabic ? 'مرتفع' : 'High',
        };
      case 'Medium':
        return {
          bg: 'rgba(16, 185, 129, 0.20)',
          text: '#10b981',
          border: 'rgba(16, 185, 129, 0.40)',
          label: isArabic ? 'متوسط' : 'Medium',
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.08)',
          text: '#a1a1aa',
          border: 'rgba(255, 255, 255, 0.15)',
          label: isArabic ? 'عادي' : 'Low',
        };
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#141418', '#0c0c0e']}
        style={styles.card}
      >
        {/* ── Header Row (Tap to expand / collapse in-place) ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={toggleExpanded}
          style={[styles.headerRow, isArabic && styles.rowRtl]}
        >
          <View style={[styles.headerLeft, isArabic && styles.rowRtl]}>
            <View style={styles.iconBadge}>
              <Ionicons name="checkbox-outline" size={20} color="#ff5c16" />
            </View>
            <View style={[{ minWidth: 0, flexShrink: 1 }, isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
              <View style={[styles.titleGroup, isArabic && styles.rowRtl]}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {isArabic ? 'مهام اليوم' : "Today's Tasks"}
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{tasks.length}</Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {tasks.length === 0
                  ? (isArabic ? 'لا توجد مهام اليوم' : 'No tasks today')
                  : `${pendingCount} ${isArabic ? 'متبقية' : 'pending'} • ${doneCount}/${tasks.length} ${isArabic ? 'مكتمل' : 'done'}`}
              </Text>
            </View>
          </View>

          <View style={[styles.headerRight, isArabic && styles.rowRtl]}>
            {/* Toggle Arrow Button */}
            <View style={styles.toggleBtn}>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#ff5c16"
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Collapsible Body (Rendered directly on page when expanded) ── */}
        {isExpanded && (
          <View style={styles.bodyContainer}>
            {/* Task Items List */}
            {tasks.length === 0 ? (
              <View style={styles.emptyTasksContainer}>
                <Ionicons name="clipboard-outline" size={32} color="rgba(255, 92, 22, 0.4)" />
                <Text style={styles.emptyTasksTitle}>
                  {isArabic ? 'لا توجد مهام اليوم' : 'No tasks today'}
                </Text>
              </View>
            ) : (
              <View style={styles.tasksList}>
                {tasks.map((t) => {
                  const priorityInfo = getPriorityBadge(t.priority);
                  const isTaskDone = t.status === 'done';
                  const isSelected = activeTask?._id === t._id;
                  const isRunning = t.status === 'in_progress';

                  return (
                    <View
                      key={t._id}
                      style={[
                        styles.taskRow,
                        isTaskDone && { opacity: 0.6 },
                        isSelected && { borderColor: '#ff5c16', backgroundColor: 'rgba(255, 92, 22, 0.08)' },
                        isArabic && styles.rowRtl,
                      ]}
                    >
                      {/* Checkbox */}
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          if (isTaskDone) {
                            selectTask?.(t._id);
                            onReopenTask(t);
                          } else {
                            handleCompleteTaskAction(t);
                          }
                        }}
                        style={[
                          styles.checkbox,
                          isTaskDone && { backgroundColor: '#ff5c16', borderColor: '#ff5c16' },
                        ]}
                      >
                        {isTaskDone && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                      </TouchableOpacity>

                      {/* Task Info - tap selects as active task */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          selectTask?.(t._id);
                        }}
                        style={{ flex: 1, marginHorizontal: 8 }}
                      >
                        <Text
                          numberOfLines={2}
                          style={[
                            styles.taskTitle,
                            isTaskDone && styles.taskDoneText,
                            isArabic && { textAlign: 'right' },
                          ]}
                        >
                          {t.text}
                        </Text>
                        <View style={[styles.metaRow, isArabic && styles.rowRtl]}>
                          {isSelected && (
                            <View style={styles.selectedPill}>
                              <Text style={styles.selectedPillText}>
                                {isArabic ? 'النشطة' : 'Active'}
                              </Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.priorityPill,
                              {
                                backgroundColor: priorityInfo.bg,
                                borderColor: priorityInfo.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.priorityPillText,
                                { color: priorityInfo.text },
                              ]}
                            >
                              {priorityInfo.label}
                            </Text>
                          </View>
                          {t.goalId && goalNames[t.goalId] && (
                            <View style={styles.metaChip}>
                              <Ionicons name="flag-outline" size={10} color="#ff5c16" />
                              <Text numberOfLines={1} style={styles.metaChipText}>
                                {goalNames[t.goalId]}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Actions: Edit button + Run/Pause Button */}
                      <View style={[styles.actionsRow, isArabic && styles.rowRtl]}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onOpenDetail(t._id);
                          }}
                          style={styles.pencilBtn}
                        >
                          <Ionicons name="pencil-outline" size={13} color="#ff5c16" />
                        </TouchableOpacity>

                        {!isTaskDone && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                              if (isRunning) {
                                handlePauseTaskAction(t);
                              } else {
                                handleRunTaskAction(t);
                              }
                            }}
                            style={[
                              styles.runButton,
                              isRunning && styles.runButtonActive,
                            ]}
                          >
                            <Text style={styles.runButtonIcon}>
                              {isRunning ? '❚❚' : '▶'}
                            </Text>
                            <Text style={styles.runButtonText}>
                              {isRunning
                                ? isArabic
                                  ? 'إيقاف'
                                  : 'Pause'
                                : isArabic
                                ? 'تشغيل'
                                : 'Run'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Bottom Add Task Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddTask();
              }}
              style={styles.addTaskBtn}
            >
              <Ionicons name="add" size={16} color="#000000" />
              <Text style={styles.addTaskBtnText}>
                {isArabic ? 'إضافة مهمة جديدة' : 'Add New Task'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#ff5c16',
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#ff5c16',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 92, 22, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 22, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 92, 22, 0.20)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  countBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#ff5c16',
  },
  cardSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 92, 22, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 22, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  tasksList: {
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 22, 0.20)',
    borderRadius: 14,
    padding: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: 'rgba(255, 92, 22, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  taskDoneText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  selectedPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 92, 22, 0.25)',
    borderWidth: 1,
    borderColor: '#ff5c16',
  },
  selectedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ff5c16',
  },
  priorityPill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderWidth: 1,
  },
  priorityPillText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    maxWidth: 130,
  },
  metaChipText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#ff5c16',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pencilBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 92, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 22, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff5c16',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
  },
  runButtonActive: {
    backgroundColor: '#ff3c00',
  },
  runButtonIcon: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
  },
  runButtonText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
  },
  addTaskBtn: {
    backgroundColor: '#ff5c16',
    borderRadius: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  addTaskBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#000000',
  },
  emptyTasksContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyTasksTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default StackedTaskModals;
