import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { createHomeStyles } from "@/assets/styles/home.styles";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";
import { useGuardedSubmit } from "@/hooks/useSubmitGuard";
import { useOfflineQuery } from "@/hooks/useOfflineQuery";
import useTheme from "@/hooks/useTheme";
import { modeColor } from "@/utils/colorUtils";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/utils/i18n";
import { getServerNow } from "@/utils/offlineStorage";
import { useDailyReminders } from "@/hooks/useDailyReminders";
import { useDeadlineReminders } from "@/hooks/useDeadlineReminders";
import { useScreenGuide } from "@/hooks/useScreenGuide";
import { useTaskTimers } from "@/hooks/useTaskTimers";
import { computeRepeatOccurrence, RepeatPeriod } from "@/utils/notifications";

import {
  HomeTopWidget,
  HomeFeatureStrip,
  FeatureSheet,
  HomeTasksWidget,
  HomeFeatureKey,
  HomeFeatureDef,
  LIME_ACCENT,
} from "@/components/home";

import { ActiveTaskProvider } from "@/components/ActiveTaskContext";
import ActionModal from "@/components/ActionModal";
import ChecklistItemModal from "@/components/ChecklistItemModal";
import ScreenGuide, { GuideTip } from "@/components/ScreenGuide";
import TaskDetailModal from "@/components/TaskDetailModal";
import TimerModal from "@/components/TimerModal";
import { startUpdate, pauseUpdate } from '@/utils/timerActions';

import {
  ChecklistCard,
  UpcomingEventsCard,
  MonthlyOverviewCard,
  InsightsCard,
  EventManagementModal,
  EventData,
  UpcomingEventDisplay,
} from "@/components/ScrollStack";

import { api } from "../../convex/_generated/api";
import { Id } from '../../convex/_generated/dataModel';
import { getEffectiveTaskDay, startOfDay, isDayPastCutoff } from '@/utils/taskDateUtils';

const months_en = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const months_ar = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const Index = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const { colors, isDarkMode } = useTheme();

  // Convex Queries & Mutations
  const todos = useOfflineQuery<any[]>('todos', api.todos.get, userId ? { userId } : 'skip');
  const linkedChildren = useOfflineQuery<any[]>('todos.getLinkedChildren', api.todos.getLinkedChildren, userId ? { userId } : 'skip');
  const deleteTodo = useOfflineMutation(api.todos.deleteTodo, "todos:deleteTodo");
  const updateStatus = useOfflineMutation(api.todos.updateStatus, "todos:updateStatus");
  const addTodoMutation = useOfflineMutation(api.todos.addTodo, "todos:addTodo");
  const updateTodoMutation = useOfflineMutation(api.todos.updateTodo, "todos:updateTodo");
  const setTimerMutation = useOfflineMutation(api.todos.setTimer, "todos:setTimer");
  const setTimerRunState = useOfflineMutation(api.todos.setTimerRunState, "todos:setTimerRunState");

  // Yearly goals for monthly card
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const currentMonthName = isArabic ? months_ar[currentMonthIdx] : months_en[currentMonthIdx];
  const yearlyGoals = useOfflineQuery<any[]>(
    'yearlyGoals.getGoals',
    api.yearlyGoals.getGoals,
    userId ? { userId, year: currentYear } : 'skip'
  ) || [];

  // Daily insights for focus topics and wellbeing
  const dailyInsights = useOfflineQuery(
    'insights.daily',
    api.insights.getLatestInsights,
    userId ? { userId, period: "day" } : 'skip'
  );

  // Local State
  const [isGlobalActionModalVisible, setGlobalActionModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<Id<"todos"> | null>(null);
  const [editingTaskSection, setEditingTaskSection] = useState<'subtask' | undefined>(undefined);
  const [sortActive, setSortActive] = useState('');
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [isChecklistItemModalVisible, setIsChecklistItemModalVisible] = useState(false);
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<Id<"todos"> | null>(null);
  const [checklistItemSession, setChecklistItemSession] = useState(0);
  const [eventToEdit, setEventToEdit] = useState<EventData | null>(null);
  const [isFocusTimerModalVisible, setFocusTimerModalVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState<HomeFeatureKey | null>(null);

  const [todayStart] = useState(() => startOfDay(Date.now()));
  const [now] = useState(() => Date.now());
  const [selectedDate, setSelectedDate] = useState(todayStart);

  const scrollViewRef = useRef<ScrollViewInstance>(null);
  const homeStyles = createHomeStyles(colors, isArabic);
  const { showGuide, dismissGuide } = useScreenGuide('home');
  useTaskTimers(todos, updateStatus, linkedChildren as any[], setTimerMutation, language);
  useDailyReminders(todos, language);
  useDeadlineReminders(todos, language);

  const homeTips: GuideTip[] = isArabic ? [
    { icon: 'add-circle-outline', title: 'أضف مهمة', description: 'اضغط على زر + في الزاوية لإضافة مهمة جديدة.', accentColor: '#dbd4fd' },
    { icon: 'timer-outline', title: 'مؤقت ذكي', description: 'اضغط على أيقونة الساعة لتحديد مدة المهمة وموعدها.', accentColor: '#defef9' },
    { icon: 'hand-left-outline', title: 'الميزات السريعة', description: 'تصفح الميزات في الشريط الأوسط للوصول للقوائم والمواعيد.', accentColor: '#f6e5c9' },
  ] : [
    { icon: 'add-circle-outline', title: 'Add a Task', description: 'Tap the floating + button in the bottom corner to add a task.', accentColor: '#dbd4fd' },
    { icon: 'timer-outline', title: 'Smart Timer', description: 'Tap the clock icon on any task to set a duration and due date.', accentColor: '#defef9' },
    { icon: 'hand-left-outline', title: 'Quick Features', description: 'Scroll through the feature cards in the middle to open checklists & events.', accentColor: '#f6e5c9' },
  ];

  // Normalized Todos (Top-level tasks only)
  const normalizedTodos = useMemo(() => {
    if (!todos) return [];
    return todos
      .filter(t => !t.parentId && (!t.type || t.type === 'task'))
      .map(t => ({
        ...t,
        status: t.status || ((t as any).isCompleted ? 'done' : 'not_started')
      }));
  }, [todos]);

  // Upcoming Events from Todos
  const upcomingEvents: UpcomingEventDisplay[] = useMemo(() => {
    if (!todos) return [];
    const nowTs = Date.now();
    return todos
      .filter(t =>
        !t.parentId && (
        t.type === 'reminder' ||
        t.type === 'meeting' ||
        t.type === 'appointment' ||
        Boolean(t.meetingLink) ||
        Boolean(t.location) ||
        (t.dueDate && t.dueDate >= todayStart && t.type !== 'task'))
      )
      .map(t => {
        let displayTime = t.dueDate || t.date || nowTs;
        if (t.repeatPeriod && t.repeatPeriod !== 'none' && t.dueDate) {
          const count = Math.max(1, t.repeatCount || 1);
          for (let i = 0; i < count; i++) {
            const occ = computeRepeatOccurrence(t.dueDate, t.repeatPeriod as RepeatPeriod, i);
            if (occ >= nowTs - 60000) {
              displayTime = occ;
              break;
            }
          }
        }
        return {
          _id: t._id,
          title: t.text,
          date: displayTime,
          startTime: displayTime,
          endTime: t.dueDate,
          location: t.location,
          meetingLink: t.meetingLink,
          priority: t.priority,
          type: t.type,
          description: t.description,
          repeatPeriod: t.repeatPeriod,
          repeatCount: t.repeatCount,
          status: t.status || (t.isCompleted ? 'done' : 'not_started'),
        };
      })
      .sort((a, b) => (a.startTime || a.date || 0) - (b.startTime || b.date || 0));
  }, [todos, todayStart]);

  const isViewingToday = selectedDate === todayStart;

  // Monthly Overview Stats
  const { monthDoneCount, monthTotalCount, activeMonthlyGoals } = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonthIdx, 1).getTime();
    const nextMonthStart = new Date(currentYear, currentMonthIdx + 1, 1).getTime();

    let done = 0;
    let total = 0;

    normalizedTodos.forEach(t => {
      const effectiveDay = getEffectiveTaskDay(t, todayStart);
      if (effectiveDay >= monthStart && effectiveDay < nextMonthStart) {
        total++;
        if (t.status === 'done') done++;
      }
    });

    const activeGoals = yearlyGoals.filter(g => !g.isCompleted).length;

    return {
      monthDoneCount: done,
      monthTotalCount: Math.max(total, done),
      activeMonthlyGoals: activeGoals,
    };
  }, [normalizedTodos, yearlyGoals, currentYear, currentMonthIdx, todayStart]);

  // Productivity & Streak Stats
  const { streakCount } = useMemo(() => {
    const completedTimestamps = normalizedTodos
      .filter(t => t.status === 'done' && t.completedAt)
      .map(t => getEffectiveTaskDay(t, todayStart));

    const uniqueDays = Array.from(new Set(completedTimestamps)).sort((a, b) => b - a);

    let streak = 0;
    let checkDay = todayStart;

    if (uniqueDays.includes(checkDay)) {
      streak++;
      checkDay -= 86400000;
    } else {
      checkDay -= 86400000;
    }

    while (uniqueDays.includes(checkDay)) {
      streak++;
      checkDay -= 86400000;
    }

    return {
      streakCount: Math.max(streak, 1),
    };
  }, [normalizedTodos, todayStart]);

  const pScores: Record<string, number> = { 'Urgent': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
  const byPriority = (a: any, b: any) => {
    if (sortActive === 'date') return (a.dueDate || 0) - (b.dueDate || 0);
    const pDiff = (pScores[b.priority || ''] ?? -1) - (pScores[a.priority || ''] ?? -1);
    if (pDiff !== 0) return pDiff;
    return (a._creationTime || 0) - (b._creationTime || 0);
  };

  // Day Task Counts for DateBar
  const dayTaskCounts = useMemo(() => {
    const counts = new Map<number, number>();
    normalizedTodos.forEach(t => {
      const a = getEffectiveTaskDay(t, todayStart);
      counts.set(a, (counts.get(a) || 0) + 1);
    });
    return counts;
  }, [normalizedTodos, todayStart]);

  // Checklist items for the selected day
  const { todayChecklistTasks, checklistDoneCount, checklistTotalCount } = useMemo(() => {
    const linkedCountByParent = new Map<string, number>();
    (linkedChildren || []).forEach((c: any) => {
      if (c.parentId) linkedCountByParent.set(c.parentId, (linkedCountByParent.get(c.parentId) || 0) + 1);
    });

    const dayChecklistRaw = (todos || []).filter(t => {
      if (t.parentId) return false;
      const a = getEffectiveTaskDay(t, todayStart);
      return a === selectedDate && t.type === 'checklist';
    });

    const checklistTasks = dayChecklistRaw.map(task => ({
      _id: task._id,
      text: task.text,
      status: task.status || ((task as any).isCompleted ? 'done' : 'not_started'),
      priority: task.priority,
      dueDate: task.dueDate,
      kind: 'checklist' as const,
      linkedCount: linkedCountByParent.get(task._id) || 0,
    }));

    const done = checklistTasks.filter(t => t.status === 'done').length;

    return {
      todayChecklistTasks: checklistTasks,
      checklistDoneCount: done,
      checklistTotalCount: checklistTasks.length,
    };
  }, [todos, selectedDate, todayStart, linkedChildren]);

  // Tasks for the selected date (sorted by priority)
  const currentDayTasks = useMemo(() => {
    return normalizedTodos
      .filter(t => getEffectiveTaskDay(t, todayStart) === selectedDate)
      .sort(byPriority);
  }, [normalizedTodos, selectedDate, todayStart, sortActive]);

  const currentDayDoneCount = useMemo(() => {
    return currentDayTasks.filter(t => t.status === 'done').length;
  }, [currentDayTasks]);

  const handleEditTask = (id: Id<"todos">, section?: 'subtask') => {
    setEditingTaskId(id);
    setEditingTaskSection(section);
  };

  // Toggle task status from Checklist Card
  const handleToggleTaskStatus = (id: Id<"todos">, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'not_started' : 'done';
    updateStatus({ id, status: nextStatus });
  };

  const openChecklistItemModal = (id: Id<"todos"> | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingChecklistItemId(id);
    setChecklistItemSession((s) => s + 1);
    setIsChecklistItemModalVisible(true);
  };

  // Task Actions
  const handleRunTask = (task: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (task.timerDuration || task.timerDirection === 'up') {
      setTimerRunState({ updates: [startUpdate(task)] });
    } else {
      updateStatus({ id: task._id, status: 'in_progress' });
    }
  };

  const handlePauseTask = (task: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (task.timerDuration || task.timerDirection === 'up') {
      const update = pauseUpdate(task);
      if (update) {
        setTimerRunState({ updates: [update] });
        return;
      }
    }
    updateStatus({ id: task._id, status: 'paused' });
  };

  const handleCompleteTask = (task: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateStatus({ id: task._id, status: 'done' });
  };

  const handleReopenTask = (task: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateStatus({ id: task._id, status: 'not_started' });
  };

  // Open Day Planner in tabs
  const handleOpenDayPlanner = (dayTimestamp: number) => {
    const d = new Date(dayTimestamp);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    router.push({
      pathname: '/(tabs)/planner',
      params: {
        year: year.toString(),
        month: month.toString(),
        day: day.toString(),
        from: 'home',
      }
    });
  };

  // Event handlers
  const handleOpenEventModal = (evt?: UpcomingEventDisplay) => {
    if (evt) {
      setEventToEdit({
        _id: evt._id,
        title: evt.title,
        date: evt.date,
        startTime: evt.startTime,
        endTime: evt.endTime,
        location: evt.location,
        meetingLink: evt.meetingLink,
        priority: evt.priority,
        type: evt.type === 'meeting' || evt.type === 'appointment' ? evt.type : 'reminder',
        description: evt.description,
        repeatPeriod: (evt.repeatPeriod as EventData['repeatPeriod']) || 'none',
        repeatCount: evt.repeatCount || 1,
      });
    } else {
      setEventToEdit(null);
    }
    setIsEventModalVisible(true);
  };

  const handleSaveEvent = async (evt: EventData) => {
    const itemType = evt.type || 'reminder';
    const repeatOn = !!evt.repeatPeriod && evt.repeatPeriod !== 'none';
    const hadRepeat =
      !!eventToEdit?.repeatPeriod && (eventToEdit.repeatPeriod as string) !== 'none';
    const repeatFields: Record<string, unknown> = repeatOn
      ? {
          repeatPeriod: evt.repeatPeriod,
          repeatCount: Math.max(1, Math.min(60, evt.repeatCount || 1)),
        }
      : evt._id && hadRepeat
        ? { repeatPeriod: '' }
        : {};

    try {
      const { requestPermissionsAsync, ensureNotificationChannels } = await import('@/utils/notifications');
      await ensureNotificationChannels();
      await requestPermissionsAsync();
    } catch {}

    if (evt._id) {
      import('@/utils/notifications').then(n =>
        n.cancelReminderSeries(String(evt._id))
      ).catch(() => {});
    }

    let savedId = evt._id;
    if (evt._id) {
      await updateTodoMutation({
        id: evt._id,
        text: evt.title,
        type: itemType,
        date: evt.date,
        dueDate: evt.startTime,
        location: evt.location,
        meetingLink: evt.meetingLink,
        description: evt.description,
        priority: evt.priority,
        ...repeatFields,
      });
    } else {
      if (!userId) return;
      const res = await addTodoMutation({
        userId,
        text: evt.title,
        type: itemType,
        date: evt.date,
        dueDate: evt.startTime,
        location: evt.location,
        meetingLink: evt.meetingLink,
        description: evt.description,
        priority: evt.priority,
        status: 'not_started',
        ...repeatFields,
      });
      savedId = typeof res === 'string' ? res : (res as any)?._id;
    }

    if (savedId) {
      try {
        const { scheduleRepeatingReminder, scheduleReminderNotification } = await import('@/utils/notifications');
        if (repeatOn && evt.repeatPeriod) {
          await scheduleRepeatingReminder(
            String(savedId),
            evt.title,
            evt.startTime || evt.date,
            evt.repeatPeriod as any,
            evt.repeatCount || 1,
            language
          );
        } else {
          await scheduleReminderNotification(
            evt.title,
            evt.startTime || evt.date,
            language,
            String(savedId)
          );
        }
      } catch (e) {
        console.warn('Failed to schedule reminder notification immediately:', e);
      }
    }
  };

  const handleDeleteEvent = async (id: Id<"todos">) => {
    try {
      const { cancelReminderSeries } = await import('@/utils/notifications');
      await cancelReminderSeries(String(id));
    } catch {}
    await deleteTodo({ id });
  };

  const handleToggleEventDone = useGuardedSubmit(async (id: Id<"todos">, currentStatus?: string) => {
    const nextStatus = currentStatus === 'done' ? 'not_started' : 'done';
    if (nextStatus === 'done') {
      try {
        const { cancelReminderSeries } = await import('@/utils/notifications');
        await cancelReminderSeries(String(id));
      } catch {}
    }
    await updateStatus({ id, status: nextStatus });
  });

  const handleStartFocusTimer = () => {
    setFocusTimerModalVisible(true);
  };

  const handleSaveFocusTimer = async (durationInMs: number, dueDate?: number, date?: number) => {
    const topTask = currentDayTasks[0];
    if (!topTask) return;
    try {
      await setTimerMutation({
        id: topTask._id,
        duration: durationInMs,
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(date !== undefined ? { date } : {}),
      });
      await setTimerRunState({
        updates: [{ id: topTask._id, status: 'in_progress', timerStartTime: getServerNow() }],
      });
    } catch (err) {
      console.warn('Failed to start focus timer', err);
    }
  };

  // Feature strip definition
  const featuresList: HomeFeatureDef[] = useMemo(() => [
    {
      key: 'checklist',
      icon: 'checkbox-outline',
      title: isArabic ? 'قائمة المهام' : 'Checklist',
      badge: checklistTotalCount > 0 ? `${checklistDoneCount}/${checklistTotalCount}` : undefined,
      accentColor: '#FD8B2D',
    },
    {
      key: 'reminders',
      icon: 'notifications-outline',
      title: isArabic ? 'التذكيرات' : 'Reminders',
      badge: upcomingEvents.length > 0 ? `${upcomingEvents.length}` : undefined,
      accentColor: '#38BDF8',
    },
    {
      key: 'monthly',
      icon: 'calendar-outline',
      title: isArabic ? 'نظرة شهرية' : 'Monthly',
      accentColor: '#A78BFA',
    },
    {
      key: 'insights',
      icon: 'sparkles-outline',
      title: isArabic ? 'تحليلات AI' : 'Insights',
      accentColor: '#34D399',
    },
    {
      key: 'timer',
      icon: 'timer-outline',
      title: isArabic ? 'مؤقت التركيز' : 'Focus Timer',
      accentColor: '#F472B6',
    },
  ], [isArabic, checklistTotalCount, checklistDoneCount, upcomingEvents.length]);

  const handleSelectFeature = (key: HomeFeatureKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === 'timer') {
      handleStartFocusTimer();
    } else {
      setActiveFeature(key);
    }
  };

  const featureSheetTitle = useMemo(() => {
    switch (activeFeature) {
      case 'checklist':
        return isArabic ? 'قائمة المهام اليومية' : "Today's Checklist";
      case 'reminders':
        return isArabic ? 'المواعيد والتذكيرات' : 'Upcoming Reminders & Events';
      case 'monthly':
        return isArabic ? 'نظرة عامة على الشهر' : 'Monthly Overview';
      case 'insights':
        return isArabic ? 'تحليلات ورؤى ذكية' : 'AI Insights & Wellbeing';
      default:
        return '';
    }
  }, [activeFeature, isArabic]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Device Status Bar settles inside the lime widget at the top */}
      <StatusBar style="dark" />

      {todos === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      ) : (
        <ActiveTaskProvider tasks={currentDayTasks}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 120 },
            ]} 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            {/* 1. UPPER WIDGET (Lime Accent with rounded bottom corners, holds Header & DateBar) */}
            <HomeTopWidget
              selectedDate={selectedDate}
              todayStart={todayStart}
              onSelectDate={setSelectedDate}
              onOpenDayPlanner={handleOpenDayPlanner}
              homeStyles={homeStyles}
              isArabic={isArabic}
              taskCounts={dayTaskCounts}
            />

            {/* 2. THIRD SECTION (Transparent Horizontally Scrollable Feature Cards) */}
            <HomeFeatureStrip
              features={featuresList}
              onSelectFeature={handleSelectFeature}
              isArabic={isArabic}
            />

            {/* 3. LOWER WIDGET (Purple #8A2BE2 with rounded corners, holds 4-Task CardStack) */}
            <HomeTasksWidget
              tasks={currentDayTasks}
              doneCount={currentDayDoneCount}
              totalCount={currentDayTasks.length}
              isArabic={isArabic}
              onRunTask={handleRunTask}
              onPauseTask={handlePauseTask}
              onCompleteTask={handleCompleteTask}
              onEditTask={handleEditTask}
              onAddTask={() => setIsTaskModalVisible(true)}
              onViewAll={() => handleOpenDayPlanner(selectedDate)}
            />
          </ScrollView>

          {/* 4. Floating Call-To-Action Button ("Add Task" in bottom right above tabs bar) */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsTaskModalVisible(true);
            }}
            style={[
              styles.floatingCta,
              isArabic ? { left: 20 } : { right: 20 },
              { bottom: insets.bottom + 74 },
            ]}
          >
            <Ionicons name="add" size={20} color="#000000" />
            <Text style={styles.floatingCtaText}>
              {isArabic ? 'إضافة مهمة' : 'Add Task'}
            </Text>
          </TouchableOpacity>
        </ActiveTaskProvider>
      )}

      {/* Feature Sheet Modal for Checklist, Reminders, Monthly, Insights */}
      <FeatureSheet
        visible={activeFeature !== null}
        onClose={() => setActiveFeature(null)}
        title={featureSheetTitle}
        isArabic={isArabic}
      >
        {activeFeature === 'checklist' && (
          <ChecklistCard
            tasks={todayChecklistTasks}
            doneCount={checklistDoneCount}
            totalCount={checklistTotalCount}
            onToggleTask={handleToggleTaskStatus}
            onOpenTaskDetail={(id) => handleEditTask(id)}
            onQuickManage={() => setGlobalActionModalVisible(true)}
            onScrollToTasksSection={() => {
              setActiveFeature(null);
            }}
            onAddNewTask={() => {
              setActiveFeature(null);
              setIsTaskModalVisible(true);
            }}
            onAddChecklistItem={() => openChecklistItemModal(null)}
            onOpenChecklistItem={(id) => openChecklistItemModal(id)}
            streakScore={streakCount}
            notesCount="186"
          />
        )}

        {activeFeature === 'reminders' && (
          <UpcomingEventsCard
            events={upcomingEvents}
            onOpenEventModal={handleOpenEventModal}
            onToggleDone={handleToggleEventDone}
          />
        )}

        {activeFeature === 'monthly' && (
          <MonthlyOverviewCard
            monthName={currentMonthName}
            year={currentYear}
            completedTasks={monthDoneCount}
            totalTasks={monthTotalCount}
            activeGoalsCount={activeMonthlyGoals}
            onPress={() => {
              setActiveFeature(null);
              router.push('/(tabs)/planner');
            }}
          />
        )}

        {activeFeature === 'insights' && (
          <InsightsCard
            insights={dailyInsights}
            onPress={() => {
              setActiveFeature(null);
              router.push('/(tabs)/insights');
            }}
          />
        )}
      </FeatureSheet>

      {/* Task Creation & Edit Modals */}
      <TaskDetailModal 
        key={isTaskModalVisible ? `new-task-${selectedDate}` : 'new-task-closed'}
        visible={isTaskModalVisible}
        onClose={() => setIsTaskModalVisible(false)}
        todoId={null}
        initialDate={selectedDate}
      />
      <TaskDetailModal 
        key={editingTaskId ? `edit-task-${editingTaskId}` : 'edit-task-closed'}
        visible={editingTaskId !== null}
        onClose={() => { setEditingTaskId(null); setEditingTaskSection(undefined); }}
        todoId={editingTaskId}
        initialSection={editingTaskSection}
      />

      {/* Checklist Item Modal */}
      <ChecklistItemModal
        visible={isChecklistItemModalVisible}
        onClose={() => { setIsChecklistItemModalVisible(false); setEditingChecklistItemId(null); }}
        itemId={editingChecklistItemId}
        session={checklistItemSession}
        initialDate={selectedDate}
        candidateTasks={normalizedTodos.map(task => ({ _id: task._id, text: task.text, status: task.status }))}
        onOpenTask={(id) => handleEditTask(id)}
      />

      {/* Event Management Modal */}
      <EventManagementModal
        visible={isEventModalVisible}
        onClose={() => setIsEventModalVisible(false)}
        initialDate={selectedDate}
        eventToEdit={eventToEdit}
        onSaveEvent={handleSaveEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      {/* Focus Timer Modal */}
      <TimerModal
        visible={isFocusTimerModalVisible}
        onClose={() => setFocusTimerModalVisible(false)}
        onSave={handleSaveFocusTimer}
        initialDate={selectedDate}
      />

      {/* Screen Guide Tooltips */}
      <ScreenGuide
        visible={showGuide}
        tips={homeTips}
        onDismiss={dismissGuide}
        isArabic={isArabic}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  floatingCta: {
    position: 'absolute',
    backgroundColor: LIME_ACCENT,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 6,
    zIndex: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  floatingCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.2,
  },
});

export default Index;
