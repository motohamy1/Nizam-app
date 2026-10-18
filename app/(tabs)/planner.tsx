import ScreenBackground from '@/components/ScreenBackground';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Animated, StyleSheet, BackHandler, KeyboardAvoidingView, Platform, FlatList, Share, TextInput, Dimensions, LayoutAnimation, PanResponder, useWindowDimensions, Modal } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { createPlannerStyles } from '@/assets/styles/planner.styles';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { api } from '@/convex/_generated/api';
import TodoInput from '@/components/TodoInput';
import TodoCard from '@/components/TodoCard';
import TimerModal from '@/components/TimerModal';
import ProjectPickerModal from '@/components/ProjectPickerModal';
import ActionModal from '@/components/ActionModal';
import PlannerListModal from '@/components/PlannerListModal';
import { createHomeStyles } from '@/assets/styles/home.styles';
import { Id } from '@/convex/_generated/dataModel';

import { useTranslation } from '@/utils/i18n';
import { useScreenGuide } from '@/hooks/useScreenGuide';
import ScreenGuide from '@/components/ScreenGuide';
import type { GuideTip } from '@/components/ScreenGuide';
import { LIST_TYPE_COLORS } from '@/utils/magicColors';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { ScrollStack, WheelPicker } from '@/components/ScrollStack';
import MonthCreditCard, { getMonthPalette, MONTH_PALETTES } from '@/components/MonthCreditCard';
import LivePress from '@/components/LivePress';
import DayTimelineSchedule from '@/components/DayTimelineSchedule';
import TaskDetailModal from '@/components/TaskDetailModal';
import AnimatedWavyHeader from '@/components/AnimatedWavyHeader';
import { getEffectiveTaskDay } from '@/utils/taskDateUtils';
import PlannerDateBar from '@/components/PlannerDateBar';

const months_en = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

const months_ar = [
  'يناير', 'فبراير', 'مارس', 'أبريل',
  'مايو', 'يونيو', 'يوليو', 'أغسطس',
  'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const weekdays_en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdays_ar = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const fullWeekdays_en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fullWeekdays_ar = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const LIST_TYPE_CARDS = [
  { key: 'checklist', label: 'Checklists', icon: 'checkbox-outline', color: LIST_TYPE_COLORS.checklist },
  { key: 'bullet', label: 'Bullet Points', icon: 'ellipse', color: LIST_TYPE_COLORS.bullet },
  { key: 'toggle', label: 'Toggle Lists', icon: 'albums-outline', color: LIST_TYPE_COLORS.toggle },
];

const Planner = () => {
  const params = useLocalSearchParams<{ year?: string; month?: string; day?: string; from?: string }>();
  const { colors, isDarkMode } = useTheme();
  const { userId, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createPlannerStyles(colors, isArabic);
  const homeStyles = createHomeStyles(colors, isArabic);
  const cardBg = colors.surface;
  const router = useRouter();
  const months = isArabic ? months_ar : months_en;
  const { showGuide, dismissGuide } = useScreenGuide('planner');

  const plannerTips: GuideTip[] = isArabic ? [
    { icon: 'calendar-outline', title: 'اختر شهراً', description: 'اضغط على أي شهر لعرض أيامه ومهامه.', accentColor: '#f6e5c9' },
    { icon: 'eye-outline', title: 'عرض اليوم', description: 'اضغط على يوم لرؤية المهام والملاحظات والتذكيرات.', accentColor: '#defef9' },
    { icon: 'arrow-back-outline', title: 'الرجوع', description: 'اضغط X للعودة إلى عرض الشهور في أي وقت.', accentColor: '#dbd4fd' },
  ] : [
    { icon: 'calendar-outline', title: 'Pick a Month', description: 'Tap any month to view its days and your scheduled tasks.', accentColor: '#f6e5c9' },
    { icon: 'eye-outline', title: 'Day View', description: 'Tap a day to see tasks, notes, and reminders for that date.', accentColor: '#defef9' },
    { icon: 'arrow-back-outline', title: 'Go Back', description: 'Tap the X button to return to the month grid anytime.', accentColor: '#dbd4fd' },
  ];
  
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Sync navigation params from home or external links
  useEffect(() => {
    if (params.month !== undefined && params.day !== undefined) {
      const m = parseInt(params.month, 10);
      const d = parseInt(params.day, 10);
      if (!isNaN(m) && !isNaN(d)) {
        setSelectedMonth(m);
        setSelectedDay(d);
      }
    } else if (params.month !== undefined) {
      const m = parseInt(params.month, 10);
      if (!isNaN(m)) {
        setSelectedMonth(m);
        setSelectedDay(null);
      }
    }
  }, [params.month, params.day]);
  
  const [expandedTodoId, setExpandedTodoId] = useState<Id<"todos"> | null>(null);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Id<"todos"> | null>(null);
  const [dayHubFilter, setDayHubFilter] = useState<'all' | 'tasks' | 'checklists' | 'notes' | 'completed'>('all');
  const [isTimerModalVisible, setTimerModalVisible] = useState(false);
  const [isProjectModalVisible, setProjectModalVisible] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<Id<"todos"> | null>(null);
  
  const [isActionModalVisible, setActionModalVisible] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<any>(null);

  const [plannerListModalVisible, setPlannerListModalVisible] = useState(false);
  const [activePlannerListType, setActivePlannerListType] = useState<string>('checklist');

  // Collapsible section state for day view
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    lists: false,
    reminders: false,
    notes: false,
    tasks: false,
    completed: false,
  });

  const toggleSection = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateTodoStatus = useOfflineMutation(api.todos.updateStatus, "todos:updateStatus");
  const addTodoMutation = useOfflineMutation(api.todos.addTodo, "todos:addTodo");
  const deleteTodoMutation = useOfflineMutation(api.todos.deleteTodo, "todos:deleteTodo");
  const addPlannerItemMutation = useOfflineMutation(api.projects.addPlannerItem, "projects:addPlannerItem");
  const updatePlannerItemMutation = useOfflineMutation(api.projects.updatePlannerItem, "projects:updatePlannerItem");
  const deletePlannerItemMutation = useOfflineMutation(api.projects.deletePlannerItem, "projects:deletePlannerItem");
  const setTimerMutation = useOfflineMutation(api.todos.setTimer, "todos:setTimer");
  const linkProjectMutation = useOfflineMutation(api.todos.linkProject, "todos:linkProject");
  const linkTaskMutation = useOfflineMutation(api.todos.linkTask, "todos:linkTask");
  const scrollViewRef = useRef<ScrollView>(null);

  const { width: screenWidth } = useWindowDimensions();
  const currentYear = new Date().getFullYear();
  const [activeYear, setActiveYear] = useState(currentYear);
  const years = useMemo(() => [currentYear - 1, currentYear, currentYear + 1, currentYear + 2], [currentYear]);
  const currentMonth = new Date().getMonth();
  const [deckMonth, setDeckMonth] = useState(currentMonth);
  const [isYearModalVisible, setYearModalVisible] = useState(false);
  const [openedFromMainWheel, setOpenedFromMainWheel] = useState(false);

  // Available selectable years for the year picker menu (range around current year)
  const selectableYears = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear - 3; y <= currentYear + 4; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  // Year deck palettes: current year wears the live month palette; the others
  // get fixed Bauhaus-variety palettes so each card reads distinctly.
  const yearPalettes = useMemo(
    () => [
      getMonthPalette(4),                       // prev year - platinum slate
      getMonthPalette(currentMonth),            // current year - month palette
      getMonthPalette(7),                       // +1 - emerald waves
      getMonthPalette(9),                       // +2 - sunset amber
    ],
    [currentMonth]
  );

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const handleSelectDayFromWheel = (dayNum: number) => {
    setOpenedFromMainWheel(true);
    setSelectedMonth(deckMonth);
    setSelectedDay(dayNum);
  };

  const isFromHome = params.from === 'home';

  const handleGoBack = () => {
    if (isFromHome) {
      router.replace('/(tabs)');
    } else if (openedFromMainWheel) {
      setOpenedFromMainWheel(false);
      setSelectedDay(null);
      setSelectedMonth(null);
    } else if (selectedDay !== null) {
      setSelectedDay(null);
    } else if (selectedMonth !== null) {
      setSelectedMonth(null);
    }
  };

  const dayViewPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.6;
        const isSignificant = Math.abs(gestureState.dx) > 15;
        if (isArabic) {
          return isHorizontal && isSignificant && gestureState.dx < -15;
        }
        return isHorizontal && isSignificant && gestureState.dx > 15;
      },
      onPanResponderRelease: (_, gestureState) => {
        const isQuickSwipe = Math.abs(gestureState.vx) > 0.35;
        const isLongSwipe = Math.abs(gestureState.dx) > 55;
        const correctDirection = isArabic ? gestureState.dx < -40 : gestureState.dx > 40;

        if ((isQuickSwipe || isLongSwipe) && correctDirection) {
          handleGoBack();
        }
      },
    })
  ).current;

  // Handle system back button ONLY when planner screen is focused
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (selectedDay !== null) {
          handleGoBack();
          return true;
        }
        if (selectedMonth !== null) {
          handleGoBack();
          return true;
        }
        return false; // let default behavior happen
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }, [selectedMonth, selectedDay, isFromHome])
  );

  
  const todos = useOfflineQuery<any[]>('todos', api.todos.get, userId ? { userId } : "skip") || [];

  const selectedDateTs = selectedDay !== null && selectedMonth !== null
    ? new Date(currentYear, selectedMonth, selectedDay).getTime()
    : null;

  const plannerChecklistItems = useOfflineQuery<any[]>('plannerItems_checklist', api.projects.getPlannerItems, selectedDateTs && userId ? { userId, date: selectedDateTs, listType: 'checklist' } : "skip");
  const plannerBulletItems = useOfflineQuery<any[]>('plannerItems_bullet', api.projects.getPlannerItems, selectedDateTs && userId ? { userId, date: selectedDateTs, listType: 'bullet' } : "skip");
  const plannerToggleItems = useOfflineQuery<any[]>('plannerItems_toggle', api.projects.getPlannerItems, selectedDateTs && userId ? { userId, date: selectedDateTs, listType: 'toggle' } : "skip");

  const allGoals = useOfflineQuery<any[]>('yearlyGoals', api.yearlyGoals.getAllGoals, userId ? { userId } : "skip") || [];
  const allAchievements = useOfflineQuery<any[]>('yearlyAchievements', api.yearlyGoals.getAllAchievements, userId ? { userId } : "skip") || [];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getTasksForDay = (day: number, month: number, year: number) => {
    return todos.filter(todo => {
      const effectiveDayTs = getEffectiveTaskDay(todo);
      const todoDate = new Date(effectiveDayTs);
      return todoDate.getDate() === day && 
             todoDate.getMonth() === month && 
             todoDate.getFullYear() === year;
    });
  };

  const resetAll = () => {
    setOpenedFromMainWheel(false);
    setSelectedMonth(null);
    setSelectedDay(null);
  };

  const getTasksForMonth = (monthIndex: number) => {
    return todos.filter(todo => {
      const effectiveDayTs = getEffectiveTaskDay(todo);
      const todoDate = new Date(effectiveDayTs);
      return todoDate.getMonth() === monthIndex && todoDate.getFullYear() === activeYear;
    });
  };

  // Helper: parse checklist stats from description
  const getChecklistStats = (description?: string) => {
    if (!description) return { total: 0, completed: 0 };
    const lines = description.split('\n');
    const todos = lines.filter(l => l.startsWith('☐ ') || l.startsWith('☑ '));
    const completed = lines.filter(l => l.startsWith('☑ ')).length;
    return { total: todos.length, completed };
  };

  const renderMonthGrid = () => {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, paddingTop: 6 }}
      >
        {/* ─── Current Year Combo Card (Dynamic Background by Active/Current Month) ─── */}
        {(() => {
          const activeMonthIndex = selectedMonth !== null ? selectedMonth : deckMonth;
          const activeMonthPalette = getMonthPalette(activeMonthIndex);
          const activeMonthName = months[activeMonthIndex];

          return (
            <View style={{ paddingHorizontal: 16, marginTop: 4, marginBottom: 12 }}>
              <LivePress
                pressScale={0.97}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setYearModalVisible(true);
                }}
                style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: activeMonthPalette.bg,
                  borderRadius: 20,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderWidth: 1.5,
                  borderColor: activeMonthPalette.ink + '20',
                  shadowColor: activeMonthPalette.ink,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.18,
                  shadowRadius: 12,
                  elevation: 4,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: activeMonthPalette.ink + '15',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: activeMonthPalette.ink + '22',
                    }}
                  >
                    <Ionicons name="calendar" size={22} color={activeMonthPalette.accent} />
                  </View>
                  <View>
                    <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: '900',
                          color: activeMonthPalette.ink,
                          letterSpacing: -0.4,
                        }}
                      >
                        {activeYear}
                      </Text>

                      {/* Active Month Indicator Pill */}
                      <View
                        style={{
                          flexDirection: isArabic ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          gap: 4.5,
                          paddingHorizontal: 8,
                          paddingVertical: 2.5,
                          borderRadius: 8,
                          backgroundColor: activeMonthPalette.ink + '16',
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: activeMonthPalette.accent,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '800',
                            color: activeMonthPalette.ink,
                          }}
                        >
                          {activeMonthName}
                        </Text>
                      </View>

                      {/* Current Year Badge */}
                      {activeYear === currentYear && (
                        <View
                          style={{
                            paddingHorizontal: 7,
                            paddingVertical: 2.5,
                            borderRadius: 8,
                            backgroundColor: activeMonthPalette.ink + '14',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '800',
                              color: activeMonthPalette.ink,
                              opacity: 0.9,
                            }}
                          >
                            {isArabic ? 'السنة الحالية' : 'Current Year'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: activeMonthPalette.ink,
                        opacity: 0.75,
                        marginTop: 3,
                      }}
                    >
                      {isArabic
                        ? `شهر ${activeMonthName} • اضغط لاختيار أو تغيير السنة`
                        : `${activeMonthName} • Tap to switch year`}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    backgroundColor: activeMonthPalette.ink + '14',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={activeMonthPalette.ink}
                    style={{ opacity: 0.85 }}
                  />
                </View>
              </LivePress>
            </View>
          );
        })()}

        {/* ─── Year focus capsules: Goals & To-dos (left) | Achievements (right) ─── */}
        {(() => {
          const py = yearPalettes[Math.max(0, years.indexOf(activeYear))] ?? getMonthPalette(0);
          const ach = isDarkMode
            ? { bg: '#D97706', ink: '#FFFFFF', accent: '#FDE047', shadow: '#B45309' }
            : { bg: '#F59E0B', ink: '#FFFFFF', accent: '#FEF08A', shadow: '#D97706' };
          const cardBase: any = {
            flex: 1,
            height: 140,
            borderRadius: 22,
            padding: 16,
            justifyContent: 'space-between',
            shadowOpacity: 0.22,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
          };
          return (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, paddingHorizontal: 16 }}>
              {/* Goals & To-dos — wears the focused year's palette */}
              <LivePress
                style={[cardBase, { backgroundColor: py.bg, shadowColor: py.ink }]}
                pressScale={0.96}
                onPress={() => router.push({
                  pathname: '/year-section',
                  params: { kind: 'goals', year: String(activeYear) },
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: py.ink + '15', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="flag-outline" size={20} color={py.accent} />
                  </View>
                  <View style={{ width: 26, height: 26, borderRadius: 9, backgroundColor: py.ink + '12', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name={isArabic ? 'chevron-back' : 'chevron-forward'} size={15} color={py.ink} style={{ opacity: 0.8 }} />
                  </View>
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '900', letterSpacing: -0.2, color: py.ink }} numberOfLines={1}>
                    {isArabic ? 'الأهداف والمهام' : 'Goals & To-dos'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: py.ink + '18' }}>
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: py.ink, letterSpacing: 0.3 }}>
                        {isArabic ? 'قريبًا' : 'SOON'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: py.ink, opacity: 0.75 }} numberOfLines={1}>
                      {isArabic ? 'اضغط للاكتشاف' : 'Tap to discover'}
                    </Text>
                  </View>
                </View>
              </LivePress>

              {/* Achievements — vibrant gold / orange palette */}
              <LivePress
                style={[cardBase, { backgroundColor: ach.bg, shadowColor: ach.shadow }]}
                pressScale={0.96}
                onPress={() => router.push({
                  pathname: '/year-section',
                  params: { kind: 'achievements', year: String(activeYear) },
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255, 255, 255, 0.22)', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="trophy" size={20} color={ach.accent} />
                  </View>
                  <View style={{ width: 26, height: 26, borderRadius: 9, backgroundColor: 'rgba(255, 255, 255, 0.18)', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name={isArabic ? 'chevron-back' : 'chevron-forward'} size={15} color={ach.ink} style={{ opacity: 0.9 }} />
                  </View>
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '900', letterSpacing: -0.2, color: ach.ink }} numberOfLines={1}>
                    {isArabic ? 'الإنجازات' : 'Achievements'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.22)' }}>
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: ach.ink, letterSpacing: 0.3 }}>
                        {isArabic ? 'قريبًا' : 'SOON'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: ach.ink, opacity: 0.85 }} numberOfLines={1}>
                      {isArabic ? 'اضغط للاكتشاف' : 'Tap to discover'}
                    </Text>
                  </View>
                </View>
              </LivePress>
            </View>
          );
        })()}

        {/* ─── Day / Date Wheel (above the months card) ─── */}
        <PlannerDateBar
          month={deckMonth}
          year={activeYear}
          todos={todos}
          onSelectDay={handleSelectDayFromWheel}
          selectedDay={selectedDay}
          isArabic={isArabic}
        />

        {/* ─── Horizontal Rolodex Deck (Months Card) ─── */}
        <ScrollStack
          isArabic={isArabic}
          labels={months}
          initialIndex={currentMonth}
          palettes={MONTH_PALETTES}
          axis="horizontal"
          sideCardVariant="capsule"
          cardInset={screenWidth * 0.032 + 14.98}
          autoReturnIndex={currentMonth}
          autoReturnDelay={5000}
          onCardChange={(idx) => setDeckMonth(idx)}
          style={{ marginTop: 10, marginBottom: 28 }}
        >
          {months.map((monthName, idx) => {
            const monthTasks = getTasksForMonth(idx);
            const completedMonthTasks = monthTasks.filter((task) => task.status === 'done').length;
            return (
              <MonthCreditCard
                key={monthName}
                month={monthName}
                monthIndex={idx}
                year={activeYear}
                taskCount={monthTasks.length}
                completionRate={monthTasks.length > 0 ? Math.round((completedMonthTasks / monthTasks.length) * 100) : 0}
                isCurrent={idx === currentMonth && activeYear === currentYear}
                isArabic={isArabic}
                palette={getMonthPalette(idx)}
                currentLabel={t.current}
                tasksLabel={monthTasks.length === 1 ? t.task : t.tasksThisMonth}
                emptyLabel={t.empty}
                onPress={() => setSelectedMonth(idx)}
              />
            );
          })}
        </ScrollStack>

        {/* ─── Year Selection Menu Modal ─── */}
        <Modal
          visible={isYearModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setYearModalVisible(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
            activeOpacity={1}
            onPress={() => setYearModalVisible(false)}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 340,
                backgroundColor: colors.surface,
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
              }}
              onStartShouldSetResponder={() => true}
            >
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                    {isArabic ? 'اختر السنة' : 'Select Year'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setYearModalVisible(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="close" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Year list */}
              <View style={{ gap: 8 }}>
                {selectableYears.map((yearItem) => {
                  const isSelected = yearItem === activeYear;
                  const isCurYear = yearItem === currentYear;
                  return (
                    <LivePress
                      key={yearItem}
                      pressScale={0.96}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveYear(yearItem);
                        setYearModalVisible(false);
                      }}
                      style={{
                        flexDirection: isArabic ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 14,
                        backgroundColor: isSelected
                          ? (isDarkMode ? 'rgba(255, 92, 22, 0.16)' : 'rgba(255, 92, 22, 0.10)')
                          : (isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'),
                        borderWidth: isSelected ? 1.5 : 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }}
                    >
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                        <Text
                          style={{
                            fontSize: 17,
                            fontWeight: isSelected ? '900' : '700',
                            color: isSelected ? colors.primary : colors.text,
                          }}
                        >
                          {yearItem}
                        </Text>
                        {isCurYear && (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 6,
                              backgroundColor: colors.primary + '18',
                            }}
                          >
                            <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.primary }}>
                              {isArabic ? 'الحالية' : 'Current'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </LivePress>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    );
  };

  const renderDayGrid = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(monthIndex, currentYear);
    const palette = getMonthPalette(monthIndex);
    const monthTasks = getTasksForMonth(monthIndex);
    const completedMonthTasks = monthTasks.filter(t => t.status === 'done');
    const inProgressTasks = monthTasks.filter(t => t.status === 'in_progress');
    const notDoneTasks = monthTasks.filter(t => t.status === 'not_done' || (t.status === 'not_started' && t.dueDate && new Date(t.dueDate).setHours(23, 59, 59, 999) < Date.now()));
    const pendingTasks = monthTasks.filter(t => t.status !== 'done' && !notDoneTasks.includes(t));

    const monthGoalDocs = allGoals.filter((g: any) => g.year === currentYear && g.month === monthIndex && g.day === undefined);
    const completedGoals = monthGoalDocs.filter((g: any) => g.isCompleted);
    const incompleteGoals = monthGoalDocs.filter((g: any) => !g.isCompleted);

    let totalGoalMilestones = 0;
    let completedGoalMilestones = 0;
    monthGoalDocs.forEach((doc: any) => {
      const stats = getChecklistStats(doc.description);
      totalGoalMilestones += stats.total;
      completedGoalMilestones += stats.completed;
    });

    const monthAchievementDocs = allAchievements.filter((a: any) => a.year === currentYear && a.month === monthIndex && a.day === undefined);
    const completedAchievements = monthAchievementDocs.filter((a: any) => a.isCompleted);
    const pendingAchievements = monthAchievementDocs.filter((a: any) => !a.isCompleted);

    // Track active days in this month
    const activeDaysSet = new Set<number>();
    monthTasks.forEach((t: any) => {
      if (t.date) {
        const d = new Date(t.date);
        if (d.getMonth() === monthIndex && d.getFullYear() === currentYear) {
          activeDaysSet.add(d.getDate());
        }
      }
    });
    const activeDaysCount = activeDaysSet.size;

    const totalTracked = monthTasks.length + monthGoalDocs.length + monthAchievementDocs.length;
    const totalFinished = completedMonthTasks.length + completedGoals.length + completedAchievements.length;
    const overallPct = totalTracked > 0 ? Math.round((totalFinished / totalTracked) * 100) : 0;

    const highPriorityTasks = monthTasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
    const highPriorityDone = highPriorityTasks.filter(t => t.status === 'done');

    let totalGoalsCount = 0;
    let completedGoalsCount = 0;
    monthGoalDocs.forEach((doc: any) => {
      const stats = getChecklistStats(doc.description);
      totalGoalsCount += stats.total;
      completedGoalsCount += stats.completed;
    });
    if (totalGoalsCount === 0 && monthGoalDocs.length > 0) {
      totalGoalsCount = monthGoalDocs.length;
      completedGoalsCount = monthGoalDocs.filter((d: any) => d.isCompleted).length;
    }

    const goalProgress = totalGoalsCount > 0 ? completedGoalsCount / totalGoalsCount : 0;
    const achievementCount = monthAchievementDocs.length;
    const totalTasksCount = monthTasks.length;
    const completedTasksCount = completedMonthTasks.length;
    const taskProgress = totalTasksCount > 0 ? completedTasksCount / totalTasksCount : 0;

    return (
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, paddingTop: 10 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Current Month Summary Card ─── */}
        <LivePress
          style={[
            styles.monthGoalsCardNew,
            {
              backgroundColor: palette.bg,
              borderColor: palette.ink + '20',
              shadowColor: palette.ink,
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 5,
              marginBottom: 14,
            }
          ]}
          onPress={() => router.push({
            pathname: '/goals-detail',
            params: {
              year: currentYear.toString(),
              month: monthIndex.toString(),
              title: isArabic ? `أهداف ${months[monthIndex]}` : `${months[monthIndex]} Goals`,
            }
          })}
          pressScale={0.96}
        >
          {/* Header row: Month & Year Pill + Edit icon button */}
          <View style={[styles.monthGoalsHeaderRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.monthGoalsTitleText, { color: palette.ink }]}>
                {months[monthIndex]} {currentYear}
              </Text>
              {monthIndex === currentMonth && (
                <View style={[styles.monthGoalsPill, { backgroundColor: palette.ink + '18' }]}>
                  <Text style={[styles.monthGoalsPillText, { color: palette.ink }]}>{t.current}</Text>
                </View>
              )}
            </View>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: palette.ink + '14',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Ionicons name="create-outline" size={16} color={palette.ink} />
            </View>
          </View>

          {/* 3 Stats Capsules: Tasks, Goals, Achievements */}
          <View style={[styles.monthStatsRow, isArabic && { flexDirection: 'row-reverse' }]}>
            {/* Tasks Capsule */}
            <View style={[styles.monthStatCapsule, { backgroundColor: palette.ink + '0E', borderColor: palette.ink + '18' }]}>
              <Ionicons name="checkbox-outline" size={16} color={palette.ink} />
              <Text style={[styles.monthStatValueText, { color: palette.ink }]}>
                {totalTasksCount > 0 ? `${completedTasksCount}/${totalTasksCount}` : '0'}
              </Text>
              <Text style={[styles.monthStatLabelText, { color: palette.ink + 'B3' }]} numberOfLines={1}>
                {isArabic ? 'المهام' : 'Tasks'}
              </Text>
            </View>

            {/* Goals Capsule */}
            <View style={[styles.monthStatCapsule, { backgroundColor: palette.ink + '0E', borderColor: palette.ink + '18' }]}>
              <Ionicons name="flag-outline" size={16} color={palette.ink} />
              <Text style={[styles.monthStatValueText, { color: palette.ink }]}>
                {totalGoalsCount > 0 ? `${completedGoalsCount}/${totalGoalsCount}` : '—'}
              </Text>
              <Text style={[styles.monthStatLabelText, { color: palette.ink + 'B3' }]} numberOfLines={1}>
                {isArabic ? 'الأهداف' : 'Goals'}
              </Text>
            </View>

            {/* Achievements Capsule */}
            <View style={[styles.monthStatCapsule, { backgroundColor: palette.ink + '0E', borderColor: palette.ink + '18' }]}>
              <Ionicons name="trophy-outline" size={16} color={palette.ink} />
              <Text style={[styles.monthStatValueText, { color: palette.ink }]}>
                {achievementCount}
              </Text>
              <Text style={[styles.monthStatLabelText, { color: palette.ink + 'B3' }]} numberOfLines={1}>
                {isArabic ? 'إنجازات' : 'Achievements'}
              </Text>
            </View>
          </View>

          {/* Progress Bar & Completion Stat */}
          {totalGoalsCount > 0 || totalTasksCount > 0 ? (
            <View style={[styles.monthProgressContainer, isArabic && { alignItems: 'flex-end' }]}>
              <View style={[styles.monthProgressBarTrack, { backgroundColor: palette.ink + '1A', width: '100%' }]}>
                <View style={[
                  styles.monthProgressBarFill,
                  {
                    width: `${totalGoalsCount > 0 ? goalProgress * 100 : taskProgress * 100}%`,
                    backgroundColor: palette.accent,
                  }
                ]} />
              </View>
              <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 2 }}>
                <Text style={[styles.monthProgressText, { color: palette.ink }]}>
                  {totalGoalsCount > 0 
                    ? `${Math.round(goalProgress * 100)}% ${t.goalCompleted || 'complete'}` 
                    : `${Math.round(taskProgress * 100)}% ${isArabic ? 'مهام مكتملة' : 'tasks done'}`}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: palette.ink + '99' }}>
                  {isArabic ? 'اضغط للتفاصيل' : 'Tap for details'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={{ textAlign: 'center', color: palette.ink + '99', fontSize: 12, fontWeight: '700', marginTop: 4 }}>
              {isArabic ? 'اضغط لتحديد أهداف الشهر' : 'Tap to set monthly goals'}
            </Text>
          )}
        </LivePress>

        {/* ─── 2. AI UI Card: Generate Goals & Achievements ─── */}
        <LivePress
          style={[
            styles.aiMonthCard,
            {
              backgroundColor: isDarkMode ? '#1B182B' : '#FAF5FF',
              borderColor: isDarkMode ? '#8B5CF645' : '#7C3AED30',
              shadowColor: '#8B5CF6',
            }
          ]}
          onPress={() => router.push({
            pathname: '/goals-detail',
            params: {
              year: currentYear.toString(),
              month: monthIndex.toString(),
              autoAI: 'true',
              title: isArabic ? `أهداف ${months[monthIndex]} ${currentYear}` : `${months[monthIndex]} ${currentYear} Goals`,
            }
          })}
          pressScale={0.97}
        >
          <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: isDarkMode ? '#8B5CF630' : '#8B5CF618',
                borderWidth: 1,
                borderColor: '#8B5CF650',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Ionicons name="sparkles" size={20} color="#8B5CF6" />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                  {isArabic ? 'توليد الأهداف والإنجازات' : 'AI Goal & Win Generator'}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>
                  {isArabic ? 'مساعد التخطيط الذكي لشهر ' + months[monthIndex] : `Smart Blueprint Studio for ${months[monthIndex]}`}
                </Text>
              </View>
            </View>

            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: '#8B5CF620',
              borderWidth: 1,
              borderColor: '#8B5CF640',
            }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#8B5CF6' }}>
                AI PRO
              </Text>
            </View>
          </View>

          <Text style={[{
            fontSize: 12,
            color: colors.textMuted,
            lineHeight: 18,
            marginBottom: 12,
            textAlign: isArabic ? 'right' : 'left'
          }]}>
            {isArabic
              ? 'أنشئ خطة شهرية متكاملة تشمل الأهداف، المحطات، والمهام بنقرة واحدة باستخدام الذكاء الاصطناعي.'
              : 'Build an end-to-end monthly roadmap with actionable milestones, checklists, and achievements in seconds.'}
          </Text>

          <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                <Ionicons name="flash-outline" size={11} color="#8B5CF6" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>
                  {isArabic ? 'توليد فوري' : 'Instant Plan'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                <Ionicons name="trophy-outline" size={11} color="#F59E0B" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>
                  {isArabic ? 'إنجازات تلقائية' : 'Auto Wins'}
                </Text>
              </View>
            </View>

            <View style={[{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#8B5CF6',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
            }, isArabic && { flexDirection: 'row-reverse' }]}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                {isArabic ? 'ابدأ الآن' : 'Generate'}
              </Text>
              <Ionicons name={isArabic ? "arrow-back" : "arrow-forward"} size={13} color="#FFFFFF" />
            </View>
          </View>
        </LivePress>

        {/* ─── 3. Detailed Month Summary Card ─── */}
        <View style={styles.monthSummaryCardDetailed}>
          {/* Header with Title & Overall Completion Badge */}
          <View style={[styles.monthSummaryHeaderRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary + '18', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="pie-chart" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.monthSummaryTitle}>
                  {isArabic ? 'التحليلات التفصيلية للشهر' : 'Detailed Month Performance'}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>
                  {isArabic ? `إحصائيات شاملة لشهر ${months[monthIndex]}` : `Comprehensive analytics for ${months[monthIndex]}`}
                </Text>
              </View>
            </View>

            {totalTracked > 0 && (
              <View style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
                backgroundColor: overallPct >= 80 ? '#10B98120' : colors.primary + '18',
                borderWidth: 1,
                borderColor: overallPct >= 80 ? '#10B98150' : colors.primary + '40',
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: overallPct >= 80 ? '#10B981' : colors.primary,
                }}>
                  {overallPct}% {isArabic ? 'مكتمل' : 'Done'}
                </Text>
              </View>
            )}
          </View>

          {/* Overall Progress Gauge */}
          {totalTracked > 0 && (
            <View style={{ marginVertical: 8 }}>
              <View style={{ height: 7, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{
                  width: `${overallPct}%`,
                  height: '100%',
                  backgroundColor: overallPct >= 80 ? '#10B981' : colors.primary,
                  borderRadius: 4,
                }} />
              </View>
              <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }, isArabic && { flexDirection: 'row-reverse' }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>
                  {isArabic ? `${totalFinished} من ${totalTracked} نشاط مسجل منجز` : `${totalFinished} of ${totalTracked} tracked activities done`}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                  {totalTracked - totalFinished > 0 
                    ? (isArabic ? `${totalTracked - totalFinished} متبقي` : `${totalTracked - totalFinished} remaining`) 
                    : (isArabic ? 'مكتمل بالكامل 🎉' : 'All Complete! 🎉')}
                </Text>
              </View>
            </View>
          )}

          {/* 4 Detailed Metric Tiles (2x2 Grid) */}
          <View style={styles.monthDetailedMetricsGrid}>
            {/* Tile 1: Tasks Completion */}
            <View style={styles.monthDetailedMetricBox}>
              <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }, isArabic && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="checkbox" size={18} color="#10B981" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>
                  {monthTasks.length > 0 ? `${Math.round((completedMonthTasks.length / monthTasks.length) * 100)}%` : '0%'}
                </Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: '900', color: colors.text }}>
                {completedMonthTasks.length} / {monthTasks.length}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 1 }}>
                {isArabic ? 'المهام المنجزة' : 'Tasks Finished'}
              </Text>
            </View>

            {/* Tile 2: Goals & Milestones */}
            <View style={styles.monthDetailedMetricBox}>
              <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }, isArabic && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="flag" size={18} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                  {monthGoalDocs.length > 0 ? `${Math.round((completedGoals.length / monthGoalDocs.length) * 100)}%` : '0%'}
                </Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: '900', color: colors.text }}>
                {completedGoals.length} / {monthGoalDocs.length}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 1 }}>
                {isArabic ? 'الأهداف المحققة' : 'Goals Met'}
              </Text>
            </View>

            {/* Tile 3: Achievements & Wins */}
            <View style={styles.monthDetailedMetricBox}>
              <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }, isArabic && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="trophy" size={18} color="#F59E0B" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>
                  {completedAchievements.length > 0 ? `+${completedAchievements.length}` : '—'}
                </Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: '900', color: colors.text }}>
                {completedAchievements.length}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 1 }}>
                {isArabic ? 'إنجازات مكتسبة' : 'Wins Reached'}
              </Text>
            </View>

            {/* Tile 4: Productive Days */}
            <View style={styles.monthDetailedMetricBox}>
              <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }, isArabic && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="calendar-outline" size={18} color="#6366F1" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: "#6366F1" }}>
                  {Math.round((activeDaysCount / daysInMonth) * 100)}%
                </Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: '900', color: colors.text }}>
                {activeDaysCount} / {daysInMonth}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 1 }}>
                {isArabic ? 'أيام النشاط' : 'Active Days'}
              </Text>
            </View>
          </View>

          {/* Status Breakdown List */}
          <View style={{ gap: 6, marginTop: 4 }}>
            {completedMonthTasks.length > 0 && (
              <View style={[
                styles.monthSummaryItem, 
                { backgroundColor: '#10B98112', borderColor: '#10B98130' },
                isArabic && { flexDirection: 'row-reverse' }
              ]}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={[styles.monthSummaryItemText, { color: '#10B981' }, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'مهام مكتملة بنجاح' : 'Tasks Completed'}
                </Text>
                <Text style={[styles.monthSummaryItemCount, { color: '#10B981' }]}>
                  {completedMonthTasks.length}
                </Text>
              </View>
            )}

            {inProgressTasks.length > 0 && (
              <View style={[
                styles.monthSummaryItem, 
                { backgroundColor: '#3B82F612', borderColor: '#3B82F630' },
                isArabic && { flexDirection: 'row-reverse' }
              ]}>
                <Ionicons name="time" size={16} color="#3B82F6" />
                <Text style={[styles.monthSummaryItemText, { color: '#3B82F6' }, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'مهام قيد التنفيذ' : 'Tasks In Progress'}
                </Text>
                <Text style={[styles.monthSummaryItemCount, { color: '#3B82F6' }]}>
                  {inProgressTasks.length}
                </Text>
              </View>
            )}

            {notDoneTasks.length > 0 && (
              <View style={[
                styles.monthSummaryItem, 
                { backgroundColor: '#EF444412', borderColor: '#EF444430' },
                isArabic && { flexDirection: 'row-reverse' }
              ]}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={[styles.monthSummaryItemText, { color: '#EF4444' }, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'مهام متأخرة أو لم تُنجز' : 'Tasks Pending / Overdue'}
                </Text>
                <Text style={[styles.monthSummaryItemCount, { color: '#EF4444' }]}>
                  {notDoneTasks.length}
                </Text>
              </View>
            )}

            {completedGoals.length > 0 && (
              <View style={[
                styles.monthSummaryItem, 
                { backgroundColor: colors.primary + '12', borderColor: colors.primary + '25' },
                isArabic && { flexDirection: 'row-reverse' }
              ]}>
                <Ionicons name="flag" size={16} color={colors.primary} />
                <Text style={[styles.monthSummaryItemText, { color: colors.primary }, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'أهداف محققة' : 'Goals Achieved'}
                </Text>
                <Text style={[styles.monthSummaryItemCount, { color: colors.primary }]}>
                  {completedGoals.length}
                </Text>
              </View>
            )}

            {incompleteGoals.length > 0 && (
              <View style={[
                styles.monthSummaryItem, 
                { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border },
                isArabic && { flexDirection: 'row-reverse' }
              ]}>
                <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.monthSummaryItemText, { color: colors.textMuted }, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'أهداف متبقية في الخطة' : 'Goals In Progress'}
                </Text>
                <Text style={[styles.monthSummaryItemCount, { color: colors.textMuted }]}>
                  {incompleteGoals.length}
                </Text>
              </View>
            )}

            {completedAchievements.length > 0 && (
              <View style={[
                styles.monthSummaryItem, 
                { backgroundColor: '#F59E0B15', borderColor: '#F59E0B30' },
                isArabic && { flexDirection: 'row-reverse' }
              ]}>
                <Ionicons name="trophy" size={16} color="#F59E0B" />
                <Text style={[styles.monthSummaryItemText, { color: '#F59E0B' }, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'إنجازات محققة' : 'Achievements Reached'}
                </Text>
                <Text style={[styles.monthSummaryItemCount, { color: '#F59E0B' }]}>
                  {completedAchievements.length}
                </Text>
              </View>
            )}

            {highPriorityTasks.length > 0 && (
              <View style={[
                styles.monthSummaryItem, 
                { backgroundColor: '#EC489912', borderColor: '#EC489930' },
                isArabic && { flexDirection: 'row-reverse' }
              ]}>
                <Ionicons name="flame" size={16} color="#EC4899" />
                <Text style={[styles.monthSummaryItemText, { color: '#EC4899' }, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'المهام عالية الأهمية المنجزة' : 'High Priority Completed'}
                </Text>
                <Text style={[styles.monthSummaryItemCount, { color: '#EC4899' }]}>
                  {highPriorityDone.length}/{highPriorityTasks.length}
                </Text>
              </View>
            )}

            {totalTracked === 0 && (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <Ionicons name="sparkles-outline" size={24} color={colors.textMuted} style={{ marginBottom: 6 }} />
                <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '600', textAlign: 'center' }}>
                  {isArabic ? 'لا توجد بيانات مسجلة لهذا الشهر بعد.\nاستخدم الاستوديو الذكي بالأعلى لبدء التخطيط!' : 'No recorded activity for this month yet.\nUse the AI Studio above to start planning!'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  const getPlannerListCount = (key: string) => {
    if (key === 'checklist') return plannerChecklistItems?.length || 0;
    if (key === 'bullet') return plannerBulletItems?.length || 0;
    if (key === 'toggle') return plannerToggleItems?.length || 0;
    return 0;
  };

  const openPlannerListModal = (listType: string) => {
    setActivePlannerListType(listType);
    setPlannerListModalVisible(true);
  };

  const renderSpecificDayView = (day: number, month: number, year: number) => {
    const tasks = getTasksForDay(day, month, year);
    const selectedDateTs = new Date(year, month, day).getTime();
    const palette = getMonthPalette(month);
    const dayOfWeekIndex = new Date(year, month, day).getDay();
    const weekdayName = isArabic ? fullWeekdays_ar[dayOfWeekIndex] : fullWeekdays_en[dayOfWeekIndex];

    const activeTasks = tasks.filter(t => t.type !== 'note' && t.type !== 'reminder' && t.status !== 'done');
    const completedTasks = tasks.filter(t => t.type !== 'note' && t.type !== 'reminder' && t.status === 'done');
    const reminderTasks = tasks.filter(t => t.type === 'reminder');
    const noteTasks = tasks.filter(t => t.type === 'note');

    return (
      <ScrollView 
        ref={scrollViewRef} 
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }} 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Day Glance Header ─── */}
        <View style={[styles.specificDayHeaderNew, isArabic && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.specificDayDateGroup, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={styles.specificDayTitleNew}>
              {day} {months[month]} {year}
            </Text>
            <View style={[styles.specificDayWeekdayPill, isArabic && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="calendar" size={12} color={colors.primary} />
              <Text style={styles.specificDayWeekdayText}>{weekdayName}</Text>
            </View>
          </View>
          
          <View style={styles.specificDayTaskCountBadge}>
            <Text style={styles.specificDayTaskCountNumber}>{activeTasks.length}</Text>
            <Text style={styles.specificDayTaskCountLabel}>
              {activeTasks.length === 1 ? (isArabic ? 'مهمة' : 'task') : (isArabic ? 'مهام' : 'tasks')}
            </Text>
          </View>
        </View>

        {/* ─── Daily Goals & Progress Card (Harmonized with Month Palette) ─── */}
        {(() => {
          const dayGoalDocs = allGoals.filter((g: any) => g.year === year && g.month === month && g.day === day);
          const dayAchievementDocs = allAchievements.filter((a: any) => a.year === year && a.month === month && a.day === day);

          let totalGoals = 0;
          let completedGoals = 0;
          dayGoalDocs.forEach((doc: any) => {
            const stats = getChecklistStats(doc.description);
            totalGoals += stats.total;
            completedGoals += stats.completed;
          });
          if (totalGoals === 0 && dayGoalDocs.length > 0) {
            totalGoals = dayGoalDocs.length;
            completedGoals = dayGoalDocs.filter((d: any) => d.isCompleted).length;
          }

          const goalProgress = totalGoals > 0 ? completedGoals / totalGoals : 0;
          const achievementCount = dayAchievementDocs.length;
          const totalDayTasks = tasks.length;
          const completedDayTasksCount = completedTasks.length;
          const taskProgress = totalDayTasks > 0 ? completedDayTasksCount / totalDayTasks : 0;

          return (
            <LivePress
              style={[
                styles.dayGoalsCompactCard,
                {
                  backgroundColor: palette.bg,
                  borderColor: palette.ink + '20',
                  shadowColor: palette.ink,
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  elevation: 3,
                }
              ]}
              onPress={() => router.push({
                pathname: '/goals-detail',
                params: {
                  year: year.toString(),
                  month: month.toString(),
                  day: day.toString(),
                  title: isArabic ? `أهداف ${day} ${months[month]}` : `${months[month]} ${day} Goals`,
                }
              })}
              pressScale={0.97}
            >
              <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, isArabic && { flexDirection: 'row-reverse' }]}>
                {/* Left Section: 3 Inline Stats + Mini Progress Bar */}
                <View style={{ flex: 1, gap: 6 }}>
                  {/* Row of 3 compact stat pills */}
                  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, isArabic && { flexDirection: 'row-reverse' }]}>
                    {/* Tasks Capsule */}
                    <View style={[{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: palette.ink + '10',
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 8,
                    }, isArabic && { flexDirection: 'row-reverse' }]}>
                      <Ionicons name="checkbox-outline" size={13} color={palette.ink} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: palette.ink }}>
                        {totalDayTasks > 0 ? `${completedDayTasksCount}/${totalDayTasks}` : '0'}
                      </Text>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: palette.ink + 'B3' }}>
                        {isArabic ? 'مهام' : 'Tasks'}
                      </Text>
                    </View>

                    {/* Goals Capsule */}
                    <View style={[{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: palette.ink + '10',
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 8,
                    }, isArabic && { flexDirection: 'row-reverse' }]}>
                      <Ionicons name="flag-outline" size={13} color={palette.ink} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: palette.ink }}>
                        {totalGoals > 0 ? `${completedGoals}/${totalGoals}` : '—'}
                      </Text>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: palette.ink + 'B3' }}>
                        {isArabic ? 'أهداف' : 'Goals'}
                      </Text>
                    </View>

                    {/* Achievements Capsule */}
                    <View style={[{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: palette.ink + '10',
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 8,
                    }, isArabic && { flexDirection: 'row-reverse' }]}>
                      <Ionicons name="trophy-outline" size={13} color={palette.ink} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: palette.ink }}>
                        {achievementCount}
                      </Text>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: palette.ink + 'B3' }}>
                        {isArabic ? 'إنجازات' : 'Wins'}
                      </Text>
                    </View>
                  </View>

                  {/* Slim Progress Bar */}
                  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={{ flex: 1, height: 4, backgroundColor: palette.ink + '18', borderRadius: 2, overflow: 'hidden' }}>
                      <View style={[
                        {
                          width: `${totalGoals > 0 ? goalProgress * 100 : taskProgress * 100}%`,
                          height: '100%',
                          backgroundColor: palette.accent,
                          borderRadius: 2,
                        }
                      ]} />
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: palette.ink + 'CC' }}>
                      {totalGoals > 0
                        ? `${Math.round(goalProgress * 100)}%`
                        : `${Math.round(taskProgress * 100)}%`}
                    </Text>
                  </View>
                </View>

                {/* Right Section: Small AI Goal Generation Button */}
                <LivePress
                  style={{
                    flexDirection: isArabic ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 10,
                    backgroundColor: palette.ink,
                    shadowColor: palette.ink,
                    shadowOpacity: 0.22,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    router.push({
                      pathname: '/goals-detail',
                      params: {
                        year: year.toString(),
                        month: month.toString(),
                        day: day.toString(),
                        autoAI: 'true',
                        title: isArabic ? `أهداف ${day} ${months[month]}` : `${months[month]} ${day} Goals`,
                      }
                    });
                  }}
                  pressScale={0.94}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>
                    {isArabic ? 'هدف ذكي' : 'AI Goal'}
                  </Text>
                </LivePress>
              </View>
            </LivePress>
          );
        })()}

        {/* ─── Day Timeline & Schedule Section (Directly under Goals) ─── */}
        <DayTimelineSchedule
          year={year}
          month={month}
          day={day}
          selectedDateTs={selectedDateTs}
          tasks={tasks}
          checklistItems={plannerChecklistItems || []}
          bulletItems={plannerBulletItems || []}
          toggleItems={plannerToggleItems || []}
          isArabic={isArabic}
          t={t}
          onToggleTodo={(id, currentStatus) => {
            updateTodoStatus({ id, status: currentStatus === 'done' ? 'not_started' : 'done' });
          }}
          onTogglePlannerItem={(id, isCompleted) => {
            updatePlannerItemMutation({ id, isCompleted: !isCompleted });
          }}
          onDeleteTodo={(id) => {
            deleteTodoMutation({ id });
          }}
          onDeletePlannerItem={(id) => {
            deletePlannerItemMutation({ id });
          }}
          onAddTodo={async (payload) => {
            if (!userId) return;
            return await addTodoMutation({
              userId,
              ...payload,
            });
          }}
          onAddPlannerItem={async (payload) => {
            if (!userId) return;
            return await addPlannerItemMutation({
              userId,
              ...payload,
            });
          }}
          onOpenTaskDetails={(todoId) => {
            setSelectedTaskForModal(todoId);
          }}
        />

        {/* ─── Dynamic Live Day Summary Card ─── */}
        {(() => {
          const dayGoalDocs = allGoals.filter((g: any) => g.year === year && g.month === month && g.day === day);
          const dayAchievementDocs = allAchievements.filter((a: any) => a.year === year && a.month === month && a.day === day);
          
          const completedTasks = tasks.filter(t => t.status === 'done');
          const pendingTasks = tasks.filter(t => t.status !== 'done');
          const completedGoals = dayGoalDocs.filter((g: any) => g.isCompleted);

          const totalTrackedItems = tasks.length + dayGoalDocs.length;
          const totalCompleted = completedTasks.length + completedGoals.length;
          const completionPct = totalTrackedItems > 0 ? Math.round((totalCompleted / totalTrackedItems) * 100) : 0;

          return (
            <View style={[styles.monthSummaryCardNew, { marginTop: 6, marginBottom: 28 }]}>
              {/* Header with Title & Completion Rate Badge */}
              <View style={[styles.monthSummaryHeaderRow, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.primary + '18', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="pie-chart" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.monthSummaryTitle}>
                    {t.daySummary || (isArabic ? 'ملخص اليوم' : 'Day Summary')}
                  </Text>
                </View>

                {totalTrackedItems > 0 && (
                  <View style={{
                    flexDirection: isArabic ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor: completionPct === 100 ? '#10B98120' : colors.primary + '18',
                    borderWidth: 1,
                    borderColor: completionPct === 100 ? '#10B981' : colors.primary + '40',
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: completionPct === 100 ? '#10B981' : colors.primary,
                    }}>
                      {completionPct}% {isArabic ? 'مكتمل' : 'Done'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Progress Bar */}
              {totalTrackedItems > 0 && (
                <View style={{ height: 6, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', marginVertical: 10 }}>
                  <View style={{
                    width: `${completionPct}%`,
                    height: '100%',
                    backgroundColor: completionPct === 100 ? '#10B981' : colors.primary,
                    borderRadius: 3,
                  }} />
                </View>
              )}

              {/* Quick Metrics Grid */}
              <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', gap: 8, marginTop: 4, marginBottom: 12 }}>
                <View style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 2 }}>
                    {completedTasks.length}/{tasks.length}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, marginTop: 1 }}>
                    {isArabic ? 'مهام منجزة' : 'Tasks Done'}
                  </Text>
                </View>

                <View style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}>
                  <Ionicons name="flag" size={18} color={colors.primary} />
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 2 }}>
                    {completedGoals.length}/{dayGoalDocs.length}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, marginTop: 1 }}>
                    {isArabic ? 'أهداف محققة' : 'Goals Met'}
                  </Text>
                </View>

                <View style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: pendingTasks.length > 0 ? '#EF444410' : colors.surface,
                  borderWidth: 1,
                  borderColor: pendingTasks.length > 0 ? '#EF444435' : colors.border,
                  alignItems: 'center',
                }}>
                  <Ionicons name={pendingTasks.length > 0 ? "alert-circle" : "sparkles"} size={18} color={pendingTasks.length > 0 ? "#EF4444" : colors.textMuted} />
                  <Text style={{ fontSize: 16, fontWeight: '900', color: pendingTasks.length > 0 ? "#EF4444" : colors.text, marginTop: 2 }}>
                    {pendingTasks.length}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: pendingTasks.length > 0 ? "#EF4444" : colors.textMuted, marginTop: 1 }}>
                    {isArabic ? 'لم تُنجز' : 'Pending'}
                  </Text>
                </View>
              </View>

              {/* ─── End of Day Review: Pending Items Section ─── */}
              {pendingTasks.length > 0 && (
                <View style={{
                  marginTop: 6,
                  marginBottom: 10,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: isDarkMode ? '#1E1B24' : '#FFF7F7',
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                }}>
                  <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, isArabic && { flexDirection: 'row-reverse' }]}>
                      <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#EF4444' }}>
                        {t.pendingItems || (isArabic ? 'عناصر قيد الانتظار ولم تنجز' : 'Pending Items')}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: '#EF444420' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#EF4444' }}>
                        {pendingTasks.length}
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: 8 }}>
                    {pendingTasks.map((item) => {
                      let timeStr: string | undefined;
                      if (item.dueDate) {
                        timeStr = new Date(item.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }

                      return (
                        <LivePress
                          key={item._id}
                          style={[{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            padding: 10,
                            borderRadius: 10,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                          }, isArabic && { flexDirection: 'row-reverse' }]}
                          onPress={() => setSelectedTaskForModal(item._id)}
                          pressScale={0.97}
                        >
                          {/* Quick Toggle Checkbox */}
                          <TouchableOpacity
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              borderWidth: 1.5,
                              borderColor: '#EF4444',
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: 'transparent',
                            }}
                            onPress={() => updateTodoStatus({ id: item._id, status: 'done' })}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' }} />
                          </TouchableOpacity>

                          {/* Text Info */}
                          <View style={{ flex: 1 }}>
                            <Text style={[{ fontSize: 13, fontWeight: '700', color: colors.text }, isArabic && { textAlign: 'right' }]} numberOfLines={1}>
                              {item.text || (isArabic ? 'مهمة بدون عنوان' : 'Untitled Task')}
                            </Text>
                            {timeStr && (
                              <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }, isArabic && { flexDirection: 'row-reverse' }]}>
                                <Ionicons name="time-outline" size={11} color={colors.primary} />
                                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>
                                  {timeStr}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Chevron */}
                          <Ionicons name={isArabic ? "chevron-back" : "chevron-forward"} size={14} color={colors.textMuted} />
                        </LivePress>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* ─── Completed Items Section ─── */}
              {completedTasks.length > 0 && (
                <View style={{
                  marginTop: 6,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: isDarkMode ? '#13231B' : '#F0FDF4',
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                }}>
                  <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, isArabic && { flexDirection: 'row-reverse' }]}>
                      <Ionicons name="checkmark-done-circle" size={16} color="#10B981" />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#10B981' }}>
                        {t.completedItems || (isArabic ? 'العناصر المكتملة' : 'Completed Items')}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: '#10B98120' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>
                        {completedTasks.length}
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: 6 }}>
                    {completedTasks.map((item) => (
                      <LivePress
                        key={item._id}
                        style={[{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          paddingVertical: 4,
                        }, isArabic && { flexDirection: 'row-reverse' }]}
                        onPress={() => setSelectedTaskForModal(item._id)}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={[{
                          flex: 1,
                          fontSize: 12,
                          fontWeight: '600',
                          color: colors.textMuted,
                          textDecorationLine: 'line-through',
                        }, isArabic && { textAlign: 'right' }]} numberOfLines={1}>
                          {item.text}
                        </Text>
                      </LivePress>
                    ))}
                  </View>
                </View>
              )}

              {/* Celebratory State when all tasks done */}
              {tasks.length > 0 && pendingTasks.length === 0 && (
                <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981' }}>
                    {t.allDayTasksDone || (isArabic ? 'تم إنجاز جميع مهام اليوم بنجاح! 🎉' : 'All tasks for today are completed! 🎉')}
                  </Text>
                </View>
              )}

              {/* Empty State */}
              {tasks.length === 0 && dayGoalDocs.length === 0 && dayAchievementDocs.length === 0 && (
                <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={24} color={colors.textMuted} style={{ marginBottom: 6 }} />
                  <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600', textAlign: 'center' }}>
                    {t.noTasksScheduledDay || (isArabic ? 'لا توجد مهام مجدولة لهذا اليوم حتى الآن.' : 'No tasks scheduled for this day yet.')}
                  </Text>
                </View>
              )}
            </View>
          );
        })()}

        {/* ─── Modals ─── */}
        <TaskDetailModal
          visible={!!selectedTaskForModal}
          onClose={() => setSelectedTaskForModal(null)}
          todoId={selectedTaskForModal}
          initialDate={selectedDateTs || undefined}
        />

        <TimerModal 
          visible={isTimerModalVisible}
          onClose={() => { setTimerModalVisible(false); setSelectedTodoId(null); }}
          onSave={(ms, due, dt) => { if (selectedTodoId) setTimerMutation({ id: selectedTodoId, duration: ms, dueDate: due, date: dt }); }}
          initialDate={tasks.find(t => t._id === selectedTodoId)?.date}
        />

        <ProjectPickerModal
          visible={isProjectModalVisible}
          onClose={() => { setProjectModalVisible(false); setSelectedTodoId(null); }}
          onSelect={(selection) => { 
            if (!selectedTodoId) return;
            const currentTodo = todos.find(t => t._id === selectedTodoId);
            if (selection.type === 'none') {
              linkTaskMutation({ id: selectedTodoId, categoryId: undefined, subCategoryId: undefined, projectId: undefined, goalId: currentTodo?.goalId });
            } else if (selection.type === 'category') {
              linkTaskMutation({ id: selectedTodoId, categoryId: selection.categoryId, subCategoryId: undefined, projectId: undefined, goalId: currentTodo?.goalId });
            } else if (selection.type === 'subCategory') {
              linkTaskMutation({ id: selectedTodoId, categoryId: selection.categoryId, subCategoryId: selection.subCategoryId, projectId: undefined, goalId: currentTodo?.goalId });
            } else if (selection.type === 'project') {
              linkTaskMutation({ id: selectedTodoId, categoryId: undefined, subCategoryId: undefined, projectId: selection.projectId, goalId: currentTodo?.goalId });
            }
          }}
        />

        <PlannerListModal
          visible={plannerListModalVisible}
          onClose={() => setPlannerListModalVisible(false)}
          date={selectedDateTs || 0}
          listType={activePlannerListType}
          colors={colors}
          styles={styles}
          userId={userId}
          isArabic={isArabic}
          t={t}
        />

        <ActionModal 
          visible={isActionModalVisible}
          onClose={() => { setActionModalVisible(false); setSelectedItemForAction(null); }}
          title={selectedItemForAction?.text || (selectedItemForAction?.type === 'reminder' ? (isArabic ? 'تذكير' : 'Reminder') : (isArabic ? 'ملاحظة' : 'Note'))}
          isArabic={isArabic}
          options={[
            { 
              label: isArabic ? 'تعديل' : 'Edit', 
              icon: 'create-outline', 
              onPress: () => router.push({ pathname: '/note-detail', params: { id: selectedItemForAction?._id, isReminder: selectedItemForAction?.type === 'reminder' ? 'true' : 'false' } }) 
            },
            { 
              label: isArabic ? 'مشاركة' : 'Share', 
              icon: 'share-social-outline', 
              onPress: () => Share.share({ message: `${selectedItemForAction?.text || 'Untitled'}\n\n${selectedItemForAction?.description || ''}` }) 
            },
            { 
              label: isArabic ? 'حذف' : 'Delete', 
              icon: 'trash-outline', 
              variant: 'destructive',
              onPress: () => {
                if (selectedItemForAction) {
                  deleteTodoMutation({ id: selectedItemForAction._id });
                }
              }
            }
          ]}
        />
      </ScrollView>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >

      <StatusBar barStyle={colors.statusBarStyle} backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.safeArea}>
        <AnimatedWavyHeader backgroundColor={colors.bg} waveHeight={10} contentStyle={{ paddingBottom: 2 }}>
          <View style={[styles.header, { paddingBottom: 4 }, isArabic && { flexDirection: 'row-reverse' }]}>
            {selectedMonth === null ? (
              <View style={[{ flex: 1, flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center' }]}>
                <Text style={styles.headerTitle}>{t.planner}</Text>
              </View>
            ) : selectedDay === null ? (
              <>
                <LivePress
                  style={styles.headerBackBtn}
                  onPress={() => setSelectedMonth(null)}
                  pressScale={0.96}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name={isArabic ? "chevron-forward" : "chevron-back"} size={20} color={colors.text} />
                  <Text style={styles.headerBackText}>{isArabic ? 'الشهور' : 'All Months'}</Text>
                </LivePress>
                <View style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>{activeYear}</Text>
                </View>
              </>
            ) : (
              <>
                <LivePress
                  style={styles.headerBackBtn}
                  onPress={handleGoBack}
                  pressScale={0.96}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name={isArabic ? "chevron-forward" : "chevron-back"} size={20} color={colors.text} />
                  <Text style={styles.headerBackText}>
                    {isFromHome ? (isArabic ? 'الرئيسية' : 'Home') : months[selectedMonth!]}
                  </Text>
                </LivePress>
                <LivePress
                  onPress={() => {
                    if (isFromHome) {
                      router.replace('/(tabs)');
                    } else {
                      resetAll();
                    }
                  }}
                  style={styles.headerActionBtn}
                  pressScale={0.96}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={colors.text} />
                </LivePress>
              </>
            )}
          </View>
        </AnimatedWavyHeader>
        
        {selectedMonth === null ? (
            renderMonthGrid()
        ) : selectedDay === null ? (
            <View style={{ flex: 1 }} {...dayViewPanResponder.panHandlers}>
              {renderDayGrid(selectedMonth)}
            </View>
        ) : (
            <View style={{ flex: 1 }} {...dayViewPanResponder.panHandlers}>
              {renderSpecificDayView(selectedDay, selectedMonth, activeYear)}
            </View>
        )}
      </SafeAreaView>

      <ScreenGuide visible={showGuide} tips={plannerTips} onDismiss={dismissGuide} isArabic={isArabic} />

    </KeyboardAvoidingView>
  );
};

export default Planner;

