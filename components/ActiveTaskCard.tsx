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
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import CrystalizedBall from './CrystalizedBall';
import CardParticleField from './CardParticleField';
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

export const TASK_BG_COLOR = '#AFE607';
export const TASK_TEXT_COLOR = '#0E0E0B';
export const TASK_DARK_VIOLET = TASK_TEXT_COLOR; // Backward-compatible alias
export const TASK_GOLD_ORANGE = TASK_TEXT_COLOR; // Backward-compatible alias

export interface ActiveTaskCardProps {
  task?: TaskItem | null;
  cardColor?: string;
  cardBadgeLabel?: string;
  isArabic?: boolean;
  isFirstTaskPrompt?: boolean;
  isEmptySlot?: boolean;
  onRunTask: (task: TaskItem) => void;
  onPauseTask: (task: TaskItem) => void;
  onCompleteTask: (task: TaskItem) => void;
  onReopenTask?: (task: TaskItem) => void;
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
  cardColor = TASK_BG_COLOR,
  cardBadgeLabel,
  isArabic = false,
  isFirstTaskPrompt = false,
  isEmptySlot = false,
  onRunTask,
  onPauseTask,
  onCompleteTask,
  onReopenTask,
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
  const linkedSubCategory = useOfflineQuery<any>(
    'projects.getSubCategory',
    api.projects.getSubCategory,
    activeTask?.subCategoryId ? { id: activeTask.subCategoryId } : 'skip'
  );

  const goalName = asDoc(linkedGoal)?.text || asDoc(linkedGoal)?.title;
  const projectName = asDoc(linkedProject)?.name;
  const categoryName = asDoc(linkedCategory)?.name;
  const subCategoryName = asDoc(linkedSubCategory)?.name;

  // Progress of the active task
  const [now, setNow] = useState<number>(() => getServerNow());
  useEffect(() => {
    if (activeTask?.status === 'in_progress') {
      const interval = setInterval(() => setNow(getServerNow()), 1000);
      return () => clearInterval(interval);
    }
  }, [activeTask?.status]);

  const isRunningTask = activeTask?.status === 'in_progress';
  const isTaskDone = activeTask?.status === 'done' || activeTask?.status === 'completed';

  const isCountUp = activeTask?.timerDirection === 'up';
  const isCountDown = !isCountUp;
  const hasTimer = Boolean(
    activeTask?.timerDuration ||
      isCountUp ||
      activeTask?.timerStartTime ||
      activeTask?.timeLeftAtPause
  );

  let timerValue = 0;
  let activeTaskProgress: number | null = null;

  if (activeTask) {
    const isRunning = activeTask.status === 'in_progress';
    const duration = activeTask.timerDuration || 0;

    if (isTaskDone) {
      if (isCountUp) {
        timerValue =
          activeTask.timeLeftAtPause ??
          (activeTask.timerStartTime && activeTask.completedAt
            ? Math.max(0, activeTask.completedAt - activeTask.timerStartTime)
            : 0);
        activeTaskProgress = 100;
      } else {
        // Finished countdown keeps timer at 00:00 and fills particles 100%
        timerValue = 0;
        activeTaskProgress = 100;
      }
    } else if (isRunning && activeTask.timerStartTime) {
      const elapsed = Math.max(0, now - activeTask.timerStartTime);
      if (isCountUp) {
        timerValue = elapsed;
        activeTaskProgress = null;
      } else if (duration > 0) {
        timerValue = Math.max(0, duration - elapsed);
        activeTaskProgress =
          timerValue === 0 ? 100 : Math.min(100, Math.round((elapsed / duration) * 100));
      } else {
        timerValue = elapsed;
        activeTaskProgress = null;
      }
    } else if (activeTask.status === 'paused') {
      const pausedVal = activeTask.timeLeftAtPause ?? 0;
      if (isCountUp) {
        timerValue = pausedVal;
        activeTaskProgress = null;
      } else if (duration > 0) {
        timerValue = pausedVal > 0 ? pausedVal : duration;
        const elapsed = Math.max(0, duration - timerValue);
        activeTaskProgress = Math.min(100, Math.round((elapsed / duration) * 100));
      } else {
        timerValue = pausedVal;
        activeTaskProgress = null;
      }
    } else {
      // not_started or not_done
      if (isCountUp) {
        timerValue = 0;
        activeTaskProgress = null;
      } else if (duration > 0) {
        timerValue = duration;
        activeTaskProgress = 0;
      } else {
        timerValue = 0;
        activeTaskProgress = null;
      }
    }
  }

  // Status badge label and completion percent
  const activeStatusLabel = useMemo(() => {
    if (!activeTask) return isArabic ? 'لا توجد مهام' : 'Idle';
    if (isTaskDone) return isArabic ? 'مكتملة' : 'Completed';
    if (activeTask.status === 'in_progress') return isArabic ? 'قيد التنفيذ' : 'In Progress';
    if (activeTask.status === 'paused') return isArabic ? 'متوقفة مؤقتاً' : 'Paused';
    return isArabic ? 'جاهزة' : 'To Do';
  }, [activeTask, isTaskDone, isArabic]);

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

  const handleReopenTaskAction = (targetTask: TaskItem) => {
    selectTask?.(targetTask);
    if (onReopenTask) {
      onReopenTask(targetTask);
    } else {
      updateTodo({ id: targetTask._id, status: 'not_started' });
    }
  };

  const badgeText = cardBadgeLabel || (isArabic ? 'المهمة النشطة' : 'Active Task');

  if (isEmptySlot) {
    const guides = [
      {
        badge: isArabic ? 'خطوة ٢' : 'Step 2',
        title: isArabic ? 'قسّم مهامك الكبيرة' : 'Break down big goals',
        desc: isArabic
          ? 'أضف مهام فرعية وحدد وقت تركيز لكل جزء'
          : 'Add subtasks and pick countdown or stopwatch focus time',
        icon: 'layers-outline' as const,
      },
      {
        badge: isArabic ? 'خطوة ٣' : 'Step 3',
        title: isArabic ? 'رتّب أولوياتك' : 'Prioritize your flow',
        desc: isArabic
          ? 'عيّن أولوية لكل مهمة واربطها بمشروع أو مجال'
          : 'Assign high priority and connect tasks to projects',
        icon: 'ribbon-outline' as const,
      },
      {
        badge: isArabic ? 'خطوة ٤' : 'Step 4',
        title: isArabic ? 'حافظ على استمراريتك' : 'Build your streak',
        desc: isArabic
          ? 'أكمل مهامك اليومية وشاهد تقدمك ينمو'
          : 'Finish daily tasks to keep momentum and hit your goals',
        icon: 'trophy-outline' as const,
      },
    ];

    const guide = guides[(cardIndex - 1) % guides.length] || guides[0];

    return (
      <View style={[styles.card, { backgroundColor: cardColor }, style]}>
        {/* Subtle noise/granules texture matching upper widget - no gradient */}
        <Image
          source={require('@/assets/images/grain.png')}
          resizeMode="repeat"
          style={[StyleSheet.absoluteFill, { opacity: 0.16 }]}
        />
        <View style={styles.cardInner}>
          <View style={styles.upperSection}>
            <View style={[styles.headerRow, isArabic && styles.rowRtl]}>
              <View style={styles.taskBadge}>
                <Text style={styles.taskBadgeText}>{guide.badge}</Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: 'rgba(14, 14, 11, 0.12)' },
                ]}
              >
                <Text style={[styles.statusPillText, { color: TASK_TEXT_COLOR }]}>
                  {isArabic ? 'دليل' : 'Tip'}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              <View
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  },
                  isArabic && styles.rowRtl,
                ]}
              >
                <Ionicons name={guide.icon} size={18} color={TASK_TEXT_COLOR} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.taskTitle,
                    { fontSize: 17, lineHeight: 22 },
                    isArabic && { textAlign: 'right' },
                  ]}
                >
                  {guide.title}
                </Text>
              </View>
              <Text
                style={[
                  styles.taskDesc,
                  { fontSize: 12, opacity: 0.82 },
                  isArabic && { textAlign: 'right' },
                ]}
              >
                {guide.desc}
              </Text>
            </View>
          </View>

          <View style={[styles.footerRow, isArabic && styles.rowRtl]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddTask?.();
              }}
              style={[
                styles.addTaskBtn,
                { width: '100%', justifyContent: 'center' },
              ]}
            >
              <Ionicons name="add-circle" size={17} color={TASK_BG_COLOR} />
              <Text style={styles.addTaskBtnText}>
                {isArabic ? 'إضافة مهمة جديدة' : 'Add Next Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (isFirstTaskPrompt || (!activeTask && cardIndex === 0)) {
    return (
      <View style={[styles.card, { backgroundColor: cardColor }, style]}>
        {/* Subtle noise/granules texture matching upper widget - no gradient */}
        <Image
          source={require('@/assets/images/grain.png')}
          resizeMode="repeat"
          style={[StyleSheet.absoluteFill, { opacity: 0.16 }]}
        />
        <View style={styles.cardInner}>
          <View style={styles.upperSection}>
            <View style={[styles.headerRow, isArabic && styles.rowRtl]}>
              <View style={styles.taskBadge}>
                <Text style={styles.taskBadgeText}>
                  {isArabic ? 'ابدأ يومك' : 'Start Your Day'}
                </Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {isArabic ? 'جاهز' : 'Ready'}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text
                style={[
                  styles.taskTitle,
                  { fontSize: 20, lineHeight: 26 },
                  isArabic && { textAlign: 'right' },
                ]}
              >
                {isArabic
                  ? 'أنشئ أول مهمة لك اليوم 🚀'
                  : 'Create your first task for today 🚀'}
              </Text>
              <Text
                style={[
                  styles.taskDesc,
                  { marginTop: 6, fontSize: 13, opacity: 0.8 },
                  isArabic && { textAlign: 'right' },
                ]}
              >
                {isArabic
                  ? 'حدد هدفك الحالي وركز في إنجازه خطوة بخطوة'
                  : 'Set your focus, choose a timer, and get things done step by step.'}
              </Text>
            </View>
          </View>

          <View style={[styles.footerRow, isArabic && styles.rowRtl]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddTask?.();
              }}
              style={[
                styles.addTaskBtn,
                { width: '100%', justifyContent: 'center' },
              ]}
            >
              <Ionicons name="add-circle" size={18} color={TASK_BG_COLOR} />
              <Text style={styles.addTaskBtnText}>
                {isArabic ? 'إضافة أول مهمة' : 'Create First Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: cardColor }, style]}>
      {/* Background Color Fill - Solid, No Gradient */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: cardColor },
        ]}
      />

      {/* Subtle noise/granules texture matching upper widget */}
      <Image
        source={require('@/assets/images/grain.png')}
        resizeMode="repeat"
        style={[StyleSheet.absoluteFill, { opacity: 0.16 }]}
      />

      {/* Whole-card crystal dust particle field (filling from bottom to top as countdown progresses) */}
      <CardParticleField
        progress={activeTaskProgress !== null ? activeTaskProgress / 100 : 0}
        isRunning={isRunningTask}
        isCountDown={isCountDown}
      />

      {/* Main Content Layout with Upper Content + Pinned Bottom Actions */}
      <View style={styles.cardInner}>
        {/* Upper Part: Header Row + Task Title + Crystalloid Ball Timer + Labels + Subtasks */}
        <View style={styles.upperSection}>
          {/* Header Row (Badge + Status + Open Button) */}
          <View style={[styles.headerRow, isArabic && styles.rowRtl]}>
            <View
              style={[
                styles.taskBadge,
                isTaskDone && styles.taskBadgeDone,
                isArabic && styles.rowRtl,
              ]}
            >
              {isTaskDone && (
                <Ionicons
                  name="checkmark-done"
                  size={11}
                  color="#AFE607"
                  style={{ flexShrink: 0 }}
                />
              )}
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.taskBadgeText, isTaskDone && styles.taskBadgeTextDone]}
              >
                {isTaskDone ? (isArabic ? 'منتهية' : 'Finished') : badgeText}
              </Text>
            </View>
            <View
              style={{
                flexDirection: isArabic ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              <View
                style={[
                  styles.statusPill,
                  isTaskDone && styles.statusPillDone,
                  isArabic && styles.rowRtl,
                ]}
              >
                {isTaskDone && (
                  <Ionicons
                    name="checkmark-circle"
                    size={11}
                    color="#4ADE80"
                    style={{ flexShrink: 0 }}
                  />
                )}
                <Text numberOfLines={1} style={styles.statusPillText}>
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
                <Ionicons name="open-outline" size={13} color={TASK_TEXT_COLOR} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Title & Crystallized Ball Timer */}
          <View style={[styles.bodyRow, isArabic && styles.rowRtl]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => {
                  if (!activeTask) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onOpenDetail(activeTask._id);
                }}
                style={[
                  { width: '100%', overflow: 'hidden' },
                  isArabic ? { paddingLeft: 6 } : { paddingRight: 6 },
                ]}
              >
                <Text
                  numberOfLines={showSubtasksInCard ? 1 : 2}
                  ellipsizeMode="tail"
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
                    ellipsizeMode="tail"
                    style={[styles.taskDesc, isArabic && { textAlign: 'right' }]}
                  >
                    {activeTask.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            </View>

            {/* Crystallized Ball Timer in natural corner position */}
            <View style={{ justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
              <CrystalizedBall
                size={54}
                preset="plasma"
                color="#C084FC"
                isRunning={activeTask?.status === 'in_progress'}
                isCompleted={isTaskDone}
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
                  if (isTaskDone) {
                    onOpenDetail(activeTask._id);
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
          </View>

          {/* Priority and linked goal / project / space labels (full card width, cleanly wrapped) */}
          {(activeTask?.priority || goalName || projectName || subCategoryName || categoryName) && (
            <View style={[styles.labelsRow, isArabic && styles.rowRtl]}>
              {/* Priority label */}
              {activeTask?.priority && (
                <View style={[styles.labelPill, isArabic && styles.rowRtl]}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.priorityTextOnly, { color: TASK_TEXT_COLOR }]}
                  >
                    {getPriorityBadge(activeTask.priority).label}
                  </Text>
                </View>
              )}

              {/* Linked goal */}
              {goalName && (
                <View style={[styles.labelPill, isArabic && styles.rowRtl]}>
                  <Ionicons
                    name="flag"
                    size={10}
                    color={TASK_TEXT_COLOR}
                    style={{ flexShrink: 0 }}
                  />
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.labelText}
                  >
                    {goalName}
                  </Text>
                </View>
              )}

              {/* Linked project */}
              {projectName && (
                <View style={[styles.labelPill, isArabic && styles.rowRtl]}>
                  <Ionicons
                    name="folder-outline"
                    size={10}
                    color={TASK_TEXT_COLOR}
                    style={{ flexShrink: 0 }}
                  />
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.labelText}
                  >
                    {projectName}
                  </Text>
                </View>
              )}

              {/* Linked sub-category */}
              {subCategoryName && subCategoryName !== projectName && (
                <View style={[styles.labelPill, isArabic && styles.rowRtl]}>
                  <Ionicons
                    name="layers-outline"
                    size={10}
                    color={TASK_TEXT_COLOR}
                    style={{ flexShrink: 0 }}
                  />
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.labelText}
                  >
                    {subCategoryName}
                  </Text>
                </View>
              )}

              {/* Linked space / category */}
              {categoryName && (
                <View style={[styles.labelPill, isArabic && styles.rowRtl]}>
                  <Ionicons
                    name="grid-outline"
                    size={10}
                    color={TASK_TEXT_COLOR}
                    style={{ flexShrink: 0 }}
                  />
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.labelText}
                  >
                    {categoryName}
                  </Text>
                </View>
              )}
            </View>
          )}

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
                <Ionicons name="list-outline" size={13} color={TASK_TEXT_COLOR} />
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
                color={TASK_TEXT_COLOR}
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
                      color={TASK_TEXT_COLOR}
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
            isTaskDone ? (
              <>
                <View style={[styles.doneBannerPill, isArabic && styles.rowRtl]}>
                  <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                  <Text numberOfLines={1} style={styles.doneBannerText}>
                    {isArabic ? 'تم إنجاز المهمة' : 'Task Finished'}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (!activeTask) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleReopenTaskAction(activeTask);
                  }}
                  style={[styles.completeBtn, isArabic && styles.rowRtl]}
                >
                  <Ionicons name="refresh" size={13} color={TASK_TEXT_COLOR} />
                  <Text style={styles.completeBtnText}>
                    {isArabic ? 'إعادة فتح' : 'Reopen'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
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
                  style={[styles.completeBtn, isArabic && styles.rowRtl]}
                >
                  <Ionicons name="checkmark" size={14} color={TASK_TEXT_COLOR} />
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
                      : activeTask.status === 'paused'
                      ? isArabic
                        ? 'استئناف'
                        : 'Resume'
                      : isArabic
                      ? 'بدء'
                      : 'Start'}
                  </Text>
                </TouchableOpacity>
              </>
            )
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
              <Ionicons name="add" size={16} color={TASK_BG_COLOR} />
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
    borderWidth: 1.2,
    borderColor: 'rgba(14, 14, 11, 0.18)',
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
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
    flexShrink: 0,
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 1,
    overflow: 'hidden',
  },
  taskBadgeDone: {
    backgroundColor: TASK_TEXT_COLOR,
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: 'rgba(14, 14, 11, 0.85)',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  taskBadgeTextDone: {
    color: '#AFE607',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TASK_TEXT_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusPillDone: {
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.45)',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#AFE607',
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
    marginBottom: 4,
    gap: 8,
  },
  labelsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 4,
    overflow: 'hidden',
  },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(14, 14, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    maxWidth: 155,
    flexShrink: 1,
    overflow: 'hidden',
  },
  labelPillStrong: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  labelText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: TASK_TEXT_COLOR,
    flexShrink: 1,
    minWidth: 0,
  },
  priorityTextOnly: {
    fontSize: 9.5,
    fontWeight: '900',
    flexShrink: 1,
    minWidth: 0,
  },
  subtasksToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(14, 14, 11, 0.10)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
    marginTop: 2,
    flexShrink: 0,
  },
  subtasksToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  subtasksToggleText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: TASK_TEXT_COLOR,
    flexShrink: 1,
  },
  subtasksScroll: {
    maxHeight: 62,
    marginBottom: 4,
    flexShrink: 1,
  },
  subtasksList: {
    backgroundColor: 'rgba(14, 14, 11, 0.08)',
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
    overflow: 'hidden',
  },
  subtaskItemText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: TASK_TEXT_COLOR,
    flex: 1,
    minWidth: 0,
  },
  subtaskItemTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  taskTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: TASK_TEXT_COLOR,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  taskDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(14, 14, 11, 0.75)',
    marginTop: 2,
    lineHeight: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(14, 14, 11, 0.12)',
    paddingTop: 8,
    marginTop: 'auto',
    flexShrink: 0,
    zIndex: 10,
  },
  completeBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.4,
    borderColor: TASK_TEXT_COLOR,
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
    color: TASK_TEXT_COLOR,
  },
  pauseBtn: {
    backgroundColor: TASK_TEXT_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  pauseBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: TASK_BG_COLOR,
  },
  doneBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TASK_TEXT_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    flexShrink: 1,
    overflow: 'hidden',
  },
  doneBannerText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#AFE607',
    flexShrink: 1,
  },
  addTaskBtn: {
    backgroundColor: TASK_TEXT_COLOR,
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
    color: TASK_BG_COLOR,
  },
});

export default ActiveTaskCard;
