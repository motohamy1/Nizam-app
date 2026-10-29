import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useTranslation } from '@/utils/i18n';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ActiveOptionType = 'date' | 'timer' | 'priority' | 'project' | 'goal' | 'subtasks' | null;

interface QuickAddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: number;
  projectId?: string;
  isArabic?: boolean;
}

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const QuickAddTaskModal: React.FC<QuickAddTaskModalProps> = ({
  visible,
  onClose,
  initialDate,
  projectId: defaultProjectId,
  isArabic = false,
}) => {
  const insets = useSafeAreaInsets();
  const { userId, language } = useAuth();
  const { t } = useTranslation(language);
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const inputRef = useRef<any>(null);
  const subtaskInputRef = useRef<any>(null);

  // Mutations
  const addTodoMutation = useOfflineMutation(api.todos.addTodo, 'todos:addTodo');

  // Queries for Projects/Spaces and Goals
  const categories = useOfflineQuery<any[]>(
    'projects.getCategories',
    api.projects.getCategories,
    userId ? { userId } : 'skip'
  ) || [];

  const allGoals = useOfflineQuery<any[]>(
    'yearlyGoals.getAllGoals',
    api.yearlyGoals.getAllGoals,
    userId ? { userId } : 'skip'
  ) || [];

  // Form State
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<number>(initialDate || startOfDay(Date.now()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Timer State
  const [timerDirection, setTimerDirection] = useState<'down' | 'up'>('down');
  const [timerMs, setTimerMs] = useState<number | null>(null);

  // Priority State
  const [priority, setPriority] = useState<string | undefined>(undefined);

  // Project & Space State
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<'projectCategories'> | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(defaultProjectId);

  // Goal State
  const [selectedGoalId, setSelectedGoalId] = useState<Id<'yearlyGoals'> | undefined>(undefined);

  // Subtasks State
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Active Popup Option
  const [activeOption, setActiveOption] = useState<ActiveOptionType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setTitle('');
      setSelectedDate(initialDate || startOfDay(Date.now()));
      setTimerDirection('down');
      setTimerMs(null);
      setPriority(undefined);
      setSelectedCategoryId(undefined);
      setSelectedProjectId(defaultProjectId);
      setSelectedGoalId(undefined);
      setSubtasks([]);
      setNewSubtaskText('');
      setActiveOption(null);
      setIsSubmitting(false);

      // Focus input with slight delay for modal mount
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, initialDate, defaultProjectId]);

  const toggleOption = (option: ActiveOptionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveOption((prev) => (prev === option ? null : option));
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskText.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubtasks((prev) => [...prev, trimmed]);
    setNewSubtaskText('');
    subtaskInputRef.current?.focus();
  };

  const handleRemoveSubtask = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !userId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const parsedSubtasks = subtasks.map((st) => ({
        text: st,
        isCompleted: false,
      }));

      await addTodoMutation({
        userId,
        text: trimmedTitle,
        status: 'not_started',
        date: selectedDate,
        dueDate: selectedDate,
        priority: priority as any,
        categoryId: selectedCategoryId,
        projectId: selectedProjectId as any,
        goalId: selectedGoalId,
        timerDuration: timerMs || undefined,
        timerDirection: timerDirection,
        subtasks: parsedSubtasks.length > 0 ? (parsedSubtasks as any) : undefined,
      });

      handleClose();
    } catch (error) {
      console.warn('Failed to add task via QuickAddTaskModal:', error);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveOption(null);
    onClose();
  };

  // Preset Timer Durations
  const timerPresets = [
    { label: '15m', ms: 15 * 60 * 1000 },
    { label: '25m', ms: 25 * 60 * 1000 },
    { label: '45m', ms: 45 * 60 * 1000 },
    { label: '60m', ms: 60 * 60 * 1000 },
    { label: '90m', ms: 90 * 60 * 1000 },
  ];

  // Quick Dates
  const todayTs = useMemo(() => startOfDay(Date.now()), []);
  const tomorrowTs = useMemo(() => todayTs + 86400000, [todayTs]);
  const isToday = selectedDate === todayTs;

  const formattedDateLabel = useMemo(() => {
    const d = new Date(selectedDate);
    const diffDays = Math.round((selectedDate - todayTs) / 86400000);
    if (diffDays === 0) return isArabic ? 'اليوم' : 'Today';
    if (diffDays === 1) return isArabic ? 'غداً' : 'Tomorrow';
    return d.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
  }, [selectedDate, isArabic, todayTs]);

  const effectiveBottomMargin =
    Platform.OS === 'ios'
      ? keyboardHeight > 0
        ? keyboardHeight + 8
        : Math.max(insets.bottom, 16)
      : Math.max(insets.bottom, 16);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        {/* Floating Card Stack: Sits right on top of keyboard */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.floatingContainer,
            { marginBottom: effectiveBottomMargin },
          ]}
        >
          {/* ======================================================== */}
          {/* OPTION POP-UP: Animated panel above the main capsule */}
          {/* ======================================================== */}
          {activeOption && (
            <View style={styles.popupCard}>
              {/* Pop-up Header */}
              <View style={[styles.popupHeader, isArabic && styles.rowRtl]}>
                <View style={[styles.popupHeaderLeft, isArabic && styles.rowRtl]}>
                  <Ionicons
                    name={
                      activeOption === 'date'
                        ? 'calendar-outline'
                        : activeOption === 'timer'
                        ? 'time-outline'
                        : activeOption === 'priority'
                        ? 'flag-outline'
                        : activeOption === 'project'
                        ? 'folder-outline'
                        : activeOption === 'goal'
                        ? 'trophy-outline'
                        : 'list-outline'
                    }
                    size={16}
                    color="#C9A6F2"
                  />
                  <Text style={styles.popupTitle}>
                    {activeOption === 'date'
                      ? isArabic ? 'تحديد الموعد' : 'Set Date'
                      : activeOption === 'timer'
                      ? isArabic ? 'إعداد المؤقت' : 'Timer Settings'
                      : activeOption === 'priority'
                      ? isArabic ? 'مستوى الأولوية' : 'Priority Level'
                      : activeOption === 'project'
                      ? isArabic ? 'المشروع / المساحة' : 'Project / Space'
                      : activeOption === 'goal'
                      ? isArabic ? 'ربط بهدف' : 'Link to Goal'
                      : isArabic ? 'مهام فرعية' : 'Subtasks'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleOption(null)}
                  style={styles.popupCloseBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.6)" />
                </TouchableOpacity>
              </View>

              {/* Pop-up Body Content */}
              <View style={styles.popupBody}>
                {/* 1. DATE PICKER OPTION */}
                {activeOption === 'date' && (
                  <View style={[styles.chipsWrap, isArabic && styles.rowRtl]}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedDate(todayTs);
                        toggleOption(null);
                      }}
                      style={[
                        styles.popChip,
                        selectedDate === todayTs && styles.popChipActive,
                      ]}
                    >
                      <Ionicons
                        name="sunny-outline"
                        size={14}
                        color={selectedDate === todayTs ? '#000000' : '#FFFFFF'}
                      />
                      <Text
                        style={[
                          styles.popChipText,
                          selectedDate === todayTs && styles.popChipTextActive,
                        ]}
                      >
                        {isArabic ? 'اليوم' : 'Today'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedDate(tomorrowTs);
                        toggleOption(null);
                      }}
                      style={[
                        styles.popChip,
                        selectedDate === tomorrowTs && styles.popChipActive,
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={selectedDate === tomorrowTs ? '#000000' : '#FFFFFF'}
                      />
                      <Text
                        style={[
                          styles.popChipText,
                          selectedDate === tomorrowTs && styles.popChipTextActive,
                        ]}
                      >
                        {isArabic ? 'غداً' : 'Tomorrow'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={[styles.popChip, !isToday && selectedDate !== tomorrowTs && styles.popChipActive]}
                    >
                      <Ionicons
                        name="calendar"
                        size={14}
                        color={!isToday && selectedDate !== tomorrowTs ? '#000000' : '#FFFFFF'}
                      />
                      <Text
                        style={[
                          styles.popChipText,
                          !isToday && selectedDate !== tomorrowTs && styles.popChipTextActive,
                        ]}
                      >
                        {isArabic ? 'تاريخ آخر...' : 'Pick Date...'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 2. TIMER OPTION */}
                {activeOption === 'timer' && (
                  <View>
                    {/* Timer Direction: Countdown vs Countup */}
                    <View style={[styles.toggleRow, isArabic && styles.rowRtl]}>
                      <TouchableOpacity
                        onPress={() => {
                          setTimerDirection('down');
                          if (!timerMs) setTimerMs(25 * 60 * 1000);
                        }}
                        style={[
                          styles.toggleBtn,
                          timerDirection === 'down' && styles.toggleBtnActive,
                        ]}
                      >
                        <Ionicons
                          name="timer-outline"
                          size={13}
                          color={timerDirection === 'down' ? '#000000' : '#FFFFFF'}
                        />
                        <Text
                          style={[
                            styles.toggleBtnText,
                            timerDirection === 'down' && styles.toggleBtnTextActive,
                          ]}
                        >
                          {isArabic ? 'تنازلي (محدد)' : 'Countdown'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setTimerDirection('up');
                          setTimerMs(null);
                        }}
                        style={[
                          styles.toggleBtn,
                          timerDirection === 'up' && styles.toggleBtnActive,
                        ]}
                      >
                        <Ionicons
                          name="stopwatch-outline"
                          size={13}
                          color={timerDirection === 'up' ? '#000000' : '#FFFFFF'}
                        />
                        <Text
                          style={[
                            styles.toggleBtnText,
                            timerDirection === 'up' && styles.toggleBtnTextActive,
                          ]}
                        >
                          {isArabic ? 'تصاعدي (مفتوح)' : 'Stopwatch (Count-up)'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Presets if Countdown */}
                    {timerDirection === 'down' && (
                      <View style={[styles.chipsWrap, { marginTop: 10 }, isArabic && styles.rowRtl]}>
                        {timerPresets.map((preset) => {
                          const isActive = timerMs === preset.ms;
                          return (
                            <TouchableOpacity
                              key={preset.label}
                              onPress={() => {
                                setTimerMs(isActive ? null : preset.ms);
                                if (!isActive) toggleOption(null);
                              }}
                              style={[
                                styles.popChip,
                                isActive && styles.popChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.popChipText,
                                  isActive && styles.popChipTextActive,
                                ]}
                              >
                                {preset.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}

                {/* 3. PRIORITY OPTION */}
                {activeOption === 'priority' && (
                  <View style={[styles.chipsWrap, isArabic && styles.rowRtl]}>
                    {[
                      { key: 'Urgent', label: isArabic ? 'عاجل جداً' : 'Urgent', color: '#f43f5e' },
                      { key: 'High', label: isArabic ? 'مرتفع' : 'High', color: '#ef4444' },
                      { key: 'Medium', label: isArabic ? 'متوسط' : 'Medium', color: '#f59e0b' },
                      { key: 'Low', label: isArabic ? 'منخفض' : 'Low', color: '#3b82f6' },
                    ].map((p) => {
                      const isActive = priority === p.key;
                      return (
                        <TouchableOpacity
                          key={p.key}
                          onPress={() => {
                            setPriority(isActive ? undefined : p.key);
                            toggleOption(null);
                          }}
                          style={[
                            styles.popChip,
                            isActive && { backgroundColor: p.color, borderColor: p.color },
                          ]}
                        >
                          <Ionicons
                            name="flag"
                            size={13}
                            color={isActive ? '#FFFFFF' : p.color}
                          />
                          <Text
                            style={[
                              styles.popChipText,
                              isActive && { color: '#FFFFFF', fontWeight: '800' },
                            ]}
                          >
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* 4. PROJECT / SPACE OPTION */}
                {activeOption === 'project' && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.horizontalScroll, isArabic && styles.rowRtl]}
                  >
                    {categories && categories.length > 0 ? (
                      categories.map((cat: any) => {
                        const isActive = selectedCategoryId === cat._id;
                        return (
                          <TouchableOpacity
                            key={cat._id}
                            onPress={() => {
                              setSelectedCategoryId(isActive ? undefined : cat._id);
                              toggleOption(null);
                            }}
                            style={[
                              styles.popChip,
                              isActive && styles.popChipActive,
                            ]}
                          >
                            <Ionicons
                              name="folder"
                              size={13}
                              color={isActive ? '#000000' : cat.color || '#C9A6F2'}
                            />
                            <Text
                              style={[
                                styles.popChipText,
                                isActive && styles.popChipTextActive,
                              ]}
                            >
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyText}>
                        {isArabic ? 'لا توجد مشاريع مضافة' : 'No spaces / projects found'}
                      </Text>
                    )}
                  </ScrollView>
                )}

                {/* 5. GOAL OPTION */}
                {activeOption === 'goal' && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.horizontalScroll, isArabic && styles.rowRtl]}
                  >
                    {allGoals && allGoals.length > 0 ? (
                      allGoals.map((g: any) => {
                        const isActive = selectedGoalId === g._id;
                        return (
                          <TouchableOpacity
                            key={g._id}
                            onPress={() => {
                              setSelectedGoalId(isActive ? undefined : g._id);
                              toggleOption(null);
                            }}
                            style={[
                              styles.popChip,
                              isActive && styles.popChipActive,
                            ]}
                          >
                            <Ionicons
                              name="trophy"
                              size={13}
                              color={isActive ? '#000000' : '#f59e0b'}
                            />
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.popChipText,
                                isActive && styles.popChipTextActive,
                                { maxWidth: 140 },
                              ]}
                            >
                              {g.text}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyText}>
                        {isArabic ? 'لا توجد أهداف مضافة' : 'No yearly goals found'}
                      </Text>
                    )}
                  </ScrollView>
                )}

                {/* 6. SUBTASKS OPTION */}
                {activeOption === 'subtasks' && (
                  <View>
                    {subtasks.length > 0 && (
                      <View style={styles.subtasksList}>
                        {subtasks.map((st, idx) => (
                          <View
                            key={idx}
                            style={[styles.subtaskRow, isArabic && styles.rowRtl]}
                          >
                            <Ionicons name="ellipse-outline" size={13} color="#C9A6F2" />
                            <Text
                              style={[
                                styles.subtaskText,
                                isArabic && { textAlign: 'right' },
                              ]}
                            >
                              {st}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleRemoveSubtask(idx)}
                              style={styles.subtaskDeleteBtn}
                            >
                              <Ionicons name="close-circle" size={15} color="rgba(255, 255, 255, 0.4)" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={[styles.subtaskInputRow, isArabic && styles.rowRtl]}>
                      <TextInput
                        ref={subtaskInputRef}
                        value={newSubtaskText}
                        onChangeText={setNewSubtaskText}
                        placeholder={isArabic ? 'اكتب مهمة فرعية...' : 'Type a subtask...'}
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        style={[
                          styles.subtaskTextInput,
                          isArabic && { textAlign: 'right' },
                        ]}
                        returnKeyType="done"
                        onSubmitEditing={handleAddSubtask}
                      />
                      <TouchableOpacity
                        onPress={handleAddSubtask}
                        disabled={!newSubtaskText.trim()}
                        style={[
                          styles.subtaskAddBtn,
                          !newSubtaskText.trim() && { opacity: 0.4 },
                        ]}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* MAIN QUICK TASK CAPSULE (Matching Reference UI!) */}
          {/* ======================================================== */}
          <View style={styles.mainCapsule}>
            {/* Top: Task Title Text Input */}
            <TextInput
              ref={inputRef}
              value={title}
              onChangeText={setTitle}
              placeholder={isArabic ? 'ما الذي تريد إنجازه؟' : 'What needs doing?'}
              placeholderTextColor="rgba(255, 255, 255, 0.40)"
              style={[
                styles.titleInput,
                isArabic && { textAlign: 'right' },
              ]}
              multiline={true}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {/* Bottom Row: Icons (without text) on Left + Submit Button on Right */}
            <View style={[styles.toolsRow, isArabic && styles.rowRtl]}>
              {/* Left: Row of clean icons without text */}
              <View style={[styles.iconsGroup, isArabic && styles.rowRtl]}>
                {/* 1. Date Icon */}
                <TouchableOpacity
                  onPress={() => toggleOption('date')}
                  style={[
                    styles.iconBtn,
                    activeOption === 'date' && styles.iconBtnActive,
                    !isToday && styles.iconBtnHighlighted,
                  ]}
                  accessibilityLabel="Date"
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={!isToday ? '#10b981' : activeOption === 'date' ? '#C9A6F2' : 'rgba(255, 255, 255, 0.70)'}
                  />
                  {!isToday && <View style={[styles.activeDot, { backgroundColor: '#10b981' }]} />}
                </TouchableOpacity>

                {/* 2. Timer / Clock Icon */}
                <TouchableOpacity
                  onPress={() => toggleOption('timer')}
                  style={[
                    styles.iconBtn,
                    activeOption === 'timer' && styles.iconBtnActive,
                    Boolean(timerMs || timerDirection === 'up') && styles.iconBtnHighlighted,
                  ]}
                  accessibilityLabel="Timer"
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={Boolean(timerMs || timerDirection === 'up') ? '#ff8a00' : activeOption === 'timer' ? '#C9A6F2' : 'rgba(255, 255, 255, 0.70)'}
                  />
                  {Boolean(timerMs || timerDirection === 'up') && (
                    <View style={[styles.activeDot, { backgroundColor: '#ff8a00' }]} />
                  )}
                </TouchableOpacity>

                {/* 3. Priority Flag Icon */}
                <TouchableOpacity
                  onPress={() => toggleOption('priority')}
                  style={[
                    styles.iconBtn,
                    activeOption === 'priority' && styles.iconBtnActive,
                    priority ? styles.iconBtnHighlighted : null,
                  ]}
                  accessibilityLabel="Priority"
                >
                  <Ionicons
                    name={priority ? 'flag' : 'flag-outline'}
                    size={20}
                    color={
                      priority === 'High'
                        ? '#ef4444'
                        : priority === 'Medium'
                        ? '#f59e0b'
                        : priority === 'Low'
                        ? '#3b82f6'
                        : activeOption === 'priority'
                        ? '#C9A6F2'
                        : 'rgba(255, 255, 255, 0.70)'
                    }
                  />
                </TouchableOpacity>

                {/* 4. Folder / Space Icon */}
                <TouchableOpacity
                  onPress={() => toggleOption('project')}
                  style={[
                    styles.iconBtn,
                    activeOption === 'project' && styles.iconBtnActive,
                    selectedCategoryId ? styles.iconBtnHighlighted : null,
                  ]}
                  accessibilityLabel="Project"
                >
                  <Ionicons
                    name={selectedCategoryId ? 'folder' : 'folder-outline'}
                    size={20}
                    color={selectedCategoryId ? '#38bdf8' : activeOption === 'project' ? '#C9A6F2' : 'rgba(255, 255, 255, 0.70)'}
                  />
                  {selectedCategoryId && (
                    <View style={[styles.activeDot, { backgroundColor: '#38bdf8' }]} />
                  )}
                </TouchableOpacity>

                {/* 5. Goal Icon */}
                <TouchableOpacity
                  onPress={() => toggleOption('goal')}
                  style={[
                    styles.iconBtn,
                    activeOption === 'goal' && styles.iconBtnActive,
                    selectedGoalId ? styles.iconBtnHighlighted : null,
                  ]}
                  accessibilityLabel="Goal"
                >
                  <Ionicons
                    name={selectedGoalId ? 'trophy' : 'trophy-outline'}
                    size={19}
                    color={selectedGoalId ? '#f59e0b' : activeOption === 'goal' ? '#C9A6F2' : 'rgba(255, 255, 255, 0.70)'}
                  />
                  {selectedGoalId && (
                    <View style={[styles.activeDot, { backgroundColor: '#f59e0b' }]} />
                  )}
                </TouchableOpacity>

                {/* 6. Subtasks Icon */}
                <TouchableOpacity
                  onPress={() => toggleOption('subtasks')}
                  style={[
                    styles.iconBtn,
                    activeOption === 'subtasks' && styles.iconBtnActive,
                    subtasks.length > 0 ? styles.iconBtnHighlighted : null,
                  ]}
                  accessibilityLabel="Subtasks"
                >
                  <Ionicons
                    name="list-outline"
                    size={20}
                    color={subtasks.length > 0 ? '#10b981' : activeOption === 'subtasks' ? '#C9A6F2' : 'rgba(255, 255, 255, 0.70)'}
                  />
                  {subtasks.length > 0 && (
                    <View style={styles.badgeCount}>
                      <Text style={styles.badgeCountText}>{subtasks.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Right: Circular Submit Button (↑) */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!title.trim() || isSubmitting}
                style={[
                  styles.submitBtn,
                  title.trim() ? styles.submitBtnReady : styles.submitBtnDisabled,
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={title.trim() ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>

        {/* Custom Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date(selectedDate)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date && (Platform.OS === 'ios' || event.type === 'set')) {
                setSelectedDate(startOfDay(date.getTime()));
                toggleOption(null);
              }
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  floatingContainer: {
    marginHorizontal: 16,
    width: undefined,
  },
  popupCard: {
    backgroundColor: '#1E1F25',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  popupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C9A6F2',
    letterSpacing: -0.2,
  },
  popupCloseBtn: {
    padding: 2,
  },
  popupBody: {
    width: '100%',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  popChipActive: {
    backgroundColor: '#C9A6F2',
    borderColor: '#C9A6F2',
  },
  popChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  popChipTextActive: {
    color: '#141311',
    fontWeight: '800',
  },
  horizontalScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  emptyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  toggleBtnActive: {
    backgroundColor: '#C9A6F2',
    borderColor: '#C9A6F2',
  },
  toggleBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  toggleBtnTextActive: {
    color: '#141311',
    fontWeight: '800',
  },
  subtasksList: {
    gap: 6,
    marginBottom: 8,
    maxHeight: 120,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  subtaskText: {
    flex: 1,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subtaskDeleteBtn: {
    padding: 2,
  },
  subtaskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  subtaskAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C9A6F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCapsule: {
    backgroundColor: '#17181C',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 16,
  },
  titleInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    minHeight: 38,
    maxHeight: 90,
    textAlignVertical: 'top',
    padding: 0,
    marginBottom: 10,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(201, 166, 242, 0.18)',
  },
  iconBtnHighlighted: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  activeDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badgeCount: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#10b981',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeCountText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
  },
  submitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnReady: {
    backgroundColor: '#92B814',
    shadowColor: '#92B814',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
});

export default QuickAddTaskModal;
