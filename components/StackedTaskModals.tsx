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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { Id } from '@/convex/_generated/dataModel';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { api } from '@/convex/_generated/api';
import { getServerNow } from '@/utils/offlineStorage';
import CircularProgress from './CircularProgress';

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

  // Identify the currently active task
  const activeTask = useMemo(() => {
    // 1. Look for in_progress task
    const inProg = tasks.find((t) => t.status === 'in_progress');
    if (inProg) return inProg;
    // 2. Look for paused task
    const paused = tasks.find((t) => t.status === 'paused');
    if (paused) return paused;
    // 3. Fallback to first incomplete task
    const notDone = tasks.find((t) => t.status !== 'done');
    return notDone || null;
  }, [tasks]);

  // Subtasks for active task if present
  const activeSubtasks = useOfflineQuery<any[]>(
    'todos.getSubtasks',
    api.todos.getSubtasks,
    activeTask ? { parentId: activeTask._id } : 'skip'
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

  // Top 3 tasks to preview in the inline sheet
  const previewTasks = useMemo(() => {
    // prioritize in_progress or not_started tasks
    const pending = tasks.filter((t) => t.status !== 'done');
    if (pending.length >= 3) return pending.slice(0, 3);
    const completed = tasks.filter((t) => t.status === 'done');
    return [...pending, ...completed].slice(0, 3);
  }, [tasks]);

  return (
    <View style={styles.deckContainer}>
      {/* ─────────────────────────────────────────────────────────────
          LAYER 1: Base Modal Card (Dark Tasks Sheet - #0c0c0e)
         ───────────────────────────────────────────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsTasksModalOpen(true);
        }}
        style={styles.baseTasksCard}
      >
        {/* Drag Handle */}
        <View style={styles.baseDragHandle} />

        {/* Pill Badge Header */}
        <View style={styles.baseHeaderRow}>
          <View style={styles.baseTasksBadge}>
            <Text style={styles.baseTasksBadgeText}>
              {isArabic ? 'المهام' : 'TASKS'}
            </Text>
            <View style={styles.baseCountDot}>
              <Text style={styles.baseCountText}>{tasks.length}</Text>
            </View>
          </View>
        </View>

        {/* Task Items Preview */}
        {previewTasks.length === 0 ? (
          <View style={styles.emptyPreviewContainer}>
            <Text style={styles.emptyPreviewText}>
              {isArabic ? 'لا توجد مهام اليوم. اضغط لإضافة مهمة' : 'No tasks for today. Tap to create one'}
            </Text>
          </View>
        ) : (
          <View style={styles.tasksListPreview}>
            {previewTasks.map((t, idx) => {
              const priorityInfo = getPriorityBadge(t.priority);
              const isCurrentActive = activeTask?._id === t._id && t.status === 'in_progress';
              const isTaskDone = t.status === 'done';

              return (
                <View
                  key={t._id}
                  style={[
                    styles.previewTaskRow,
                    idx < previewTasks.length - 1 && styles.previewTaskRowBorder,
                    isArabic && styles.rowRtl,
                  ]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={[styles.taskTitleRow, isArabic && styles.rowRtl]}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.previewTaskTitle,
                          isTaskDone && styles.taskDoneText,
                          isArabic && { textAlign: 'right' },
                        ]}
                      >
                        {t.text}
                      </Text>
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
                    </View>

                    {/* Tags / Subtitle */}
                    <View style={[styles.previewMetaRow, isArabic && styles.rowRtl]}>
                      {t.projectName ? (
                        <View style={styles.metaChip}>
                          <Text style={styles.metaChipText}>#{t.projectName}</Text>
                        </View>
                      ) : (
                        <View style={styles.metaChip}>
                          <Text style={styles.metaChipText}>#General</Text>
                        </View>
                      )}
                      {isCurrentActive && (
                        <Text style={styles.runningIndicator}>
                          {isArabic ? '● قيد التشغيل' : '● Active'}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Run / Status Action Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (isTaskDone) {
                        onReopenTask(t);
                      } else if (isCurrentActive) {
                        onPauseTask(t);
                      } else {
                        onRunTask(t);
                      }
                    }}
                    style={[
                      styles.runButton,
                      isCurrentActive && styles.runButtonActive,
                      isTaskDone && styles.runButtonDone,
                    ]}
                  >
                    <Text style={styles.runButtonIcon}>
                      {isTaskDone ? '✓' : isCurrentActive ? '❚❚' : '▶'}
                    </Text>
                    <Text style={styles.runButtonText}>
                      {isTaskDone
                        ? isArabic
                          ? 'مكتمل'
                          : 'Done'
                        : isCurrentActive
                        ? isArabic
                          ? 'إيقاف'
                          : 'Pause'
                        : isArabic
                        ? 'تشغيل'
                        : 'Run'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.baseCardFooterHint}>
          <Text style={styles.baseCardFooterHintText}>
            {isArabic ? 'اضغط لفتح نافذة المهام الكاملة' : 'Tap to expand full task sheet'} ↗
          </Text>
        </View>
      </TouchableOpacity>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 2: Overlaying Active Task Card (Electric Orange - #ff5c16)
         ───────────────────────────────────────────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsActiveTaskModalOpen(true);
        }}
        style={styles.activeTaskCard}
      >
        {/* Drag Handle */}
        <View style={styles.activeDragHandle} />

        {/* Header Row */}
        <View style={[styles.activeHeaderRow, isArabic && styles.rowRtl]}>
          <View style={styles.activeTaskBadge}>
            <Text style={styles.activeTaskBadgeText}>
              {isArabic ? 'المهمة النشطة' : 'Active Task'}
            </Text>
          </View>
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
        </View>

        {/* Task Title & Description */}
        <View style={styles.activeBody}>
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
          <Text
            numberOfLines={2}
            style={[styles.activeTaskDesc, isArabic && { textAlign: 'right' }]}
          >
            {activeTask?.description
              ? activeTask.description
              : activeTask
              ? isArabic
                ? 'اضغط لإدارة وتتبع تقدم المهمة ومؤقت التركيز'
                : 'Tap to view live progress, subtasks and focus timer'
              : isArabic
              ? 'اضغط تشغيل على أي مهمة بالأسفل لبدء العمل عليها'
              : 'Tap "Run" on any task above to start working'}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.activeProgressBarContainer}>
          <View
            style={[
              styles.activeProgressBarFill,
              { width: `${Math.max(5, activeTaskProgress)}%` },
            ]}
          />
        </View>

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
                onCompleteTask(activeTask);
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
                  onPauseTask(activeTask);
                } else {
                  onRunTask(activeTask);
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
      </TouchableOpacity>

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
                      const isCurrentActive = activeTask?._id === t._id && t.status === 'in_progress';

                      return (
                        <View
                          key={t._id}
                          style={[
                            styles.modalTaskCard,
                            isTaskDone && { opacity: 0.6 },
                            isCurrentActive && { borderColor: '#ff9d84' },
                            isArabic && styles.rowRtl,
                          ]}
                        >
                          {/* Checkbox */}
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              if (isTaskDone) onReopenTask(t);
                              else onCompleteTask(t);
                            }}
                            style={[
                              styles.modalCheckbox,
                              isTaskDone && { backgroundColor: '#ff9d84', borderColor: '#ff9d84' },
                            ]}
                          >
                            {isTaskDone && <Ionicons name="checkmark" size={14} color="#000000" />}
                          </TouchableOpacity>

                          {/* Info */}
                          <TouchableOpacity
                            onPress={() => {
                              setIsTasksModalOpen(false);
                              onOpenDetail(t._id);
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

                          {/* Run Action */}
                          {!isTaskDone && (
                            <TouchableOpacity
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                if (isCurrentActive) {
                                  onPauseTask(t);
                                } else {
                                  onRunTask(t);
                                  setIsTasksModalOpen(false);
                                }
                              }}
                              style={[
                                styles.runButton,
                                isCurrentActive && styles.runButtonActive,
                              ]}
                            >
                              <Text style={styles.runButtonIcon}>
                                {isCurrentActive ? '❚❚' : '▶'}
                              </Text>
                              <Text style={styles.runButtonText}>
                                {isCurrentActive
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
                          onCompleteTask(activeTask);
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
                              onPauseTask(activeTask);
                            } else {
                              onRunTask(activeTask);
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
    marginTop: 4,
    marginBottom: 8,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },

  // ─── Base Card: Dark Tasks Sheet ───
  baseTasksCard: {
    width: '100%',
    backgroundColor: '#0c0c0e',
    borderColor: 'rgba(255, 157, 132, 0.6)',
    borderWidth: 1.5,
    borderRadius: 32,
    padding: 16,
    paddingTop: 12,
    paddingBottom: 48, // space under for layered active card overlap
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
    alignItems: 'center',
    justifyContent: 'center',
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
