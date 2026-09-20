import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  PanResponder,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Id } from '@/convex/_generated/dataModel';
import useTheme from '@/hooks/useTheme';
import LivePress from '@/components/LivePress';
import Reanimated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';

import { 
  PrayerTimeItem, 
  calculateLocalPrayerTimes, 
  getDynamicPrayerTimes, 
  getUserLocationConfig 
} from '@/utils/prayerTimes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const START_HOUR = 4; // 04:00 AM (accommodates Fajr in all seasons)
const END_HOUR = 24; // 12:00 AM midnight (20 hours total)
const TOTAL_HOURS = END_HOUR - START_HOUR;
const TOTAL_MINUTES = TOTAL_HOURS * 60;
const DRAG_SNAP_MINUTES = 15;
const MIN_LONG_PRESS_MS = 350;

export interface DayTimelineItem {
  id: string;
  source: 'todo' | 'plannerItem' | 'prayer';
  rawItem?: any;
  title: string;
  subtitle?: string;
  kind: 'meeting' | 'appointment' | 'checklist' | 'bullet' | 'prayer' | 'task';
  timeHour: number; // 0..23
  timeMinute: number; // 0..59
  durationMinutes: number;
  isCompleted: boolean;
  color?: string;
  icon?: string;
  location?: string;
  meetingLink?: string;
}

interface DayTimelineScheduleProps {
  year: number;
  month: number;
  day: number;
  selectedDateTs: number;
  tasks: any[];
  checklistItems: any[];
  bulletItems: any[];
  toggleItems: any[];
  isArabic: boolean;
  t: any;
  onToggleTodo: (todoId: Id<'todos'>, currentStatus?: string) => void;
  onTogglePlannerItem: (itemId: Id<'categoryItems'>, isCompleted?: boolean) => void;
  onDeleteTodo: (todoId: Id<'todos'>) => void;
  onDeletePlannerItem: (itemId: Id<'categoryItems'>) => void;
  onAddTodo: (payload: any) => Promise<any>;
  onAddPlannerItem: (payload: any) => Promise<any>;
  onOpenTaskDetails?: (todoId: Id<'todos'>) => void;
}

const KIND_CONFIG: Record<string, { labelEn: string; labelAr: string; icon: string; defaultColor: string }> = {
  meeting: { labelEn: 'Meeting', labelAr: 'اجتماع', icon: 'videocam', defaultColor: '#38BDF8' },
  appointment: { labelEn: 'Appointment', labelAr: 'موعد', icon: 'calendar', defaultColor: '#F59E0B' },
  task: { labelEn: 'Task', labelAr: 'مهمة', icon: 'checkbox-outline', defaultColor: '#10B981' },
  checklist: { labelEn: 'Checklist', labelAr: 'قائمة', icon: 'list', defaultColor: '#06B6D4' },
  bullet: { labelEn: 'Bullet Note', labelAr: 'ملاحظة', icon: 'document-text', defaultColor: '#8B5CF6' },
  prayer: { labelEn: 'Prayer', labelAr: 'صلاة', icon: 'sparkles', defaultColor: '#A78BFA' },
};

type ZoomLevel = 'compact' | 'standard' | 'detailed';

const ZOOM_CONFIG: Record<ZoomLevel, { hourHeight: number; labelEn: string; labelAr: string }> = {
  compact: { hourHeight: 52, labelEn: 'Compact', labelAr: 'مضغوط' },
  standard: { hourHeight: 80, labelEn: 'Standard', labelAr: 'قياسي' },
  detailed: { hourHeight: 120, labelEn: 'Detailed', labelAr: 'تفصيلي' },
};

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export const DayTimelineSchedule: React.FC<DayTimelineScheduleProps> = ({
  year,
  month,
  day,
  selectedDateTs,
  tasks,
  checklistItems,
  bulletItems,
  toggleItems,
  isArabic,
  t,
  onToggleTodo,
  onTogglePlannerItem,
  onDeleteTodo,
  onDeletePlannerItem,
  onAddTodo,
  onAddPlannerItem,
  onOpenTaskDetails,
}) => {
  const { colors, isDarkMode } = useTheme();
  const timelineScrollRef = useRef<ScrollView>(null);

  // Dynamic Prayer Times according to User Location (Egypt/Cairo and global)
  const locationConfig = useMemo(() => getUserLocationConfig(), []);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeItem[]>(() =>
    calculateLocalPrayerTimes(year, month, day, locationConfig)
  );

  useEffect(() => {
    let isMounted = true;
    const local = calculateLocalPrayerTimes(year, month, day, locationConfig);
    setPrayerTimes(local);

    getDynamicPrayerTimes(year, month, day).then((times) => {
      if (isMounted && times && times.length === 5) {
        setPrayerTimes(times);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [year, month, day, locationConfig]);

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('standard');
  const hourHeight = ZOOM_CONFIG[zoomLevel].hourHeight;
  const minuteHeight = hourHeight / 60;
  const totalTimelineHeight = TOTAL_HOURS * hourHeight;

  // Modal State for Adding Schedule Item
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [isPM, setIsPM] = useState<boolean>(false);
  const [selectedKind, setSelectedKind] = useState<'meeting' | 'appointment' | 'task' | 'checklist' | 'bullet'>('meeting');
  const [itemTitle, setItemTitle] = useState('');
  const [itemContextText, setItemContextText] = useState('');
  const [itemDuration, setItemDuration] = useState(30);
  // Editable end time — always derived from start + duration, and editing the
  // end time recomputes the duration (the two stay in sync).
  const [endHour, setEndHour] = useState<number>(9);
  const [endMinute, setEndMinute] = useState<number>(30);
  const [endIsPM, setEndIsPM] = useState<boolean>(false);

  // Prayer completion local state
  const [completedPrayers, setCompletedPrayers] = useState<Record<string, boolean>>({});

  const togglePrayer = (prayerKey: string) => {
    setCompletedPrayers((prev) => ({
      ...prev,
      [prayerKey]: !prev[prayerKey],
    }));
  };

  // Is today indicator
  const isToday = useMemo(() => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  }, [year, month, day]);

  const [currentMinutesFromStart, setCurrentMinutesFromStart] = useState<number | null>(null);

  useEffect(() => {
    if (!isToday) {
      setCurrentMinutesFromStart(null);
      return;
    }
    const updateNow = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      if (h >= START_HOUR && h <= END_HOUR) {
        setCurrentMinutesFromStart((h - START_HOUR) * 60 + m);
      } else {
        setCurrentMinutesFromStart(null);
      }
    };
    updateNow();
    const timer = setInterval(updateNow, 60000);
    return () => clearInterval(timer);
  }, [isToday]);

  // Build unified chronological timeline items. Todos WITHOUT an explicit
  // time (no dueDate, or a midnight dueDate) are pulled out into the
  // "Unscheduled" lane instead of being faked at a fixed hour — that fake
  // pile-up (everything at 09:00) is what made unrelated tasks render
  // compacted together in one column block.
  const { scheduledItems, unscheduledTodos } = useMemo<{
    scheduledItems: DayTimelineItem[];
    unscheduledTodos: any[];
  }>(() => {
    const scheduledItems: DayTimelineItem[] = [];
    const unscheduledTodos: any[] = [];

    // 1. Todos & Tasks for this day
    tasks.forEach((todo) => {
      const due = todo.dueDate ? new Date(todo.dueDate) : null;
      const hasExplicitTime = !!due && !(due.getHours() === 0 && due.getMinutes() === 0);
      if (!hasExplicitTime) {
        unscheduledTodos.push(todo);
        return;
      }

      let duration = todo.timerDuration ? Math.round(todo.timerDuration / 60000) : 30;
      if (duration < 15) duration = 15;

      let kind: DayTimelineItem['kind'] = 'task';
      if (todo.meetingLink || todo.type === 'meeting') kind = 'meeting';
      else if (todo.location || todo.type === 'appointment') kind = 'appointment';
      else if (todo.type === 'reminder') kind = 'appointment';

      scheduledItems.push({
        id: todo._id,
        source: 'todo',
        rawItem: todo,
        title: todo.text || 'Untitled Task',
        subtitle: todo.description || (todo.location ? `📍 ${todo.location}` : undefined),
        kind,
        timeHour: due!.getHours(),
        timeMinute: due!.getMinutes(),
        durationMinutes: duration,
        isCompleted: todo.status === 'done',
        color: todo.status === 'done' ? '#10B981' : KIND_CONFIG[kind]?.defaultColor || colors.primary,
        location: todo.location,
        meetingLink: todo.meetingLink,
      });
    });

    // 2. Planner items (Checklists & Bullet points with default spread)
    checklistItems.forEach((cItem, idx) => {
      const timeH = Math.min(22, 10 + (idx % 8));
      scheduledItems.push({
        id: cItem._id,
        source: 'plannerItem',
        rawItem: cItem,
        title: cItem.text,
        subtitle: isArabic ? 'عنصر قائمة تحقق' : 'Checklist item',
        kind: 'checklist',
        timeHour: timeH,
        timeMinute: 0,
        durationMinutes: 25,
        isCompleted: !!cItem.isCompleted,
        color: '#06B6D4',
      });
    });

    bulletItems.forEach((bItem, idx) => {
      const timeH = Math.min(22, 14 + (idx % 6));
      scheduledItems.push({
        id: bItem._id,
        source: 'plannerItem',
        rawItem: bItem,
        title: bItem.text,
        subtitle: bItem.content || (isArabic ? 'نقطة مرجعية' : 'Bullet point note'),
        kind: 'bullet',
        timeHour: timeH,
        timeMinute: 15,
        durationMinutes: 20,
        isCompleted: !!bItem.isCompleted,
        color: '#8B5CF6',
      });
    });

    return { scheduledItems, unscheduledTodos };
  }, [tasks, checklistItems, bulletItems, isArabic, colors.primary]);

  const TOP_OFFSET = 12;

  // Compute collision positions, cluster widths, and columns for timeline items
  const laidOutItems = useMemo(() => {
    // 1. Sort by start time, then by longer duration first
    const sorted = [...scheduledItems].sort((a, b) => {
      const aStart = (a.timeHour - START_HOUR) * 60 + a.timeMinute;
      const bStart = (b.timeHour - START_HOUR) * 60 + b.timeMinute;
      if (aStart !== bStart) return aStart - bStart;
      return b.durationMinutes - a.durationMinutes;
    });

    interface EventNode {
      item: DayTimelineItem;
      startMin: number;
      endMin: number;
      top: number;
      height: number;
      colIndex: number;
      totalCols: number;
    }

    const nodes: EventNode[] = sorted.map((item) => {
      const startMin = Math.max(0, (item.timeHour - START_HOUR) * 60 + item.timeMinute);
      const endMin = startMin + Math.max(15, item.durationMinutes);
      const top = startMin * minuteHeight + TOP_OFFSET;
      const height = Math.max(34, item.durationMinutes * minuteHeight - 3);

      return {
        item,
        startMin,
        endMin,
        top,
        height,
        colIndex: 0,
        totalCols: 1,
      };
    });

    // 2. Group into overlapping clusters
    const clusters: EventNode[][] = [];
    let currentCluster: EventNode[] = [];
    let currentClusterEnd = -1;

    nodes.forEach((node) => {
      if (currentCluster.length === 0) {
        currentCluster.push(node);
        currentClusterEnd = node.endMin;
      } else {
        if (node.startMin < currentClusterEnd) {
          // Overlaps with current cluster
          currentCluster.push(node);
          currentClusterEnd = Math.max(currentClusterEnd, node.endMin);
        } else {
          // New cluster
          clusters.push(currentCluster);
          currentCluster = [node];
          currentClusterEnd = node.endMin;
        }
      }
    });
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    // 3. For each cluster, assign columns greedily & compute total columns
    clusters.forEach((cluster) => {
      const colEndTimes: number[] = [];

      cluster.forEach((node) => {
        let assignedCol = -1;
        for (let c = 0; c < colEndTimes.length; c++) {
          if (node.startMin >= colEndTimes[c]) {
            assignedCol = c;
            colEndTimes[c] = node.endMin;
            break;
          }
        }
        if (assignedCol === -1) {
          assignedCol = colEndTimes.length;
          colEndTimes.push(node.endMin);
        }
        node.colIndex = assignedCol;
      });

      const totalCols = Math.max(1, colEndTimes.length);
      cluster.forEach((node) => {
        node.totalCols = totalCols;
      });
    });

    return nodes.map((node) => ({
      ...node.item,
      top: node.top,
      height: node.height,
      colIndex: node.colIndex,
      totalCols: node.totalCols,
    }));
  }, [scheduledItems, minuteHeight]);

  const to24 = (h: number, pm: boolean) => {
    let h24 = h;
    if (pm && h24 < 12) h24 += 12;
    if (!pm && h24 === 12) h24 = 0;
    return h24;
  };

  // Recompute the editable end time from a start (12h parts) + duration.
  const recomputeEnd = (h12: number, minute: number, pm: boolean, dur: number) => {
    const start24 = to24(h12, pm);
    const endTotal = start24 * 60 + Math.max(15, Math.round(dur));
    const endH24 = Math.floor(endTotal / 60) % 24;
    setEndHour(endH24 % 12 === 0 ? 12 : endH24 % 12);
    setEndMinute(endTotal % 60);
    setEndIsPM(endH24 >= 12);
  };

  // Editing the end time directly writes back into the duration. An end at or
  // before the start clamps to the 15-minute minimum (end snaps to start+15).
  const applyEndTime = (h12: number, minute: number, pm: boolean) => {
    const start24 = to24(selectedHour, isPM);
    const end24 = to24(h12, pm);
    const dur = end24 * 60 + minute - start24 * 60;
    if (dur < 15) {
      setItemDuration(15);
      recomputeEnd(selectedHour, selectedMinute, isPM, 15);
      return;
    }
    setItemDuration(dur);
    setEndHour(h12);
    setEndMinute(minute);
    setEndIsPM(pm);
  };

  const openAddAtTime = (hour: number, minute: number = 0, durationMin?: number) => {
    const clampedHour = Math.max(0, Math.min(23, hour));
    const h12 = clampedHour % 12 === 0 ? 12 : clampedHour % 12;
    const dur = durationMin && durationMin > 0 ? durationMin : 30;
    setSelectedHour(h12);
    setSelectedMinute(minute);
    setIsPM(clampedHour >= 12);
    setItemTitle('');
    setItemContextText('');
    setItemDuration(dur);
    recomputeEnd(h12, minute, clampedHour >= 12, dur);
    setModalVisible(true);
  };

  // ─── Google-Calendar-style press-and-hold drag selection ───────────────────
  // Long-press an empty slot → a selection stub appears; keep the finger down
  // and drag up/down to grow it (snapped to 15-min steps). Release → the add
  // modal opens prefilled with the dragged start time and duration. Regular
  // scrolls are untouched: the pan responder only claims the gesture once a
  // selection is active.
  const [dragSel, setDragSel] = useState<{ startMin: number; endMin: number } | null>(null);
  const dragSelRef = useRef<{ startMin: number; endMin: number } | null>(null);
  // True once the pan responder has claimed the gesture (i.e. the user is
  // actually dragging). Distinguishes "long-pressed then released" from
  // "long-pressed then dragged" so the slot's press-out handler doesn't
  // double-open the modal after a finished drag.
  const dragClaimedRef = useRef(false);
  const minuteHeightRef = useRef(minuteHeight);
  minuteHeightRef.current = minuteHeight;

  const startDrag = useCallback((startMin: number) => {
    dragSelRef.current = { startMin, endMin: startMin + DRAG_SNAP_MINUTES };
    dragClaimedRef.current = false;
    setDragSel({ ...dragSelRef.current });
  }, []);

  const clearDrag = useCallback(() => {
    dragSelRef.current = null;
    dragClaimedRef.current = false;
    setDragSel(null);
  }, []);

  const finishDrag = useCallback(() => {
    const sel = dragSelRef.current;
    clearDrag();
    if (!sel) return;
    const start = Math.min(sel.startMin, sel.endMin);
    const end = Math.max(sel.startMin, sel.endMin);
    const dur = end - start;
    if (dur < DRAG_SNAP_MINUTES) {
      // Plain long-press without a drag → quick add at that half-hour slot.
      openAddAtTime(Math.floor(start / 60), start % 60);
      return;
    }
    openAddAtTime(Math.floor(start / 60) % 24, start % 60, dur);
  }, [clearDrag]);

  const finishDragRef = useRef(finishDrag);
  finishDragRef.current = finishDrag;
  const clearDragRef = useRef(clearDrag);
  clearDragRef.current = clearDrag;

  const timelinePanHandlers = useMemo(() => {
    const pr = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Only claim the gesture while an active selection exists — normal
      // scrolling and taps fall through to the ScrollView / slots untouched.
      onMoveShouldSetPanResponderCapture: () => dragSelRef.current !== null,
      onMoveShouldSetPanResponder: () => dragSelRef.current !== null,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragClaimedRef.current = true;
      },
      onPanResponderMove: (_, g) => {
        const sel = dragSelRef.current;
        if (!sel) return;
        const rawEnd = sel.startMin + g.dy / minuteHeightRef.current;
        const snapped = Math.round(rawEnd / DRAG_SNAP_MINUTES) * DRAG_SNAP_MINUTES;
        const clamped = Math.max(0, Math.min(TOTAL_MINUTES, snapped));
        // Re-render only when the snapped value actually changes.
        if (clamped !== sel.endMin) {
          dragSelRef.current = { ...sel, endMin: clamped };
          setDragSel({ ...dragSelRef.current });
        }
      },
      onPanResponderRelease: () => {
        finishDragRef.current();
      },
      onPanResponderTerminate: () => {
        clearDragRef.current();
      },
    });
    return pr.panHandlers;
  }, []);

  const handleSaveItem = async () => {
    if (!itemTitle.trim()) return;

    let h24 = selectedHour;
    if (isPM && h24 < 12) h24 += 12;
    if (!isPM && h24 === 12) h24 = 0;

    const targetDate = new Date(year, month, day, h24, selectedMinute).getTime();

    if (selectedKind === 'bullet' || selectedKind === 'checklist') {
      await onAddPlannerItem({
        text: itemTitle.trim(),
        content: itemContextText.trim() || undefined,
        listType: selectedKind,
        date: selectedDateTs,
      });
    } else {
      // Trust the (possibly user-adjusted) duration over the raw end steppers:
      // editing the end time writes back into itemDuration, so they can't
      // disagree here.
      await onAddTodo({
        text: itemTitle.trim(),
        dueDate: targetDate,
        date: selectedDateTs,
        type: selectedKind,
        location: selectedKind === 'appointment' ? itemContextText.trim() || undefined : undefined,
        meetingLink: selectedKind === 'meeting' ? itemContextText.trim() || undefined : undefined,
        description: selectedKind === 'task' ? itemContextText.trim() || undefined : undefined,
        timerDuration: itemDuration * 60 * 1000,
        status: 'not_started',
      });
    }

    setItemTitle('');
    setItemContextText('');
    setModalVisible(false);
  };

  const formatTime12 = (hour: number, minute: number) => {
    const h = hour % 12 === 0 ? 12 : hour % 12;
    const m = minute < 10 ? `0${minute}` : minute;
    const ampm = hour >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');
    return `${h}:${m} ${ampm}`;
  };

  // Generate continuous hours array (05:00 to 23:00)
  const hoursArray = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  return (
    <View style={styles.container}>
      {/* ─── Timeline Header (Row 1: Title & + Add Button) ─── */}
      <View style={[styles.headerTopRow, isArabic && { flexDirection: 'row-reverse' }]}>
        <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View style={[styles.headerIconBadge, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="time" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {t.daySchedule || (isArabic ? 'جدول اليوم الزمني' : 'Day Schedule')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {scheduledItems.length + unscheduledTodos.length} {isArabic ? 'حدث مجدول' : 'scheduled events'}
            </Text>
          </View>
        </View>

        {/* Quick Add Button */}
        <LivePress
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => openAddAtTime(new Date().getHours())}
          pressScale={0.94}
        >
          <Ionicons name="add" size={18} color={colors.primaryText} />
          <Text style={[styles.addBtnText, { color: colors.primaryText }]}>
            {isArabic ? 'إضافة' : 'Add'}
          </Text>
        </LivePress>
      </View>

      {/* ─── Timeline Controls Bar (Row 2: Zoom Switcher & Hint) ─── */}
      <View style={[styles.headerControlsRow, isArabic && { flexDirection: 'row-reverse' }]}>
        {/* Zoom Level Switcher */}
        <View style={[styles.zoomControlBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['compact', 'standard', 'detailed'] as const).map((lvl) => {
            const active = zoomLevel === lvl;
            return (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.zoomTab,
                  active && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                ]}
                onPress={() => setZoomLevel(lvl)}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.zoomTabText,
                    { color: active ? colors.primary : colors.textMuted },
                  ]}
                >
                  {isArabic ? ZOOM_CONFIG[lvl].labelAr : ZOOM_CONFIG[lvl].labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tap Hint */}
        <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
          <Ionicons name="finger-print-outline" size={12} color={colors.primary} />
          <Text style={[styles.hintText, { color: colors.textMuted }]} numberOfLines={1}>
            {isArabic ? 'اضغط مطولاً واسحب لتحديد فترة' : 'Hold & drag to block a time range'}
          </Text>
        </View>
      </View>

      {/* ─── Unscheduled / All-day Lane (todos with no explicit time) ─── */}
      {unscheduledTodos.length > 0 && (
        <View
          style={[
            styles.unscheduledBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
            isArabic && { flexDirection: 'row-reverse' },
          ]}
        >
          <View style={[styles.unscheduledLabelWrap, isArabic && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="albums-outline" size={13} color={colors.primary} />
            <Text style={[styles.unscheduledLabelText, { color: colors.text }]}>
              {isArabic ? `بدون وقت (${unscheduledTodos.length})` : `Unscheduled (${unscheduledTodos.length})`}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.unscheduledScroll, isArabic && { flexDirection: 'row-reverse' }]}
          >
            {unscheduledTodos.map((todo) => {
              const done = todo.status === 'done';
              const kind: DayTimelineItem['kind'] =
                todo.meetingLink || todo.type === 'meeting'
                  ? 'meeting'
                  : todo.location || todo.type === 'appointment' || todo.type === 'reminder'
                  ? 'appointment'
                  : 'task';
              const dotColor = done ? '#10B981' : KIND_CONFIG[kind]?.defaultColor || colors.primary;
              return (
                <View
                  key={todo._id}
                  style={[
                    styles.unscheduledPill,
                    {
                      backgroundColor: done ? (isDarkMode ? '#1E293B' : '#F1F5F9') : isDarkMode ? '#1E222D' : '#FFFFFF',
                      borderColor: done ? colors.border : dotColor + '50',
                    },
                    isArabic && { flexDirection: 'row-reverse' },
                  ]}
                >
                  <LivePress
                    style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 5, flexShrink: 1 }}
                    onPress={() => onOpenTaskDetails?.(todo._id)}
                    pressScale={0.95}
                  >
                    <View style={[styles.unscheduledDot, { backgroundColor: dotColor }]} />
                    <Text
                      style={[
                        styles.unscheduledPillText,
                        { color: done ? colors.textMuted : colors.text },
                        done && styles.strikeText,
                        isArabic && { textAlign: 'right' },
                      ]}
                      numberOfLines={1}
                    >
                      {todo.text || (isArabic ? 'مهمة' : 'Task')}
                    </Text>
                  </LivePress>
                  <TouchableOpacity
                    style={[
                      styles.eventCheckCircle,
                      {
                        borderColor: done ? '#10B981' : colors.border,
                        backgroundColor: done ? '#10B981' : 'transparent',
                      },
                    ]}
                    onPress={() => onToggleTodo(todo._id, todo.status)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {done && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ─── Dynamic Zoomable Timeline Canvas ─── */}
      {/* The wrapper owns the drag-to-select gesture; it only claims moves
          while a long-press selection is active, so normal scrolling and taps
          pass straight through to the ScrollView and slot touchables. */}
      <View style={{ flex: 1 }} {...timelinePanHandlers}>
      <ScrollView
        ref={timelineScrollRef}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={[styles.canvasScroll, { maxHeight: 460, borderColor: colors.border, backgroundColor: isDarkMode ? '#12141A' : '#FAFAFC' }]}
        contentContainerStyle={{ height: totalTimelineHeight + TOP_OFFSET + 30 }}
      >
        <View style={[styles.canvasInner, { height: totalTimelineHeight + TOP_OFFSET + 20 }]}>
          {/* 1. Hour Lines & Touchable Slots */}
          {hoursArray.map((h, idx) => {
            const topPos = idx * hourHeight + TOP_OFFSET;
            const isNoon = h === 12;
            const h12 = h % 12 === 0 ? 12 : h % 12;
            const ampm = h >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');

            return (
              <View key={`hour-${h}`} style={[styles.hourRowWrapper, { top: topPos, height: hourHeight }]}>
                {/* Left Time Label */}
                <View style={[styles.hourLabelCol, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.hourLabelText, { color: isNoon ? colors.primary : colors.textMuted }]}>
                    {`${h12} ${ampm}`}
                  </Text>
                </View>

                {/* Right Interactive Hour Grid Track */}
                <View style={styles.hourTrackCol}>
                  {/* Solid Hour Divider Line */}
                  <View style={[styles.hourDividerLine, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                  {/* Half Hour Divider Line */}
                  <View style={[styles.halfHourDividerLine, { top: hourHeight / 2, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} />

                  {/* Top Half Slot Touch Target (:00) */}
                  <TouchableOpacity
                    style={[styles.slotTouchTarget, { top: 0, height: hourHeight / 2 }]}
                    onPress={() => openAddAtTime(h, 0)}
                    onLongPress={() => startDrag(h * 60)}
                    onPressOut={() => {
                      // Long-press released without dragging → quick add.
                      if (dragSelRef.current && !dragClaimedRef.current) {
                        finishDragRef.current();
                      }
                    }}
                    delayLongPress={MIN_LONG_PRESS_MS}
                    activeOpacity={0.4}
                  />

                  {/* Bottom Half Slot Touch Target (:30) */}
                  <TouchableOpacity
                    style={[styles.slotTouchTarget, { top: hourHeight / 2, height: hourHeight / 2 }]}
                    onPress={() => openAddAtTime(h, 30)}
                    onLongPress={() => startDrag(h * 60 + 30)}
                    onPressOut={() => {
                      if (dragSelRef.current && !dragClaimedRef.current) {
                        finishDragRef.current();
                      }
                    }}
                    delayLongPress={MIN_LONG_PRESS_MS}
                    activeOpacity={0.4}
                  />
                </View>
              </View>
            );
          })}

          {/* 2. Slim Non-Intrusive Floating Prayer Ribbons (Accurate Dynamic Location Times) */}
          {prayerTimes.map((prayer) => {
            const pStartMin = (prayer.hour - START_HOUR) * 60 + prayer.minute;
            if (pStartMin < 0 || pStartMin > TOTAL_HOURS * 60) return null;
            const topPos = pStartMin * minuteHeight + TOP_OFFSET;
            const isDone = !!completedPrayers[prayer.key];

            return (
              <View
                key={`prayer-ribbon-${prayer.key}`}
                style={[
                  styles.prayerRibbonContainer,
                  { top: Math.max(TOP_OFFSET - 8, topPos - 10) },
                  isArabic && { flexDirection: 'row-reverse', right: 54, left: 6 },
                ]}
                pointerEvents="box-none"
              >
                <View style={[styles.prayerLineAccent, { backgroundColor: prayer.color + '60' }]} />
                <View
                  style={[
                    styles.prayerRibbonPill,
                    {
                      backgroundColor: isDone ? (isDarkMode ? '#1E293B' : '#E2E8F0') : (isDarkMode ? '#1E1B4B' : '#EEF2FF'),
                      borderColor: isDone ? colors.border : prayer.color + '80',
                    },
                    isArabic && { flexDirection: 'row-reverse' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={prayer.icon as any}
                    size={12}
                    color={isDone ? colors.textMuted : prayer.color}
                  />
                  <Text
                    style={[
                      styles.prayerRibbonText,
                      { color: isDone ? colors.textMuted : (isDarkMode ? '#E0E7FF' : '#3730A3') },
                      isDone && styles.strikeText,
                    ]}
                  >
                    {isArabic ? prayer.ar : prayer.en} • {formatTime12(prayer.hour, prayer.minute)}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.prayerCheckCircle,
                      {
                        backgroundColor: isDone ? '#10B981' : 'transparent',
                        borderColor: isDone ? '#10B981' : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                      },
                    ]}
                    onPress={() => togglePrayer(prayer.key)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isDone && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* 3. Live "NOW" Current Time Indicator */}
          {currentMinutesFromStart !== null && (
            <View
              style={[
                styles.nowIndicatorContainer,
                { top: currentMinutesFromStart * minuteHeight + TOP_OFFSET },
                isArabic && { flexDirection: 'row-reverse', right: 54, left: 6 },
              ]}
              pointerEvents="none"
            >
              <View style={[styles.nowDot, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.nowLine, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.nowBadge, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.nowBadgeText}>{t.now || 'NOW'}</Text>
              </View>
            </View>
          )}

          {/* 4. Proportional Duration Event Cards with Multi-Column Overlap Resolution */}
          <View
            style={[
              styles.eventsOverlay,
              isArabic ? { right: 54, left: 6 } : { left: 54, right: 6 },
            ]}
            pointerEvents="box-none"
          >
            {laidOutItems.map((item, idx) => {
              const kindConf = KIND_CONFIG[item.kind] || KIND_CONFIG.task;
              const nodeColor = item.color || kindConf.defaultColor;
              const isDone = item.isCompleted;

              const colWidthPercent = 100 / item.totalCols;
              const offsetPercent = item.colIndex * colWidthPercent;
              const gap = item.totalCols > 1 ? 1.5 : 0;
              const isCompactCol = item.totalCols >= 2;

              return (
                <Reanimated.View
                  key={item.id}
                  entering={FadeInDown.duration(280).delay(Math.min(idx * 25, 250))}
                  style={[
                    styles.eventCardAbsolute,
                    {
                      top: item.top,
                      height: item.height,
                      backgroundColor: isDone
                        ? (isDarkMode ? '#1E293B' : '#F1F5F9')
                        : (isDarkMode ? '#1E222D' : '#FFFFFF'),
                      borderColor: isDone ? colors.border : nodeColor + '50',
                      borderLeftColor: nodeColor,
                      borderLeftWidth: isArabic ? 1 : (isCompactCol ? 2.5 : 3.5),
                      borderRightWidth: isArabic ? (isCompactCol ? 2.5 : 3.5) : 1,
                      borderRightColor: nodeColor,
                      paddingHorizontal: isCompactCol ? 5 : 8,
                      paddingVertical: isCompactCol ? 2 : 4,
                    },
                    isArabic
                      ? {
                          right: `${offsetPercent}%`,
                          width: `${colWidthPercent - gap}%`,
                        }
                      : {
                          left: `${offsetPercent}%`,
                          width: `${colWidthPercent - gap}%`,
                        },
                  ]}
                >
                  <LivePress
                    style={styles.eventCardContent}
                    onPress={() => {
                      if (item.source === 'todo' && item.rawItem && onOpenTaskDetails) {
                        onOpenTaskDetails(item.rawItem._id);
                      }
                    }}
                    onLongPress={() => {
                      if (item.source === 'todo') {
                        Alert.alert(
                          isArabic ? 'خيارات' : 'Options',
                          item.title,
                          [
                            { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
                            { text: isArabic ? 'حذف' : 'Delete', style: 'destructive', onPress: () => onDeleteTodo(item.rawItem._id) },
                          ]
                        );
                      } else if (item.source === 'plannerItem') {
                        Alert.alert(
                          isArabic ? 'خيارات' : 'Options',
                          item.title,
                          [
                            { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
                            { text: isArabic ? 'حذف' : 'Delete', style: 'destructive', onPress: () => onDeletePlannerItem(item.rawItem._id) },
                          ]
                        );
                      }
                    }}
                    pressScale={0.98}
                  >
                    <View style={[styles.eventHeaderRow, isArabic && { flexDirection: 'row-reverse' }]}>
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: isCompactCol ? 3 : 5, flex: 1 }}>
                        <View style={[styles.kindDot, { backgroundColor: nodeColor, width: isCompactCol ? 5 : 6, height: isCompactCol ? 5 : 6 }]} />
                        <Text
                          style={[
                            styles.eventTitleText,
                            {
                              color: isDone ? colors.textMuted : colors.text,
                              fontSize: isCompactCol ? (item.totalCols >= 3 ? 10 : 11) : 12,
                            },
                            isDone && styles.strikeText,
                            isArabic && { textAlign: 'right' },
                          ]}
                          numberOfLines={item.height < 44 ? 1 : 2}
                        >
                          {item.title}
                        </Text>
                      </View>

                      {/* Time & Check Circle */}
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: isCompactCol ? 3 : 6 }}>
                        {!isCompactCol || item.totalCols <= 2 ? (
                          <Text style={[styles.eventTimeBadgeText, { color: colors.textMuted, fontSize: isCompactCol ? 8.5 : 9.5 }]}>
                            {formatTime12(item.timeHour, item.timeMinute)}
                            {item.totalCols === 1 ? ` (${item.durationMinutes}m)` : ''}
                          </Text>
                        ) : null}
                        <TouchableOpacity
                          style={[
                            styles.eventCheckCircle,
                            {
                              borderColor: isDone ? '#10B981' : colors.border,
                              backgroundColor: isDone ? '#10B981' : 'transparent',
                              width: isCompactCol ? 14 : 16,
                              height: isCompactCol ? 14 : 16,
                              borderRadius: isCompactCol ? 7 : 8,
                            },
                          ]}
                          onPress={() => {
                            if (item.source === 'todo' && item.rawItem) {
                              onToggleTodo(item.rawItem._id, item.rawItem.status);
                            } else if (item.source === 'plannerItem' && item.rawItem) {
                              onTogglePlannerItem(item.rawItem._id, item.rawItem.isCompleted);
                            }
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          {isDone && <Ionicons name="checkmark" size={isCompactCol ? 8 : 10} color="#FFFFFF" />}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Subtitle / Links if height allows */}
                    {!isCompactCol && item.height >= 48 && (item.subtitle || item.location || item.meetingLink) ? (
                      <View style={[styles.eventMetaRow, isArabic && { flexDirection: 'row-reverse' }]}>
                        {item.meetingLink ? (
                          <View style={[styles.miniBadge, { backgroundColor: '#38BDF820' }]}>
                            <Ionicons name="videocam-outline" size={10} color="#38BDF8" />
                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#38BDF8' }} numberOfLines={1}>
                              {isArabic ? 'رابط' : 'Link'}
                            </Text>
                          </View>
                        ) : null}
                        {item.location ? (
                          <View style={[styles.miniBadge, { backgroundColor: '#F59E0B20' }]}>
                            <Ionicons name="location-outline" size={10} color="#F59E0B" />
                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#F59E0B' }} numberOfLines={1}>
                              {item.location}
                            </Text>
                          </View>
                        ) : null}
                        {item.subtitle && !item.location && !item.meetingLink ? (
                          <Text style={[styles.eventSubtitleText, { color: colors.textMuted }]} numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </LivePress>
                </Reanimated.View>
              );
            })}
          </View>

          {/* 5. Press-and-hold drag selection overlay (Google-Calendar style) */}
          {dragSel && (() => {
            const s = Math.min(dragSel.startMin, dragSel.endMin);
            const e = Math.max(dragSel.startMin, dragSel.endMin);
            const selTop = (s - START_HOUR * 60) * minuteHeight + TOP_OFFSET;
            const selHeight = Math.max(8, (e - s) * minuteHeight);
            return (
              <View
                pointerEvents="none"
                style={[
                  styles.dragSelectionBlock,
                  {
                    top: selTop,
                    height: selHeight,
                    backgroundColor: colors.primary + '26',
                    borderColor: colors.primary,
                  },
                  isArabic ? { right: 54, left: 6 } : { left: 54, right: 6 },
                ]}
              >
                <View style={[styles.dragSelectionLabel, { backgroundColor: colors.primary }, isArabic && { alignSelf: 'flex-end' }]}>
                  <Text style={styles.dragSelectionLabelText} numberOfLines={1}>
                    {formatTime12(Math.floor(s / 60) % 24, s % 60)} – {formatTime12(Math.floor(e / 60) % 24, e % 60)}
                  </Text>
                </View>
              </View>
            );
          })()}
        </View>
      </ScrollView>
      </View>

      {/* ─── Polished Add to Schedule Modal ─── */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: isDarkMode ? '#1B1E28' : '#FFFFFF', borderColor: colors.border }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Header */}
              <View style={[styles.modalHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.modalIconWrap, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name="calendar" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {t.addScheduleItem || (isArabic ? 'إضافة إلى الجدول' : 'Add to Schedule')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Polished Horizontal Type Pills Selector */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted }, isArabic && { textAlign: 'right' }]}>
                {isArabic ? 'نوع الحدث:' : 'Event Type:'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.typePillScroll, isArabic && { flexDirection: 'row-reverse' }]}
              >
                {(['meeting', 'appointment', 'task', 'checklist', 'bullet'] as const).map((kind) => {
                  const conf = KIND_CONFIG[kind];
                  const isSel = selectedKind === kind;
                  return (
                    <TouchableOpacity
                      key={kind}
                      style={[
                        styles.typePill,
                        {
                          backgroundColor: isSel ? conf.defaultColor + '22' : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                          borderColor: isSel ? conf.defaultColor : 'transparent',
                        },
                      ]}
                      onPress={() => setSelectedKind(kind)}
                    >
                      <Ionicons name={conf.icon as any} size={14} color={isSel ? conf.defaultColor : colors.textMuted} />
                      <Text
                        style={[
                          styles.typePillText,
                          { color: isSel ? conf.defaultColor : colors.text },
                        ]}
                      >
                        {isArabic ? conf.labelAr : conf.labelEn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Title Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: isDarkMode ? '#13151D' : '#F4F5F7', color: colors.text, borderColor: colors.border },
                    isArabic && { textAlign: 'right' },
                  ]}
                  placeholder={isArabic ? 'ماذا تخطط لهذا الوقت؟' : 'Title / Event name...'}
                  placeholderTextColor={colors.textMuted}
                  value={itemTitle}
                  onChangeText={setItemTitle}
                  autoFocus
                />
              </View>

              {/* Contextual Input (Link / Location / Description) */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: isDarkMode ? '#13151D' : '#F4F5F7', color: colors.text, borderColor: colors.border },
                    isArabic && { textAlign: 'right' },
                  ]}
                  placeholder={
                    selectedKind === 'meeting'
                      ? (isArabic ? 'رابط الاجتماع (Zoom / Meet...)' : 'Meeting link (Zoom/Meet)...')
                      : selectedKind === 'appointment'
                      ? (isArabic ? 'الموقع أو العنوان...' : 'Location / Room / Address...')
                      : (isArabic ? 'ملاحظات أو تفاصيل...' : 'Notes or details...')
                  }
                  placeholderTextColor={colors.textMuted}
                  value={itemContextText}
                  onChangeText={setItemContextText}
                />
              </View>

              {/* Time Selector Controls */}
              <View style={[styles.timeControlBox, { backgroundColor: isDarkMode ? '#13151D' : '#F4F5F7', borderColor: colors.border }]}>
                {/* Start Time Row */}
                <View style={[styles.timeRow, isArabic && { flexDirection: 'row-reverse' }]}>
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={[styles.timeSectionTitle, { color: colors.text }]}>
                      {isArabic ? 'وقت البدء:' : 'Start Time:'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    {/* Hour Stepper */}
                    <View style={styles.stepperGroup}>
                      <TouchableOpacity
                        style={[styles.miniStepBtn, { borderColor: colors.border }]}
                        onPress={() => {
                          const next = selectedHour > 1 ? selectedHour - 1 : 12;
                          setSelectedHour(next);
                          recomputeEnd(next, selectedMinute, isPM, itemDuration);
                        }}
                      >
                        <Ionicons name="remove" size={14} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={[styles.timeValueText, { color: colors.text }]}>{selectedHour}</Text>
                      <TouchableOpacity
                        style={[styles.miniStepBtn, { borderColor: colors.border }]}
                        onPress={() => {
                          const next = selectedHour < 12 ? selectedHour + 1 : 1;
                          setSelectedHour(next);
                          recomputeEnd(next, selectedMinute, isPM, itemDuration);
                        }}
                      >
                        <Ionicons name="add" size={14} color={colors.text} />
                      </TouchableOpacity>
                    </View>

                    <Text style={{ fontWeight: '800', color: colors.text }}>:</Text>

                    {/* Minute Selector */}
                    <TouchableOpacity
                      style={[styles.minuteToggleBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        const next = selectedMinute === 0 ? 15 : selectedMinute === 15 ? 30 : selectedMinute === 30 ? 45 : 0;
                        setSelectedMinute(next);
                        recomputeEnd(selectedHour, next, isPM, itemDuration);
                      }}
                    >
                      <Text style={[styles.timeValueText, { color: colors.text }]}>
                        {selectedMinute < 10 ? `0${selectedMinute}` : selectedMinute}
                      </Text>
                    </TouchableOpacity>

                    {/* AM / PM Toggle */}
                    <TouchableOpacity
                      style={[styles.amPmPill, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => {
                        const next = !isPM;
                        setIsPM(next);
                        recomputeEnd(selectedHour, selectedMinute, next, itemDuration);
                      }}
                    >
                      <Text style={styles.amPmText}>{isPM ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* End Time Row — directly editable; edits write back into the duration */}
                <View style={[styles.endTimeDivider, { borderTopColor: colors.border }]} />
                <View style={[styles.timeRow, isArabic && { flexDirection: 'row-reverse' }]}>
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="log-out-outline" size={16} color={colors.secondary || colors.primary} />
                    <Text style={[styles.timeSectionTitle, { color: colors.text }]}>
                      {isArabic ? 'وقت النهاية:' : 'End Time:'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    {/* Hour Stepper */}
                    <View style={styles.stepperGroup}>
                      <TouchableOpacity
                        style={[styles.miniStepBtn, { borderColor: colors.border }]}
                        onPress={() => {
                          const h12 = endHour > 1 ? endHour - 1 : 12;
                          applyEndTime(h12, endMinute, endIsPM);
                        }}
                      >
                        <Ionicons name="remove" size={14} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={[styles.timeValueText, { color: colors.text }]}>{endHour}</Text>
                      <TouchableOpacity
                        style={[styles.miniStepBtn, { borderColor: colors.border }]}
                        onPress={() => {
                          const h12 = endHour < 12 ? endHour + 1 : 1;
                          applyEndTime(h12, endMinute, endIsPM);
                        }}
                      >
                        <Ionicons name="add" size={14} color={colors.text} />
                      </TouchableOpacity>
                    </View>

                    <Text style={{ fontWeight: '800', color: colors.text }}>:</Text>

                    {/* Minute Selector */}
                    <TouchableOpacity
                      style={[styles.minuteToggleBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        const m = endMinute === 0 ? 15 : endMinute === 15 ? 30 : endMinute === 30 ? 45 : 0;
                        applyEndTime(endHour, m, endIsPM);
                      }}
                    >
                      <Text style={[styles.timeValueText, { color: colors.text }]}>
                        {endMinute < 10 ? `0${endMinute}` : endMinute}
                      </Text>
                    </TouchableOpacity>

                    {/* AM / PM Toggle */}
                    <TouchableOpacity
                      style={[styles.amPmPill, { backgroundColor: colors.secondary || colors.primary, borderColor: colors.secondary || colors.primary }]}
                      onPress={() => {
                        applyEndTime(endHour, endMinute, !endIsPM);
                      }}
                    >
                      <Text style={styles.amPmText}>{endIsPM ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Duration Pills Row */}
                <View style={[styles.durationSection, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.durationLabel, { color: colors.textMuted }]}>
                    {isArabic ? 'المدة:' : 'Duration:'}
                  </Text>
                  <View style={[styles.durationPillsRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    {DURATION_PRESETS.map((dur) => {
                      const isSel = itemDuration === dur;
                      const label = dur >= 60 ? `${dur / 60}h` : `${dur}m`;
                      return (
                        <TouchableOpacity
                          key={dur}
                          style={[
                            styles.durationPill,
                            {
                              backgroundColor: isSel ? colors.primary : 'transparent',
                              borderColor: isSel ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => {
                            setItemDuration(dur);
                            recomputeEnd(selectedHour, selectedMinute, isPM, dur);
                          }}
                        >
                          <Text
                            style={[
                              styles.durationPillText,
                              { color: isSel ? colors.primaryText : colors.text },
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={[styles.timeRangePreview, { color: colors.primary }]}>
                    {selectedHour}:{selectedMinute < 10 ? `0${selectedMinute}` : selectedMinute} {isPM ? 'PM' : 'AM'} ➔ {endHour}:{endMinute < 10 ? `0${endMinute}` : endMinute} {endIsPM ? 'PM' : 'AM'} ({itemDuration}m)
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={[styles.modalActions, isArabic && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </Text>
                </TouchableOpacity>

                <LivePress
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveItem}
                  pressScale={0.96}
                >
                  <Text style={[styles.saveBtnText, { color: colors.primaryText }]}>
                    {isArabic ? 'حفظ في الجدول' : 'Add to Schedule'}
                  </Text>
                </LivePress>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  zoomControlBar: {
    flexDirection: 'row',
    borderRadius: 9,
    borderWidth: 1,
    padding: 2,
  },
  zoomTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  zoomTabText: {
    fontSize: 10,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  canvasScroll: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  canvasInner: {
    position: 'relative',
    width: '100%',
  },
  hourRowWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  hourLabelCol: {
    width: 50,
    alignItems: 'center',
    paddingTop: 2,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  hourLabelText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  hourTrackCol: {
    flex: 1,
    position: 'relative',
  },
  hourDividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
  },
  halfHourDividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  slotTouchTarget: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  unscheduledBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  unscheduledLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unscheduledLabelText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  unscheduledScroll: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  unscheduledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 170,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 1,
  },
  unscheduledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  unscheduledPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dragSelectionBlock: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    zIndex: 2,
  },
  dragSelectionLabel: {
    position: 'absolute',
    top: -10,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: '100%',
  },
  dragSelectionLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  prayerRibbonContainer: {
    position: 'absolute',
    left: 52,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  prayerLineAccent: {
    flex: 1,
    height: 1,
  },
  prayerRibbonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  prayerRibbonText: {
    fontSize: 10,
    fontWeight: '800',
  },
  prayerCheckCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strikeText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  nowIndicatorContainer: {
    position: 'absolute',
    left: 52,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 4,
  },
  nowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  nowLine: {
    flex: 1,
    height: 1.5,
  },
  nowBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 8,
  },
  nowBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  eventsOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 3,
  },
  eventCardAbsolute: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 3.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 3,
    overflow: 'hidden',
  },
  eventCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kindDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventTitleText: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  eventTimeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  eventCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  eventSubtitleText: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  typePillScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  inputContainer: {
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    fontWeight: '600',
    borderWidth: 1,
  },
  timeControlBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  endTimeDivider: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStepBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeValueText: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  minuteToggleBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  amPmPill: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  amPmText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  durationSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  durationLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  durationPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  durationPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  durationPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  timeRangePreview: {
    fontSize: 10.5,
    fontWeight: '800',
    marginTop: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default DayTimelineSchedule;
