import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { Id } from '@/convex/_generated/dataModel';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { api } from '@/convex/_generated/api';
import { getServerNow } from '@/utils/offlineStorage';
import { LinearGradient } from 'expo-linear-gradient';
import CircularProgress from './CircularProgress';
import TaskWaveEffect from './TaskWaveEffect';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface TaskItem {
  _id: Id<'todos'>;
  text: string;
  status: string;
  priority?: string;
  dueDate?: number;
  timerDuration?: number;
  timerDirection?: string;
  timerStartTime?: number;
  timeLeftAtPause?: number;
  projectId?: string;
  description?: string;
  hashtags?: string[];
  [key: string]: any;
}

interface StackedTaskModalsProps {
  tasks: TaskItem[];
  isArabic?: boolean;
  now: number;
  onRunTask: (task: TaskItem) => void;
  onPauseTask: (task: TaskItem) => void;
  onCompleteTask: (task: TaskItem) => void;
  onReopenTask: (task: TaskItem) => void;
  onOpenDetail: (id: Id<'todos'>, section?: 'subtask') => void;
  onAddTask: () => void;
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

const formatDuration = (ms: number) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const StackedTaskModals: React.FC<StackedTaskModalsProps> = ({
  tasks,
  isArabic = false,
  now,
  onRunTask,
  onPauseTask,
  onCompleteTask,
  onReopenTask,
  onOpenDetail,
  onAddTask,
}) => {
  const { colors, isDarkMode } = useTheme();

  // Modals visibility state for center pop-ups
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isActiveTaskModalOpen, setIsActiveTaskModalOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');

  const doneCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks]);
  const pendingCount = tasks.length - doneCount;

  // User or system selected active task ID to keep task pinned when paused
  const [selectedTaskId, setSelectedTaskId] = useState<Id<'todos'> | null>(null);

  // Identify the currently active task
  const activeTask = useMemo(() => {
    // 1. Look for in_progress task (always prioritized if running)
    const inProg = tasks.find((t) => t.status === 'in_progress');
    if (inProg) return inProg;

    // 2. If user had a selected/current task that is still in tasks and not done, stay pinned on it!
    if (selectedTaskId) {
      const selected = tasks.find((t) => t._id === selectedTaskId);
      if (selected && selected.status !== 'done') {
        return selected;
      }
    }

    // 3. Fallback: look for any paused task
    const paused = tasks.find((t) => t.status === 'paused');
    if (paused) return paused;

    // 4. Fallback to first incomplete task
    const notDone = tasks.find((t) => t.status !== 'done');
    if (notDone) return notDone;

    // 5. Fallback to first task if all are done, or null
    return tasks[0] || null;
  }, [tasks, selectedTaskId]);

  // Keep selectedTaskId in sync with activeTask so it stays pinned across pause/resume
  useEffect(() => {
    if (activeTask && selectedTaskId !== activeTask._id) {
      setSelectedTaskId(activeTask._id);
    }
  }, [activeTask?._id]);

  // Helper handlers to guarantee selectedTaskId stays pinned
  const handleRunTaskAction = (task: TaskItem) => {
    setSelectedTaskId(task._id);
    onRunTask(task);
  };

  const handlePauseTaskAction = (task: TaskItem) => {
    setSelectedTaskId(task._id);
    onPauseTask(task);
  };

  const handleCompleteTaskAction = (task: TaskItem) => {
    const nextIncomplete = tasks.find(
      (t) => t._id !== task._id && t.status !== 'done'
    );
    setSelectedTaskId(nextIncomplete ? nextIncomplete._id : null);
    onCompleteTask(task);
  };

  // Subtasks for active task if present
  const activeSubtasks = useOfflineQuery<any[]>(
    'todos.getSubtasks',
    api.todos.getSubtasks,
    activeTask ? { parentId: activeTask._id } : 'skip'
  );

  // Subtasks toggle in active card (closed as default)
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

  // Linked Goal and Project/Category for active task
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

  // Live Timer for active task
  const [timeLeft, setTimeLeft] = useState(activeTask?.timerDuration || 0);

  useEffect(() => {
    let interval: any;
    if (activeTask && activeTask.status === 'in_progress' && activeTask.timerStartTime) {
      const tick = () => {
        const elapsed = Math.max(0, getServerNow() - activeTask.timerStartTime!);
        if (activeTask.timerDirection === 'up') {
          setTimeLeft(elapsed);
        } else if (activeTask.timerDuration) {
          setTimeLeft(Math.max(0, activeTask.timerDuration - elapsed));
        }
      };
      tick();
      interval = setInterval(tick, 1000);
    } else if (activeTask && activeTask.status === 'paused' && activeTask.timeLeftAtPause !== undefined) {
      setTimeLeft(activeTask.timeLeftAtPause);
    } else if (activeTask) {
      setTimeLeft(activeTask.timerDuration || 0);
    }
    return () => clearInterval(interval);
  }, [
    activeTask?._id,
    activeTask?.status,
    activeTask?.timerStartTime,
    activeTask?.timerDuration,
    activeTask?.timeLeftAtPause,
    activeTask?.timerDirection,
  ]);

  // Progress percentage for active task
  const activeTaskProgress = useMemo(() => {
    if (!activeTask) return 0;
    if (activeTask.status === 'done') return 100;

    // Subtasks progress if available
    if (activeSubtasks && activeSubtasks.length > 0) {
      const doneSub = activeSubtasks.filter((s: any) => s.status === 'done').length;
      return Math.round((doneSub / activeSubtasks.length) * 100);
    }

    // Timer duration progress if timer is set
    if (activeTask.timerDuration && activeTask.timerDuration > 0) {
      const elapsed = Math.max(0, activeTask.timerDuration - timeLeft);
      return Math.min(100, Math.max(0, Math.round((elapsed / activeTask.timerDuration) * 100)));
    }

    if (activeTask.status === 'in_progress') return 60;
    if (activeTask.status === 'paused') return 35;
    return 10;
  }, [activeTask, activeSubtasks, timeLeft]);

  // Priority badge styling
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'Urgent':
        return { bg: 'rgba(232, 62, 140, 0.20)', text: '#f1498b', border: 'rgba(232, 62, 140, 0.40)', label: isArabic ? 'عاجل' : 'Urgent' };
      case 'High':
        return { bg: 'rgba(251, 191, 36, 0.20)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.40)', label: isArabic ? 'مرتفع' : 'High' };
      case 'Medium':
        return { bg: 'rgba(16, 185, 129, 0.20)', text: '#10b981', border: 'rgba(16, 185, 129, 0.40)', label: isArabic ? 'متوسط' : 'Medium' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.10)', text: '#a1a1aa', border: 'rgba(255, 255, 255, 0.20)', label: isArabic ? 'عادي' : 'Low' };
    }
  };

  // Filtered tasks for the maximized tasks modal
  const filteredTasks = useMemo(() => {
    switch (taskFilter) {
      case 'todo':
        return tasks.filter((t) => t.status === 'not_started');
      case 'in_progress':
        return tasks.filter((t) => t.status === 'in_progress' || t.status === 'paused');
      case 'done':
        return tasks.filter((t) => t.status === 'done');
      default:
        return tasks;
    }
  }, [tasks, taskFilter]);

  return (
    <View style={styles.deckContainer}>
      {/* ─────────────────────────────────────────────────────────────
          STATIC TWO-LAYER OVERLAPPING MODAL STACK
          1. Back Card (Top): Today's Tasks Modal Card
          2. Front Card (Bottom): Active Task Modal Card
         ───────────────────────────────────────────────────────────── */}
      <View style={styles.stackWrapper}>
        {/* CARD 1: TODAY'S TASKS MODAL CARD (Peek Header Strip) */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsTasksModalOpen(true);
          }}
          style={[styles.backCard, styles.backCardTasks]}
        >
          <View style={[styles.peekHeader, isArabic && styles.rowRtl]}>
            <View style={[styles.peekHeaderLeft, isArabic && styles.rowRtl]}>
              <View style={styles.peekIconBadgeTasks}>
                <Ionicons name="checkbox-outline" size={20} color="#ffb09c" />
              </View>
              <View style={[{ minWidth: 0, flexShrink: 1 }, isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                <Text style={styles.peekTitleTasks} numberOfLines={1}>
                  {isArabic ? 'لوحة المهام' : "Today's Tasks"}
                </Text>
                <Text style={styles.peekSubtitleTasks} numberOfLines={1}>
                  {tasks.length === 0
                    ? (isArabic ? 'لا توجد مهام اليوم' : 'No tasks today')
                    : (isArabic ? `${pendingCount} متبقية • اضغط لفتح القائمة` : `${pendingCount} pending • Tap to open`)}
                </Text>
              </View>
            </View>

            <View style={[styles.peekHeaderRight, isArabic && styles.rowRtl]}>
              <View style={isArabic ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }}>
                <Text style={styles.peekMetricTasks}>
                  {tasks.length === 0 ? '0' : `${doneCount}/${tasks.length}`}
                </Text>
                <Text style={styles.peekMetricLabelTasks}>
                  {isArabic ? 'مكتمل' : 'DONE'}
                </Text>
              </View>
              <View style={styles.expandMiniBtnTasks}>
                <Ionicons
                  name="expand-outline"
                  size={13}
                  color="#ffb09c"
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* CARD 2: ACTIVE TASK MODAL CARD (Overlapping Foreground Card with Live Wavy Sea Effect) */}
        <TouchableOpacity
          activeOpacity={0.94}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsActiveTaskModalOpen(true);
          }}
          style={[styles.frontCard, styles.frontCardActive]}
        >
          {/* Base gradient background matching the electric orange theme */}
          <LinearGradient
            colors={['#ff6720', '#ff4200']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Live Wavy Sea Effect: angled flow when running, waiting pulse when paused */}
          <TaskWaveEffect status={activeTask ? activeTask.status : 'idle'} />

          {/* Interactive Card Content Container */}
          <View style={{ zIndex: 2 }}>
            {/* Drag Handle */}
            <View style={styles.activeDragHandle} />

            {/* Header Row: Active Task Badge + Status Pill + Expand Mini Button */}
            <View style={[styles.activeHeaderRow, isArabic && styles.rowRtl]}>
              <View style={styles.activeTaskBadge}>
                <Text style={styles.activeTaskBadgeText}>
                  {isArabic ? 'المهمة النشطة' : 'Active Task'}
                </Text>
              </View>
              <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.activeStatusPill}>
                  <Text style={styles.activeStatusPillText}>
                    {activeTask
                      ? activeTask.status === 'in_progress'
                        ? `${isArabic ? 'قيد التشغيل' : 'Running'} • ${activeTaskProgress}%`
                        : activeTask.status === 'paused'
                        ? isArabic
                          ? 'متوقف مؤقتاً'
                          : 'Paused'
                        : isArabic
                        ? 'جاهز'
                        : 'Ready'
                      : isArabic
                      ? 'لا يوجد مهام'
                      : 'Idle'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsActiveTaskModalOpen(true);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.expandMiniBtnActive}
                >
                  <Ionicons name="expand-outline" size={13} color="#000000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Task Title, Description, Goal/Project Labels, & Circular Progress Timer Row */}
            <View style={[styles.activeBodyRow, isArabic && styles.rowRtl]}>
              <View style={[{ flex: 1, minWidth: 0 }, isArabic ? { paddingLeft: 10 } : { paddingRight: 10 }]}>
                <Text
                  numberOfLines={2}
                  style={[styles.activeTaskTitle, isArabic && { textAlign: 'right' }]}
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
                    style={[styles.activeTaskDesc, isArabic && { textAlign: 'right' }]}
                  >
                    {activeTask.description}
                  </Text>
                ) : null}

                {/* Linked Goal or Project/Space Labels */}
                {(linkedGoal || linkedProject || linkedCategory) && (
                  <View style={[styles.activeLabelsRow, isArabic && styles.rowRtl]}>
                    {linkedGoal && (
                      <View style={[styles.activeLabelPill, isArabic && styles.rowRtl]}>
                        <Ionicons name="flag" size={10} color="#000000" />
                        <Text numberOfLines={1} style={styles.activeLabelText}>
                          {linkedGoal.title || linkedGoal.text}
                        </Text>
                      </View>
                    )}
                    {(linkedProject || linkedCategory) && (
                      <View style={[styles.activeLabelPill, isArabic && styles.rowRtl]}>
                        <Ionicons name="folder-outline" size={10} color="#000000" />
                        <Text numberOfLines={1} style={styles.activeLabelText}>
                          {linkedProject?.name || linkedCategory?.name}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

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
                  style={styles.activeCircularTimerWrapper}
                >
                  <CircularProgress
                    size={52}
                    strokeWidth={4.5}
                    progress={activeTaskProgress}
                    color="#000000"
                    unfilledColor="rgba(0, 0, 0, 0.16)"
                  >
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.circularTimeNumber} numberOfLines={1}>
                        {activeTask.timerDuration
                          ? formatDuration(timeLeft)
                          : `${activeTaskProgress}%`}
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

            {/* Current Horizontal Progression Bar */}
            <View style={styles.activeProgressBarContainer}>
              <View
                style={[
                  styles.activeProgressBarFill,
                  { width: `${Math.max(5, activeTaskProgress)}%` },
                ]}
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
                style={[styles.activeSubtasksToggleBtn, isArabic && styles.rowRtl]}
              >
                <View style={[styles.activeSubtasksToggleLeft, isArabic && styles.rowRtl]}>
                  <Ionicons name="list-outline" size={13} color="#000000" />
                  <Text style={styles.activeSubtasksToggleText}>
                    {isArabic ? 'المهام الفرعية' : 'Subtasks'}{' '}
                    ({activeSubtasks.filter((s: any) => s.status === 'done').length}/{activeSubtasks.length})
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
              <View style={styles.activeSubtasksList}>
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
                      style={[styles.activeSubtaskItem, isArabic && styles.rowRtl]}
                    >
                      <Ionicons
                        name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                        size={17}
                        color="#000000"
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.activeSubtaskItemText,
                          isDone && styles.activeSubtaskItemTextDone,
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

            {/* Actions & Remaining Time Row */}
            <View style={[styles.activeFooterRow, isArabic && styles.rowRtl]}>
              <View style={[styles.activeActionsGroup, isArabic && styles.rowRtl]}>
                {/* Complete Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (!activeTask) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleCompleteTaskAction(activeTask);
                  }}
                  style={styles.activeCompleteBtn}
                >
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  <Text style={styles.activeCompleteBtnText}>
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
                  style={styles.activePauseBtn}
                >
                  <Text style={styles.activePauseBtnText}>
                    {activeTask?.status === 'in_progress'
                      ? isArabic
                        ? 'إيقاف'
                        : 'Pause'
                      : isArabic
                      ? 'تشغيل'
                      : 'Resume'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Time Estimate / Countdown */}
              <Text style={styles.activeTimeRemainingText}>
                {activeTask?.timerDuration
                  ? formatDuration(timeLeft)
                  : activeTask
                  ? isArabic
                    ? 'المهمة جارية'
                    : 'In Progress'
                  : ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* ─────────────────────────────────────────────────────────────
          MAXIMIZED MODAL 1: Today's Tasks Center Pop-up
         ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isTasksModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsTasksModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsTasksModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.maximizedTasksCard}>
                {/* Drag Handle */}
                <View style={styles.baseDragHandle} />

                {/* Header */}
                <View style={[styles.modalHeader, isArabic && styles.rowRtl]}>
                  <View style={[styles.modalTitleGroup, isArabic && styles.rowRtl]}>
                    <Text style={styles.modalTitle}>
                      {isArabic ? 'مهام اليوم' : "Today's Tasks"}
                    </Text>
                    <View style={styles.baseTasksBadge}>
                      <Text style={styles.baseCountText}>{tasks.length}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsTasksModalOpen(false)}
                    style={styles.modalCloseCircle}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={18} color="#ffb09c" />
                  </TouchableOpacity>
                </View>

                {/* Filter Chips */}
                <View style={[styles.filterRow, isArabic && styles.rowRtl]}>
                  {(['all', 'todo', 'in_progress', 'done'] as const).map((filterKey) => {
                    const isActive = taskFilter === filterKey;
                    const label =
                      filterKey === 'all'
                        ? isArabic
                          ? 'الكل'
                          : 'All'
                        : filterKey === 'todo'
                        ? isArabic
                          ? 'قيد الانتظار'
                          : 'To Do'
                        : filterKey === 'in_progress'
                        ? isArabic
                          ? 'قيد التشغيل'
                          : 'In Progress'
                        : isArabic
                        ? 'مكتمل'
                        : 'Done';

                    return (
                      <TouchableOpacity
                        key={filterKey}
                        onPress={() => setTaskFilter(filterKey)}
                        style={[
                          styles.filterChip,
                          isActive && styles.filterChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isActive && styles.filterChipTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Scrollable Tasks List */}
                <ScrollView
                  style={styles.modalScrollList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 16 }}
                >
                  {filteredTasks.length === 0 ? (
                    <View style={styles.emptyTasksContainer}>
                      <Ionicons name="clipboard-outline" size={36} color="#ff9d84" />
                      <Text style={styles.emptyTasksTitle}>
                        {isArabic ? 'لا توجد مهام في هذا التصنيف' : 'No tasks in this category'}
                      </Text>
                    </View>
                  ) : (
                    filteredTasks.map((t) => {
                      const priorityInfo = getPriorityBadge(t.priority);
                      const isTaskDone = t.status === 'done';
                      const isSelected = activeTask?._id === t._id;
                      const isRunning = t.status === 'in_progress';

                      return (
                        <View
                          key={t._id}
                          style={[
                            styles.modalTaskCard,
                            isTaskDone && { opacity: 0.6 },
                            isSelected && { borderColor: '#ff9d84', backgroundColor: 'rgba(255, 157, 132, 0.10)' },
                            isArabic && styles.rowRtl,
                          ]}
                        >
                          {/* Checkbox */}
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              if (isTaskDone) {
                                setSelectedTaskId(t._id);
                                onReopenTask(t);
                              } else {
                                handleCompleteTaskAction(t);
                              }
                            }}
                            style={[
                              styles.modalCheckbox,
                              isTaskDone && { backgroundColor: '#ff9d84', borderColor: '#ff9d84' },
                            ]}
                          >
                            {isTaskDone && <Ionicons name="checkmark" size={14} color="#000000" />}
                          </TouchableOpacity>

                          {/* Info - tap to switch active task */}
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedTaskId(t._id);
                              setIsTasksModalOpen(false);
                            }}
                            style={{ flex: 1, marginHorizontal: 8 }}
                          >
                            <Text
                              numberOfLines={2}
                              style={[
                                styles.modalTaskTitle,
                                isTaskDone && styles.taskDoneText,
                                isArabic && { textAlign: 'right' },
                              ]}
                            >
                              {t.text}
                            </Text>
                            <View style={[styles.previewMetaRow, isArabic && styles.rowRtl]}>
                              {isSelected && (
                                <View style={styles.selectedActivePill}>
                                  <Text style={styles.selectedActivePillText}>
                                    {isArabic ? 'النشطة' : 'Active'}
                                  </Text>
                                </View>
                              )}
                              {t.priority && (
                                <View
                                  style={[
                                    styles.priorityPill,
                                    { backgroundColor: priorityInfo.bg, borderColor: priorityInfo.border },
                                  ]}
                                >
                                  <Text style={[styles.priorityPillText, { color: priorityInfo.text }]}>
                                    {priorityInfo.label}
                                  </Text>
                                </View>
                              )}
                              {t.projectName && (
                                <View style={styles.metaChip}>
                                  <Text style={styles.metaChipText}>#{t.projectName}</Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>

                          {/* Actions: Pencil & Run */}
                          <View style={[styles.modalActionsRow, isArabic && styles.rowRtl]}>
                            {/* Pencil Icon Button to open task details */}
                            <TouchableOpacity
                              activeOpacity={0.75}
                              onPress={(e) => {
                                e.stopPropagation();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedTaskId(t._id);
                                setIsTasksModalOpen(false);
                                onOpenDetail(t._id);
                              }}
                              style={styles.modalPencilBtn}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="pencil" size={12} color="#ffb09c" />
                            </TouchableOpacity>

                            {/* Run Action */}
                            {!isTaskDone && (
                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                  if (isRunning) {
                                    handlePauseTaskAction(t);
                                  } else {
                                    handleRunTaskAction(t);
                                    setIsTasksModalOpen(false);
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
                    })
                  )}
                </ScrollView>

                {/* Bottom CTA */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => {
                    setIsTasksModalOpen(false);
                    onAddTask();
                  }}
                  style={styles.modalAddBtn}
                >
                  <Text style={styles.modalAddBtnText}>
                    + {isArabic ? 'إضافة مهمة جديدة' : 'Add New Task'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MAXIMIZED MODAL 2: Active Task Center Pop-up (Electric Orange)
         ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isActiveTaskModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsActiveTaskModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsActiveTaskModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.maximizedActiveCard}>
                {/* Drag Handle */}
                <View style={styles.activeDragHandle} />

                {/* Header */}
                <View style={[styles.modalHeader, isArabic && styles.rowRtl]}>
                  <View style={styles.activeTaskBadge}>
                    <Text style={styles.activeTaskBadgeText}>
                      {isArabic ? 'المهمة النشطة' : 'ACTIVE TASK'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsActiveTaskModalOpen(false)}
                    style={styles.activeCloseCircle}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={18} color="#000000" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Task Title */}
                  <Text style={[styles.maxActiveTitle, isArabic && { textAlign: 'right' }]}>
                    {activeTask
                      ? activeTask.text
                      : isArabic
                      ? 'لا توجد مهمة نشطة'
                      : 'No active task selected'}
                  </Text>

                  {/* Task Description */}
                  {activeTask?.description ? (
                    <Text style={[styles.maxActiveDesc, isArabic && { textAlign: 'right' }]}>
                      {activeTask.description}
                    </Text>
                  ) : null}

                  {/* Status & Timer Card */}
                  <View style={styles.activeTimerSection}>
                    <View style={styles.activeTimerDisplay}>
                      <Text style={styles.activeTimerBigTime}>
                        {activeTask?.timerDuration
                          ? formatTime(timeLeft)
                          : `${activeTaskProgress}%`}
                      </Text>
                      <Text style={styles.activeTimerStatusLabel}>
                        {activeTask?.status === 'in_progress'
                          ? isArabic
                            ? 'المؤقت قيد التشغيل'
                            : 'Timer is running'
                          : activeTask?.status === 'paused'
                          ? isArabic
                            ? 'المؤقت متوقف مؤقتاً'
                            : 'Timer is paused'
                          : isArabic
                          ? 'مكتمل'
                          : 'Progress'}
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.maxProgressBarContainer}>
                      <View
                        style={[
                          styles.maxProgressBarFill,
                          { width: `${Math.max(5, activeTaskProgress)}%` },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Subtasks Section if any */}
                  {activeSubtasks && activeSubtasks.length > 0 && (
                    <View style={styles.activeSubtasksBox}>
                      <Text style={[styles.subtasksHeading, isArabic && { textAlign: 'right' }]}>
                        {isArabic ? 'المهام الفرعية' : 'Subtasks'}{' '}
                        ({activeSubtasks.filter((s: any) => s.status === 'done').length}/
                        {activeSubtasks.length})
                      </Text>
                      {activeSubtasks.map((sub: any) => (
                        <View
                          key={sub._id}
                          style={[styles.subtaskRow, isArabic && styles.rowRtl]}
                        >
                          <Ionicons
                            name={sub.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
                            size={18}
                            color="#000000"
                          />
                          <Text
                            style={[
                              styles.subtaskTitle,
                              sub.status === 'done' && styles.taskDoneText,
                            ]}
                          >
                            {sub.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Buttons */}
                  {activeTask && (
                    <View style={styles.maxActiveActions}>
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          handleCompleteTaskAction(activeTask);
                          setIsActiveTaskModalOpen(false);
                        }}
                        style={styles.maxCompleteBtn}
                      >
                        <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                        <Text style={styles.maxCompleteBtnText}>
                          {isArabic ? 'إكمال المهمة' : 'Complete Task'}
                        </Text>
                      </TouchableOpacity>

                      <View style={[styles.maxSubActionsRow, isArabic && styles.rowRtl]}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            if (activeTask.status === 'in_progress') {
                              handlePauseTaskAction(activeTask);
                            } else {
                              handleRunTaskAction(activeTask);
                            }
                          }}
                          style={styles.maxPauseBtn}
                        >
                          <Text style={styles.maxPauseBtnText}>
                            {activeTask.status === 'in_progress'
                              ? isArabic
                                ? 'إيقاف مؤقت'
                                : 'Pause Task'
                              : isArabic
                              ? 'استئناف'
                              : 'Resume Task'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => {
                            setIsActiveTaskModalOpen(false);
                            onOpenDetail(activeTask._id);
                          }}
                          style={styles.maxEditBtn}
                        >
                          <Ionicons name="create-outline" size={16} color="#000000" />
                          <Text style={styles.maxEditBtnText}>
                            {isArabic ? 'التفاصيل' : 'Details'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  deckContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  stackWrapper: {
    width: '100%',
    position: 'relative',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },

  // ─── Back Card: Peek Header Strip (Matching Reference Image) ───
  backCard: {
    width: '100%',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    minHeight: 120,
    paddingBottom: 48,
    overflow: 'hidden',
    zIndex: 1,
  },
  backCardTasks: {
    backgroundColor: '#0c0c0e',
    borderColor: '#ff5c16',
    borderWidth: 1.5,
  },
  backCardActive: {
    backgroundColor: '#ff5c16',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderWidth: 1,
  },
  peekHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  peekHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  peekHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  peekIconBadgeTasks: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 176, 156, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 156, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  peekTitleTasks: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  peekSubtitleTasks: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 1,
  },
  peekMetricTasks: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffb09c',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  peekMetricLabelTasks: {
    fontSize: 9.5,
    fontWeight: '900',
    color: 'rgba(255, 176, 156, 0.8)',
    letterSpacing: 0.6,
  },

  peekIconBadgeActive: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  peekTitleActive: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.3,
  },
  peekSubtitleActive: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.75)',
    marginTop: 1,
  },
  peekMetricActive: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  peekMetricLabelActive: {
    fontSize: 9.5,
    fontWeight: '900',
    color: 'rgba(0, 0, 0, 0.75)',
    letterSpacing: 0.6,
  },

  // ─── Front Card: Overlapping Foreground Modal Card ───
  frontCard: {
    width: '100%',
    borderRadius: 34,
    marginTop: -48,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 2,
  },
  frontCardActive: {
    backgroundColor: '#ff5c16',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  frontCardTasks: {
    backgroundColor: '#0c0c0e',
    borderColor: '#ff5c16',
    borderWidth: 1.5,
  },

  expandMiniBtnActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandMiniBtnTasks: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 176, 156, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  frontTasksFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 157, 132, 0.18)',
  },
  frontAddTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffb09c',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  frontAddTaskBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#000000',
  },

  // ─── Legacy Base Task Card Items & Preview Styles ───
  baseTasksCard: {
    width: '100%',
    backgroundColor: '#0c0c0e',
    borderColor: 'rgba(255, 157, 132, 0.6)',
    borderWidth: 1.5,
    borderRadius: 32,
    padding: 16,
    paddingTop: 12,
    paddingBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  baseDragHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 157, 132, 0.7)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  baseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  baseTasksBadge: {
    backgroundColor: '#ffb09c',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  baseTasksBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
  },
  baseCountDot: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  baseCountText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
  },
  tasksListPreview: {
    gap: 6,
  },
  previewTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    gap: 10,
  },
  previewTaskRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 157, 132, 0.18)',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewTaskTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    flexShrink: 1,
  },
  taskDoneText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
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
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  metaChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  metaChipText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#ffa28c',
  },
  runningIndicator: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#ff5c16',
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff9d84',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#ff9d84',
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  runButtonActive: {
    backgroundColor: '#ff5c16',
  },
  runButtonDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
  emptyPreviewContainer: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyPreviewText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  baseCardFooterHint: {
    alignItems: 'center',
    marginTop: 8,
  },
  baseCardFooterHintText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(255, 176, 156, 0.8)',
  },

  // ─── Active Task Card: Electric Orange Sheet ───
  activeTaskCard: {
    width: '100%',
    backgroundColor: '#ff5c16',
    borderRadius: 32,
    padding: 16,
    paddingTop: 12,
    paddingBottom: 16,
    marginTop: -38, // Overlays slightly over the dark sheet like Stitch
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  activeDragHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activeTaskBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeTaskBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: 'rgba(0, 0, 0, 0.85)',
    letterSpacing: 0.5,
  },
  activeStatusPill: {
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeStatusPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ff5c16',
  },
  activeBody: {
    marginBottom: 10,
  },
  activeBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  activeCircularTimerWrapper: {
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
  activeLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  activeLabelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    maxWidth: 140,
  },
  activeLabelText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#000000',
  },
  activeSubtasksToggleBtn: {
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
  activeSubtasksToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeSubtasksToggleText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#000000',
  },
  activeSubtasksList: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    padding: 8,
    gap: 5,
    marginBottom: 8,
  },
  activeSubtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  activeSubtaskItemText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  activeSubtaskItemTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  activeTaskTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  activeTaskDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.75)',
    marginTop: 2,
    lineHeight: 16,
  },
  activeProgressBarContainer: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  activeProgressBarFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 3,
  },
  activeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.12)',
    paddingTop: 10,
  },
  activeActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeCompleteBtn: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  activeCompleteBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activePauseBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  activePauseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  activeTimeRemainingText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: 'rgba(0, 0, 0, 0.85)',
  },

  // ─── Modal Overlay & Pop-up Frames ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  maximizedTasksCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '82%',
    backgroundColor: '#0c0c0e',
    borderColor: '#ff9d84',
    borderWidth: 1.5,
    borderRadius: 32,
    padding: 18,
    shadowColor: '#ff9d84',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  maximizedActiveCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: '#ff5c16',
    borderRadius: 32,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 176, 156, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: '#ffb09c',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  filterChipTextActive: {
    color: '#000000',
  },
  modalScrollList: {
    maxHeight: 380,
  },
  modalTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 157, 132, 0.2)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  modalCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 157, 132, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTaskTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalPencilBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 176, 156, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 157, 132, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedActivePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 92, 22, 0.25)',
    borderWidth: 1,
    borderColor: '#ff5c16',
  },
  selectedActivePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ff9d84',
  },
  modalAddBtn: {
    backgroundColor: '#ffb09c',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalAddBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  emptyTasksContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTasksTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // ─── Maximized Active Card Inner Styles ───
  maxActiveTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  maxActiveDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.75)',
    marginTop: 4,
    lineHeight: 18,
  },
  activeTimerSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 20,
    padding: 16,
    marginVertical: 14,
    alignItems: 'center',
  },
  activeTimerDisplay: {
    alignItems: 'center',
    marginBottom: 10,
  },
  activeTimerBigTime: {
    fontSize: 34,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
  },
  activeTimerStatusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(0, 0, 0, 0.7)',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  maxProgressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  maxProgressBarFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 4,
  },
  activeSubtasksBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  subtasksHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  subtaskTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  maxActiveActions: {
    gap: 8,
    marginTop: 4,
  },
  maxCompleteBtn: {
    backgroundColor: '#000000',
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  maxCompleteBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  maxSubActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  maxPauseBtn: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 16,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxPauseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  maxEditBtn: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  maxEditBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
});

export default StackedTaskModals;
