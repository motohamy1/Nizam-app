import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import CircularProgress from './CircularProgress';
import PixelTrail from './PixelTrail';
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
  isArabic?: boolean;
  onRunTask: (task: TaskItem) => void;
  onPauseTask: (task: TaskItem) => void;
  onCompleteTask: (task: TaskItem) => void;
  onOpenDetail: (id: any, section?: 'subtask') => void;
  /** Offered when there is no active task yet, so the card never shows a
   *  button that does nothing. */
  onAddTask?: () => void;
  /** Extra styles, used when the card sits in the stack. */
  style?: StyleProp<ViewStyle>;
}

/**
 * The Active Task card — the first card of the home page stack.
 *
 * It shows the task the user is working on right now: its title, the live
 * timer, the real progress, its subtasks and the run / complete controls.
 * Tapping the card opens the task detail.
 *
 * The card used to be the front sheet of the overlapping task stack at the
 * bottom of the page; it now lives at the top of the card stack, so it is the
 * first thing the user meets when the page opens.
 */
export const ActiveTaskCard: React.FC<ActiveTaskCardProps> = React.memo(({
  task,
  isArabic = false,
  onRunTask,
  onPauseTask,
  onCompleteTask,
  onOpenDetail,
  onAddTask,
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
    activeTask ? { parentId: activeTask._id } : 'skip'
  );

  // Subtasks toggle in the card (closed as default)
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

  const goalDoc = asDoc(linkedGoal);
  const projectDoc = asDoc(linkedProject);
  const categoryDoc = asDoc(linkedCategory);
  const goalName = goalDoc?.text || goalDoc?.title || null;
  const projectName = projectDoc?.name || null;
  const categoryName = categoryDoc?.name || null;

  // ─── Live timer for the active task ───
  // One ticking clock drives the timer; every displayed value is derived from
  // it, so the card never renders a stale number.
  // `timerValue` is whatever the clock should display:
  //   count-down → milliseconds REMAINING
  //   count-up   → milliseconds ELAPSED
  // A count-up timer has no duration at all (it is a stopwatch), so it must be
  // detected through `timerDirection`, never through `timerDuration`.
  const [clock, setClock] = useState(() => getServerNow());

  useEffect(() => {
    const id = setInterval(() => setClock(getServerNow()), 1000);
    return () => clearInterval(id);
  }, []);

  const isCountUp = activeTask?.timerDirection === 'up';
  const countDownDuration =
    activeTask?.timerDuration && activeTask.timerDuration > 0 ? activeTask.timerDuration : null;
  const hasTimer = isCountUp || countDownDuration !== null;

  const timerValue = useMemo(() => {
    if (!activeTask) return 0;
    const direction = activeTask.timerDirection;
    if (activeTask.status === 'in_progress' && activeTask.timerStartTime) {
      const elapsed = Math.max(0, clock - activeTask.timerStartTime);
      return direction === 'up'
        ? elapsed
        : Math.max(0, (activeTask.timerDuration || 0) - elapsed);
    }
    if (activeTask.status === 'paused' && activeTask.timeLeftAtPause !== undefined) {
      // Count-up stores elapsed time, count-down stores remaining time.
      return activeTask.timeLeftAtPause;
    }
    // Never started.
    return direction === 'up' ? 0 : activeTask.timerDuration || 0;
  }, [activeTask, clock]);

  // Determinable progress for the card:
  //   count-down timer → how much of the budget is already burnt
  //   otherwise       → how many subtasks are finished
  // `null` means "there is nothing to fill a progress bar with" (e.g. a
  // count-up stopwatch), so the bar is hidden instead of showing a fake %.
  const isCountDown = !isCountUp && countDownDuration !== null;
  const progressRatio = useMemo(() => {
    if (!activeTask) return 0;
    if (activeTask.status === 'done') return 1;
    if (isCountDown && countDownDuration && countDownDuration > 0) {
      const elapsed = Math.max(0, countDownDuration - timerValue);
      return Math.min(1, Math.max(0, elapsed / countDownDuration));
    }
    if (isCountUp && timerValue > 0) {
      // 25-minute standard focus block progression for count-up stopwatch
      const standardSessionMs = 25 * 60 * 1000;
      return Math.min(1, timerValue / standardSessionMs);
    }
    return 0;
  }, [activeTask, isCountDown, isCountUp, countDownDuration, timerValue]);

  const activeTaskProgress = useMemo<number | null>(() => {
    if (!activeTask) return null;
    if (activeTask.status === 'done') return 100;

    if (countDownDuration) {
      const elapsed = Math.max(0, countDownDuration - timerValue);
      return Math.min(100, Math.max(0, Math.round((elapsed / countDownDuration) * 100)));
    }

    if (activeSubtasks && activeSubtasks.length > 0) {
      const doneSub = activeSubtasks.filter((s: any) => s.status === 'done').length;
      return Math.round((doneSub / activeSubtasks.length) * 100);
    }

    return null;
  }, [activeTask, activeSubtasks, timerValue, countDownDuration]);

  const activeStatusLabel = activeTask
    ? activeTask.status === 'in_progress'
      ? isArabic
        ? 'قيد التشغيل'
        : 'Running'
      : activeTask.status === 'paused'
      ? isArabic
        ? 'متوقف مؤقتاً'
        : 'Paused'
      : activeTask.status === 'done'
      ? isArabic
        ? 'مكتمل'
        : 'Done'
      : isArabic
      ? 'جاهز'
      : 'Ready'
    : isArabic
    ? 'لا يوجد مهام'
    : 'Idle';

  // The percentage is only meaningful once the task actually moved — a task
  // that has not started reads "Ready", not "Ready • 0%".
  const showProgressPercent =
    activeTaskProgress !== null &&
    (activeTaskProgress > 0 ||
      activeTask?.status === 'in_progress' ||
      activeTask?.status === 'paused' ||
      activeTask?.status === 'done');

  // Priority badge styling (text-only semantic colors, no background fill or borders)
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'Urgent':
        return {
          text: '#ff80ab',
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

  return (
    <View style={[styles.card, style]}>
      {/* Solid dark orange background matching the Today tasks card and electric orange theme */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#e63e00' },
        ]}
      />

      {/* Dynamic PixelTrail (React Bits): syncs timer progress in count-down, height & gravity drops in count-up, freezes on pause */}
      <PixelTrail
        gridSize={24}
        trailSize={0.15}
        maxAge={500}
        color="#e63e00"
        trailColor="#f24f13"
        shape="square"
        gap={0.1}
        decay="fade"
        gravity={0.6}
        sparkle={0.6}
        shine={0.8}
        glow={0.5}
        status={activeTask ? activeTask.status : 'idle'}
        mode={isCountDown ? 'count_down' : 'count_up'}
        progress={progressRatio}
        isArabic={isArabic}
      />

      {/* Interactive Card Content Container. The body takes the free space so
          the actions stay on the bottom edge of the card. */}
      <View style={{ zIndex: 2, flex: 1 }}>
        <View style={{ flex: 1 }}>
        {/* Header Row: Active Task Badge + Status Pill + Open Detail Button */}
        <View style={[styles.headerRow, isArabic && styles.rowRtl]}>
          <View style={styles.taskBadge}>
            <Text style={styles.taskBadgeText}>
              {isArabic ? 'المهمة النشطة' : 'Active Task'}
            </Text>
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

        {/* Task Title, Description, Status/Link Labels, & Circular Progress Timer Row */}
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
              numberOfLines={2}
              style={[styles.taskTitle, isArabic && { textAlign: 'right' }]}
            >
              {activeTask
                ? activeTask.text
                : isArabic
                ? 'لا توجد مهمة نشطة حالياً'
                : 'No active task selected'}
            </Text>

            {/* Only display description if user provided one — useless placeholder removed */}
            {activeTask?.description ? (
              <Text
                numberOfLines={2}
                style={[styles.taskDesc, isArabic && { textAlign: 'right' }]}
              >
                {activeTask.description}
              </Text>
            ) : null}

            {/* Timer mode, priority and linked goal / project / space labels */}
            <View style={[styles.labelsRow, isArabic && styles.rowRtl]}>
              {/* Timer mode */}
              {hasTimer && (
                <View style={[styles.labelPill, isArabic && styles.rowRtl]}>
                  <Ionicons
                    name={isCountUp ? 'hourglass-outline' : 'timer-outline'}
                    size={10}
                    color="#000000"
                  />
                  <Text numberOfLines={1} style={styles.labelText}>
                    {isCountUp
                      ? isArabic
                        ? 'تصاعدي'
                        : 'Count up'
                      : isArabic
                      ? 'تنازلي'
                      : 'Count down'}
                  </Text>
                </View>
              )}

              {/* Priority: text only with colored font, no background fill, no border, no icon */}
              {activeTask?.priority && (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.priorityTextOnly,
                    { color: getPriorityBadge(activeTask.priority).text },
                  ]}
                >
                  {getPriorityBadge(activeTask.priority).label}
                </Text>
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

          {/* Rounded Progress Timer (Interactive Tap to Run/Pause) */}
          {activeTask && (
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (activeTask.status === 'in_progress') {
                  handlePauseTaskAction(activeTask);
                } else {
                  handleRunTaskAction(activeTask);
                }
              }}
              style={styles.circularTimerWrapper}
            >
              <CircularProgress
                size={52}
                strokeWidth={4.5}
                progress={activeTaskProgress ?? 0}
                color="#000000"
                unfilledColor="rgba(0, 0, 0, 0.16)"
              >
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Text
                    style={[
                      styles.circularTimeNumber,
                      hasTimer && styles.circularTimerValue,
                    ]}
                    numberOfLines={1}
                  >
                    {hasTimer
                      ? formatTime(timerValue)
                      : activeTaskProgress !== null
                      ? `${activeTaskProgress}%`
                      : ''}
                  </Text>
                  <Ionicons
                    name={activeTask.status === 'in_progress' ? 'pause' : 'play'}
                    size={9}
                    color="rgba(0, 0, 0, 0.85)"
                    style={{ marginTop: 1 }}
                  />
                </View>
              </CircularProgress>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal progress bar — only rendered when the progress is real.
            A count-up stopwatch has no end state, so it gets no bar at all
            instead of a fabricated percentage. */}
        {activeTaskProgress !== null && (
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBarFill, { width: `${activeTaskProgress}%` }]}
            />
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

        {/* Expandable Subtasks Checklist (Closed as default) */}
        {showSubtasksInCard && activeSubtasks && activeSubtasks.length > 0 && (
          <View style={styles.subtasksList}>
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
                    size={17}
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
          </View>
        )}

        {/* Actions Row — Complete on the start edge, Pause/Resume on the end edge.
            With no active task the run controls would be dead, so the card
            offers the one action that is actually available. */}
        </View>
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
            /* No active task: one working action instead of two dead ones. */
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
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    backgroundColor: '#e63e00',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    // Light surface with a black glyph: a black icon on a dark translucent
    // circle disappeared against the orange.
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  circularTimerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  circularTimeNumber: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.3,
  },
  circularTimerValue: {
    fontSize: 11,
    letterSpacing: -0.5,
  },
  labelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    maxWidth: 140,
  },
  // Light surface so a semantic colour (priority) stays readable on orange.
  labelPillStrong: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  labelText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#000000',
  },
  subtasksToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
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
  subtasksList: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    padding: 8,
    gap: 5,
    marginBottom: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  subtaskItemText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  subtaskItemTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  taskDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.75)',
    marginTop: 2,
    lineHeight: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.12)',
    paddingTop: 10,
  },
  completeBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.4,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  pauseBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.4,
    borderColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  pauseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  priorityTextOnly: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignSelf: 'center',
  },
  addTaskBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#000000',
    paddingVertical: 9,
    borderRadius: 14,
  },
  addTaskBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default React.memo(ActiveTaskCard);
