import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import CrystalizedBall from './CrystalizedBall';
import { useActiveTask } from './ActiveTaskContext';
import type { TaskItem } from './ActiveTaskContext';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { api } from '@/convex/_generated/api';
import { getServerNow } from '@/utils/offlineStorage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// A query that resolves to a single document can fall back to an empty array
// while offline. Normalise both shapes so we never render an empty label.
const asDoc = (value: any): any =>
  value && !Array.isArray(value) && typeof value === 'object' ? value : null;

export interface ActiveTaskCardProps {
  task?: TaskItem | null;
  cardColor?: string;
  cardBadgeLabel?: string;
  isArabic?: boolean;
  onRunTask: (task: TaskItem) => void;
  onPauseTask: (task: TaskItem) => void;
  onCompleteTask: (task: TaskItem) => void;
  onOpenDetail: (id: any, section?: 'subtask') => void;
  /** Offered when there is no active task yet, so the card never shows a
   *  button that does nothing. */
  onAddTask?: () => void;
  cardIndex?: number;
  /** Extra styles, used when the card sits in the stack. */
  style?: StyleProp<ViewStyle>;
}

/**
 * The Active Task card — the primary card of the home page stack.
 *
 * Displays the current focus task with the Crystalloid Ball timer/progress indicator,
 * expandable subtasks, priority, labels, and bottom action buttons.
 */
export const ActiveTaskCard: React.FC<ActiveTaskCardProps> = React.memo(({
  task,
  cardColor = '#FF9470',
  cardBadgeLabel,
  isArabic = false,
  onRunTask,
  onPauseTask,
  onCompleteTask,
  onOpenDetail,
  onAddTask,
  cardIndex = 0,
  style,
}) => {
  const activeTaskState = useActiveTask();
  const activeTask = task !== undefined ? task : (activeTaskState?.activeTask ?? null);
  const selectTask = activeTaskState?.selectTask;
  const advanceAfterComplete = activeTaskState?.advanceAfterComplete;

  // Subtasks of the active task
  const activeSubtasks = useOfflineQuery<any[]>(
    'todos.getSubtasks',
    api.todos.getSubtasks,
    activeTask?._id && !String(activeTask._id).startsWith('sample_') ? { parentId: activeTask._id } : 'skip'
  );

  // Subtasks toggle in the card (closed by default)
  const [showSubtasksInCard, setShowSubtasksInCard] = useState(false);
  const updateTodo = useOfflineMutation(api.todos.updateTodo, 'todos:updateTodo');

  const handleToggleSubtaskInCard = async (sub: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newStatus = sub.status === 'done' ? 'not_started' : 'done';
    await updateTodo({
      id: sub._id,
      status: newStatus,
    });
  };

  // Linked goal / project / space of the active task
  const linkedGoal = useOfflineQuery<any>(
    'yearlyGoals.getGoal',
    api.yearlyGoals.getGoal,
    activeTask?.goalId ? { id: activeTask.goalId } : 'skip'
  );
  const linkedProject = useOfflineQuery<any>(
    'projects.getProjectMetadata',
    api.projects.getProjectMetadata,
    activeTask?.projectId ? { id: activeTask.projectId } : 'skip'
  );
  const linkedCategory = useOfflineQuery<any>(
    'projects.getCategory',
    api.projects.getCategory,
    activeTask?.categoryId ? { id: activeTask.categoryId } : 'skip'
  );

  const goalName = asDoc(linkedGoal)?.text;
  const projectName = asDoc(linkedProject)?.name;
  const categoryName = asDoc(linkedCategory)?.name;

  // Progress of the active task
  const [now, setNow] = useState<number>(() => getServerNow());
  useEffect(() => {
    if (activeTask?.status === 'in_progress') {
      const interval = setInterval(() => setNow(getServerNow()), 1000);
      return () => clearInterval(interval);
    }
  }, [activeTask?.status]);

  const hasTimer = Boolean(
    activeTask?.timerDuration ||
      activeTask?.timerDirection === 'up' ||
      activeTask?.timerStartedAt ||
      activeTask?.timerAccumulated
  );
  const isCountUp = activeTask?.timerDirection === 'up';
  const isCountDown = !isCountUp;

  let timerValue = 0;
  let activeTaskProgress: number | null = null;

  if (activeTask) {
    const accumulated = activeTask.timerAccumulated || 0;
    const isRunning = activeTask.status === 'in_progress';
    const runningElapsed = isRunning && activeTask.timerStartedAt ? Math.max(0, now - activeTask.timerStartedAt) : 0;
    const totalElapsed = accumulated + runningElapsed;

    if (isCountUp) {
      timerValue = totalElapsed;
      activeTaskProgress = null;
    } else if (activeTask.timerDuration) {
      const duration = activeTask.timerDuration;
      const remaining = Math.max(0, duration - totalElapsed);
      timerValue = remaining;
      activeTaskProgress = Math.min(100, Math.round((totalElapsed / duration) * 100));
    } else {
      timerValue = totalElapsed;
      activeTaskProgress = null;
    }
  }

  // Status badge label and completion percent
  const activeStatusLabel = useMemo(() => {
    if (!activeTask) return isArabic ? 'لا توجد مهام' : 'Idle';
    if (activeTask.status === 'completed') return isArabic ? 'مكتملة' : 'Completed';
    if (activeTask.status === 'in_progress') return isArabic ? 'قيد التنفيذ' : 'In Progress';
    return isArabic ? 'جاهزة' : 'To Do';
  }, [activeTask, isArabic]);

  const showProgressPercent =
    activeTaskProgress !== null &&
    activeTask?.status === 'in_progress' &&
    !isCountUp;

  const getPriorityBadge = (priorityLevel?: string) => {
    switch (priorityLevel) {
      case 'Urgent':
        return {
          text: '#ef4444',
          label: isArabic ? 'عاجل' : 'Urgent',
        };
      case 'High':
        return {
          text: '#fde047',
          label: isArabic ? 'مرتفع' : 'High',
        };
      case 'Medium':
        return {
          text: '#4ade80',
          label: isArabic ? 'متوسط' : 'Medium',
        };
      default:
        return {
          text: '#f1f5f9',
          label: isArabic ? 'عادي' : 'Low',
        };
    }
  };

  const handleRunTaskAction = (targetTask: TaskItem) => {
    selectTask?.(targetTask);
    onRunTask(targetTask);
  };

  const handlePauseTaskAction = (targetTask: TaskItem) => {
    selectTask?.(targetTask);
    onPauseTask(targetTask);
  };

  const handleCompleteTaskAction = (targetTask: TaskItem) => {
    advanceAfterComplete?.(targetTask);
    onCompleteTask(targetTask);
  };

  const badgeText = cardBadgeLabel || (isArabic ? 'المهمة النشطة' : 'Active Task');

  return (
    <View style={[styles.card, { backgroundColor: cardColor }, style]}>
      {/* Background Color Fill */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: cardColor },
        ]}
      />

      {/* Main Content Layout with Upper Content + Pinned Bottom Actions */}
      <View style={styles.cardInner}>
        {/* Upper Part: Header Row + Task Title + Crystalloid Ball Timer + Labels + Subtasks */}
        <View style={styles.upperSection}>
          {/* Header Row (Badge + Status + Open Button) */}
          <View style={[styles.headerRow, isArabic && styles.rowRtl]}>
            <View style={styles.taskBadge}>
              <Text style={styles.taskBadgeText}>{badgeText}</Text>
            </View>
            <View
              style={{
                flexDirection: isArabic ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {showProgressPercent
                    ? `${activeStatusLabel} • ${activeTaskProgress}%`
                    : activeStatusLabel}
                </Text>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  if (!activeTask) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onOpenDetail(activeTask._id);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.openDetailBtn}
              >
                <Ionicons name="open-outline" size={13} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Title, Labels & Crystalloid Ball */}
          <View style={[styles.bodyRow, isArabic && styles.rowRtl]}>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => {
                if (!activeTask) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenDetail(activeTask._id);
              }}
              style={[
                { flex: 1, minWidth: 0 },
                isArabic ? { paddingLeft: 10 } : { paddingRight: 10 },
              ]}
            >
              <Text
                numberOfLines={showSubtasksInCard ? 1 : 2}
                style={[styles.taskTitle, isArabic && { textAlign: 'right' }]}
              >
                {activeTask
                  ? activeTask.text
                  : isArabic
                  ? 'لا توجد مهمة نشطة حالياً'
                  : 'No active task selected'}
              </Text>

              {/* Only display description if user provided one and subtasks are closed */}
              {activeTask?.description && !showSubtasksInCard ? (
                <Text
                  numberOfLines={1}
                  style={[styles.taskDesc, isArabic && { textAlign: 'right' }]}
                >
                  {activeTask.description}
                </Text>
              ) : null}

              {/* Priority and linked goal / project / space labels */}
              <View style={[styles.labelsRow, isArabic && styles.rowRtl]}>
                {/* Priority label */}
                {activeTask?.priority && (
                  <View style={[styles.labelPill, isArabic && styles.rowRtl]}>
                    <Text style={[styles.priorityTextOnly, { color: '#000000' }]}>
                      {getPriorityBadge(activeTask.priority).label}
                    </Text>
                  </View>
                )}

                {/* Linked goal */}
                {goalName && (
                  <View style={[styles.labelPill, isArabic && styles.rowRtl]}>
                    <Ionicons name="flag" size={10} color="#000000" />
                    <Text numberOfLines={1} style={styles.labelText}>
                      {goalName}
                    </Text>
                  </View>
                )}

                {/* Linked project */}
                {projectName && (
                  <View style={[styles.labelPill, isArabic && styles.rowRtl]}>
                    <Ionicons name="folder-outline" size={10} color="#000000" />
                    <Text numberOfLines={1} style={styles.labelText}>
                      {projectName}
                    </Text>
                  </View>
                )}

                {/* Linked space / category */}
                {categoryName && (
                  <View style={[styles.labelPill, isArabic && styles.rowRtl]}>
                    <Ionicons name="grid-outline" size={10} color="#000000" />
                    <Text numberOfLines={1} style={styles.labelText}>
                      {categoryName}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Progress Indicator: Strictly Crystalloid Ball in all states (active, idle, or empty) */}
            <CrystalizedBall
              size={54}
              preset="ember"
              color="#FF6B35"
              isRunning={activeTask?.status === 'in_progress'}
              isCountDown={isCountDown}
              timerLabel={
                activeTask
                  ? hasTimer
                    ? formatTime(timerValue)
                    : activeTaskProgress !== null
                    ? `${activeTaskProgress}%`
                    : ''
                  : ''
              }
              onPress={() => {
                if (!activeTask) {
                  onAddTask?.();
                  return;
                }
                if (activeTask.status === 'in_progress') {
                  handlePauseTaskAction(activeTask);
                } else {
                  handleRunTaskAction(activeTask);
                }
              }}
            />
          </View>

          {/* Subtasks Toggle Button (Shown if task has subtasks) */}
          {activeSubtasks && activeSubtasks.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowSubtasksInCard((prev) => !prev);
              }}
              style={[styles.subtasksToggleBtn, isArabic && styles.rowRtl]}
            >
              <View style={[styles.subtasksToggleLeft, isArabic && styles.rowRtl]}>
                <Ionicons name="list-outline" size={13} color="#000000" />
                <Text style={styles.subtasksToggleText}>
                  {isArabic ? 'المهام الفرعية' : 'Subtasks'}{' '}
                  (
                  {activeSubtasks.filter((s: any) => s.status === 'done').length}/
                  {activeSubtasks.length})
                </Text>
              </View>
              <Ionicons
                name={showSubtasksInCard ? 'chevron-up' : 'chevron-down'}
                size={13}
                color="#000000"
              />
            </TouchableOpacity>
          )}

          {/* Expandable Subtasks Checklist: constrained scroll so it NEVER pushes or overlays buttons */}
          {showSubtasksInCard && activeSubtasks && activeSubtasks.length > 0 && (
            <ScrollView
              style={styles.subtasksScroll}
              contentContainerStyle={styles.subtasksList}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {activeSubtasks.map((sub: any) => {
                const isDone = sub.status === 'done';
                return (
                  <TouchableOpacity
                    key={sub._id}
                    activeOpacity={0.75}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleSubtaskInCard(sub);
                    }}
                    style={[styles.subtaskItem, isArabic && styles.rowRtl]}
                  >
                    <Ionicons
                      name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color="#000000"
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.subtaskItemText,
                        isDone && styles.subtaskItemTextDone,
                        isArabic && { textAlign: 'right' },
                      ]}
                    >
                      {sub.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Zone 3: Footer Actions Row — Pinned strictly at bottom edge with flexShrink: 0 */}
        <View style={[styles.footerRow, isArabic && styles.rowRtl]}>
          {activeTask ? (
            <>
              {/* Complete Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={(e) => {
                  e.stopPropagation();
                  if (!activeTask) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleCompleteTaskAction(activeTask);
                }}
                style={styles.completeBtn}
              >
                <Ionicons name="checkmark" size={14} color="#000000" />
                <Text style={styles.completeBtnText}>
                  {isArabic ? 'إكمال' : 'Complete'}
                </Text>
              </TouchableOpacity>

              {/* Pause / Resume Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={(e) => {
                  e.stopPropagation();
                  if (!activeTask) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (activeTask.status === 'in_progress') {
                    handlePauseTaskAction(activeTask);
                  } else {
                    handleRunTaskAction(activeTask);
                  }
                }}
                style={styles.pauseBtn}
              >
                <Text style={styles.pauseBtnText}>
                  {activeTask.status === 'in_progress'
                    ? isArabic
                      ? 'إيقاف'
                      : 'Pause'
                    : isArabic
                    ? 'تشغيل'
                    : 'Resume'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddTask?.();
              }}
              style={styles.addTaskBtn}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addTaskBtnText}>
                {isArabic ? 'إضافة مهمة' : 'Add a task'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  cardInner: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  upperSection: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexShrink: 0,
  },
  taskBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: 'rgba(0, 0, 0, 0.85)',
    letterSpacing: 0.5,
  },
  statusPill: {
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ff5c16',
  },
  openDetailBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  labelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
  },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    maxWidth: 130,
  },
  labelPillStrong: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  labelText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#000000',
  },
  priorityTextOnly: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  subtasksToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
    marginTop: 2,
  },
  subtasksToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtasksToggleText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#000000',
  },
  subtasksScroll: {
    maxHeight: 62,
    marginBottom: 4,
    flexShrink: 1,
  },
  subtasksList: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    padding: 5,
    gap: 3.5,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subtaskItemText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  subtaskItemTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  taskTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  taskDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.75)',
    marginTop: 2,
    lineHeight: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.12)',
    paddingTop: 8,
    marginTop: 'auto',
    flexShrink: 0,
    zIndex: 10,
  },
  completeBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.4,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
  },
  pauseBtn: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  pauseBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  addTaskBtn: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    width: '100%',
  },
  addTaskBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default ActiveTaskCard;
