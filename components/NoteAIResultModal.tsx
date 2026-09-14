import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Clipboard,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import * as Haptics from 'expo-haptics';

export interface ExtractedTaskItem {
  text: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface AIResultData {
  type: 'summary' | 'tasks';
  summary?: string;
  keyTakeaways?: string[];
  tasks?: ExtractedTaskItem[];
}

interface NoteAIResultModalProps {
  visible: boolean;
  onClose: () => void;
  resultData: AIResultData | null;
  isLoading?: boolean;
  isArabic?: boolean;
  onInsertSummaryToNote?: (summaryText: string) => void;
  onAddTasksToTodoList?: (selectedTasks: ExtractedTaskItem[]) => Promise<void>;
  onInsertTasksAsChecklist?: (tasks: ExtractedTaskItem[]) => void;
  onOpenAIChat?: () => void;
}

/**
 * Clean any lingering reasoning or thinking tags from text.
 */
const cleanClientText = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
    .replace(/<thought>[\s\S]*?(?:<\/thought>|$)/gi, '')
    .replace(/<reasoning>[\s\S]*?(?:<\/reasoning>|$)/gi, '')
    .replace(/<reflection>[\s\S]*?(?:<\/reflection>|$)/gi, '')
    .replace(/<scratchpad>[\s\S]*?(?:<\/scratchpad>|$)/gi, '')
    .replace(/<antThinking>[\s\S]*?(?:<\/antThinking>|$)/gi, '')
    .replace(/```(?:thought|thinking|reasoning)[\s\S]*?```/gi, '')
    .replace(/\[(?:Thinking Process|Thought Process|Reasoning)[\s\S]*?(?:\]|$)/gi, '')
    .replace(/^(?:#{1,6}\s*)?\*?\*?(?:Thought|Thinking Process|Thought Process|Reasoning Process|Internal Thoughts|Chain of Thought)\*?\*?:?[\s\S]*?(?=\n\n|\n[#*A-Z\u0600-\u06FF]|$)/gim, '')
    .replace(/^(?:Here's a thinking process|Let's analyze this step-by-step):?[\s\S]*?(?=\n\n|\n[#*A-Z\u0600-\u06FF]|$)/gim, '')
    .replace(/^(?:#{1,6}\s*)?\*?\*?(?:Executive Summary|Executive overview|الملخص التنفيذي|الملخص|Summary)\*?\*?:?\s*/gim, '')
    .trim();
};

export const NoteAIResultModal: React.FC<NoteAIResultModalProps> = ({
  visible,
  onClose,
  resultData,
  isLoading = false,
  isArabic = false,
  onInsertSummaryToNote,
  onAddTasksToTodoList,
  onInsertTasksAsChecklist,
  onOpenAIChat,
}) => {
  const { colors, isDarkMode } = useTheme();
  const isDark = isDarkMode;
  const { t } = useTranslation(isArabic ? 'ar' : 'en');

  // Selected tasks map for checklist extraction
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<Set<number>>(new Set());
  const [isAddingTasks, setIsAddingTasks] = useState(false);
  const addingTasksRef = useRef(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resultData?.tasks && resultData.tasks.length > 0) {
      // By default, select all tasks
      setSelectedTaskIndices(new Set(resultData.tasks.map((_, i) => i)));
    } else {
      setSelectedTaskIndices(new Set());
    }
  }, [resultData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleCopySummary = () => {
    if (!resultData?.summary) return;
    let fullText = cleanClientText(resultData.summary);
    if (resultData.keyTakeaways && resultData.keyTakeaways.length > 0) {
      fullText += '\n\n' + (isArabic ? 'النقاط الرئيسية:' : 'Key Takeaways:') + '\n' +
        resultData.keyTakeaways.map((item) => `• ${cleanClientText(item)}`).join('\n');
    }
    Clipboard.setString(fullText);
    showToast(isArabic ? 'تم نسخ الملخص بنجاح' : 'Summary copied to clipboard');
  };

  const handleCopyTasks = () => {
    if (!resultData?.tasks || resultData.tasks.length === 0) return;
    const taskText = resultData.tasks.map((t) => `• [${(t.priority || 'med').toUpperCase()}] ${cleanClientText(t.text)}`).join('\n');
    Clipboard.setString(taskText);
    showToast(isArabic ? 'تم نسخ المهام بنجاح' : 'Tasks copied to clipboard');
  };

  const toggleTaskSelection = (index: number) => {
    try {
      Haptics.selectionAsync();
    } catch (_) {}
    setSelectedTaskIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectAllToggle = () => {
    if (!resultData?.tasks) return;
    if (selectedTaskIndices.size === resultData.tasks.length) {
      setSelectedTaskIndices(new Set());
    } else {
      setSelectedTaskIndices(new Set(resultData.tasks.map((_, i) => i)));
    }
  };

  const handleAddTasksConfirm = async () => {
    // Synchronous guard: this fans out into a batch of creates, and the
    // disabled button only reflects state after a re-render — a double-tap
    // would run the whole batch twice.
    if (addingTasksRef.current) return;
    addingTasksRef.current = true;
    try {
      await runAddTasksConfirm();
    } finally {
      addingTasksRef.current = false;
    }
  };

  const runAddTasksConfirm = async () => {
    if (!resultData?.tasks || !onAddTasksToTodoList) return;
    const tasksToCreate = resultData.tasks
      .filter((_, i) => selectedTaskIndices.has(i))
      .map((t) => ({ ...t, text: cleanClientText(t.text) }));

    if (tasksToCreate.length === 0) {
      showToast(isArabic ? 'يرجى تحديد مهمة واحدة على الأقل' : 'Please select at least one task');
      return;
    }

    try {
      setIsAddingTasks(true);
      await onAddTasksToTodoList(tasksToCreate);
      showToast(
        isArabic
          ? `✓ تمت إضافة ${tasksToCreate.length} مهمة إلى لوحة المهام`
          : `✓ Added ${tasksToCreate.length} task(s) to To-Do board`
      );
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      showToast(isArabic ? 'تعذر إضافة المهام' : 'Failed to add tasks');
    } finally {
      setIsAddingTasks(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#EF4444';
      case 'low':
        return '#3B82F6';
      case 'medium':
      default:
        return '#F59E0B';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return isArabic ? 'عالي' : 'High';
      case 'low':
        return isArabic ? 'منخفض' : 'Low';
      case 'medium':
      default:
        return isArabic ? 'متوسط' : 'Medium';
    }
  };

  if (!visible) return null;

  const isSummary = resultData?.type === 'summary';
  const isTasks = resultData?.type === 'tasks';
  const cleanedSummary = cleanClientText(resultData?.summary);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#11141E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.headerLeft, isArabic && { flexDirection: 'row-reverse' }]}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isSummary
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                  },
                ]}
              >
                <Ionicons
                  name={isSummary ? 'sparkles' : 'checkbox-outline'}
                  size={20}
                  color={isSummary ? '#6366F1' : '#10B981'}
                />
              </View>
              <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {isSummary
                    ? isArabic
                      ? 'ملخص الملاحظة الذكي'
                      : 'AI Smart Summary'
                    : isArabic
                    ? 'المهام المستخرجة'
                    : 'Extracted Action Items'}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  {isSummary
                    ? isArabic
                      ? 'أهم الأفكار والنقاط المستفادة'
                      : 'Key insights and takeaways'
                    : isArabic
                    ? 'حول الملاحظة إلى مهام تنفيذية'
                    : 'Convert your note into actionable tasks'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <View
              style={[
                styles.toastContainer,
                { backgroundColor: isDark ? '#1E293B' : '#0F172A' },
              ]}
            >
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          {/* Content Area */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingGlow}>
                <ActivityIndicator size="large" color="#6366F1" />
              </View>
              <Text style={[styles.loadingTitle, { color: colors.text }]}>
                {isArabic ? 'الذكاء الاصطناعي يحلل الملاحظة...' : 'AI is analyzing your note...'}
              </Text>
              <Text style={[styles.loadingSubtitle, { color: colors.textMuted }]}>
                {isArabic
                  ? 'جاري استخراج الأفكار الرئيسية والتفاصيل المنظمة'
                  : 'Synthesizing key insights and organizing details'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* SUMMARY VIEW */}
              {isSummary && resultData && (
                <View style={{ gap: 16 }}>
                  {/* Executive Summary Card */}
                  <View
                    style={[
                      styles.contentCard,
                      {
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.8)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <View style={[styles.cardHeaderRow, isArabic && { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.badge, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                        <Ionicons name="sparkles" size={13} color="#6366F1" />
                        <Text style={[styles.badgeText, { color: '#6366F1' }]}>
                          {isArabic ? 'ملخص الفكرة' : 'Summary'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={handleCopySummary}
                      >
                        <Ionicons name="copy-outline" size={14} color={colors.textMuted} />
                        <Text style={[styles.cardActionText, { color: colors.textMuted }]}>
                          {isArabic ? 'نسخ' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text
                      style={[
                        styles.summaryBodyText,
                        { color: colors.text },
                        isArabic && { textAlign: 'right', writingDirection: 'rtl' },
                      ]}
                      selectable
                    >
                      {cleanedSummary}
                    </Text>
                  </View>

                  {/* Key Takeaways Card */}
                  {resultData.keyTakeaways && resultData.keyTakeaways.length > 0 && (
                    <View
                      style={[
                        styles.contentCard,
                        {
                          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.5)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                    >
                      <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', alignSelf: isArabic ? 'flex-end' : 'flex-start', marginBottom: 12 }]}>
                        <Ionicons name="bulb-outline" size={13} color="#F59E0B" />
                        <Text style={[styles.badgeText, { color: '#F59E0B' }]}>
                          {isArabic ? 'النقاط المستفادة' : 'Key Takeaways'}
                        </Text>
                      </View>

                      <View style={{ gap: 10 }}>
                        {resultData.keyTakeaways.map((item, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.takeawayRow,
                              isArabic && { flexDirection: 'row-reverse' },
                            ]}
                          >
                            <View style={styles.takeawayNumber}>
                              <Text style={styles.takeawayNumberText}>{idx + 1}</Text>
                            </View>
                            <Text
                              style={[
                                styles.takeawayText,
                                { color: colors.text },
                                isArabic && { textAlign: 'right', writingDirection: 'rtl' },
                              ]}
                              selectable
                            >
                              {cleanClientText(item)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* TASKS VIEW */}
              {isTasks && resultData?.tasks && (
                <View style={{ gap: 14 }}>
                  {/* Action bar header */}
                  <View
                    style={[
                      styles.tasksHeaderBar,
                      isArabic && { flexDirection: 'row-reverse' },
                    ]}
                  >
                    <Text style={[styles.tasksCountText, { color: colors.textMuted }]}>
                      {isArabic
                        ? `تم العثور على ${resultData.tasks.length} مهمة (${selectedTaskIndices.size} محددة)`
                        : `${resultData.tasks.length} task(s) found (${selectedTaskIndices.size} selected)`}
                    </Text>

                    <View style={[styles.taskHeaderActions, isArabic && { flexDirection: 'row-reverse' }]}>
                      <TouchableOpacity onPress={handleSelectAllToggle} style={styles.smallActionBtn}>
                        <Text style={[styles.smallActionText, { color: colors.primary }]}>
                          {selectedTaskIndices.size === resultData.tasks.length
                            ? isArabic
                              ? 'إلغاء التحديد'
                              : 'Deselect All'
                            : isArabic
                            ? 'تحديد الكل'
                            : 'Select All'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleCopyTasks} style={styles.smallActionBtn}>
                        <Ionicons name="copy-outline" size={13} color={colors.textMuted} />
                        <Text style={[styles.smallActionText, { color: colors.textMuted }]}>
                          {isArabic ? 'نسخ' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Tasks List */}
                  <View style={{ gap: 8 }}>
                    {resultData.tasks.map((task, idx) => {
                      const isSelected = selectedTaskIndices.has(idx);
                      const priorityColor = getPriorityColor(task.priority);
                      const priorityLabel = getPriorityLabel(task.priority);

                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.8}
                          onPress={() => toggleTaskSelection(idx)}
                          style={[
                            styles.taskItemCard,
                            {
                              backgroundColor: isSelected
                                ? isDark
                                  ? 'rgba(99, 102, 241, 0.12)'
                                  : 'rgba(99, 102, 241, 0.08)'
                                : isDark
                                ? 'rgba(30, 41, 59, 0.4)'
                                : 'rgba(241, 245, 249, 0.6)',
                              borderColor: isSelected
                                ? colors.primary || '#6366F1'
                                : isDark
                                ? 'rgba(255, 255, 255, 0.06)'
                                : 'rgba(0, 0, 0, 0.05)',
                            },
                            isArabic && { flexDirection: 'row-reverse' },
                          ]}
                        >
                          <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={isSelected ? colors.primary || '#6366F1' : colors.textMuted}
                          />

                          <View style={{ flex: 1, gap: 4 }}>
                            <Text
                              style={[
                                styles.taskItemText,
                                {
                                  color: colors.text,
                                  textDecorationLine: isSelected ? 'none' : 'none',
                                },
                                isArabic && { textAlign: 'right', writingDirection: 'rtl' },
                              ]}
                            >
                              {cleanClientText(task.text)}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.priorityBadge,
                              { backgroundColor: `${priorityColor}1A` },
                            ]}
                          >
                            <View
                              style={[
                                styles.priorityDot,
                                { backgroundColor: priorityColor },
                              ]}
                            />
                            <Text style={[styles.priorityText, { color: priorityColor }]}>
                              {priorityLabel}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Bottom Action Footer */}
          {!isLoading && resultData && (
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  backgroundColor: isDark ? '#11141E' : '#FFFFFF',
                },
              ]}
            >
              {isSummary && (
                <View style={[styles.footerBtnGroup, isArabic && { flexDirection: 'row-reverse' }]}>
                  {onInsertSummaryToNote && (
                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        { backgroundColor: colors.primary || '#6366F1', flex: 1 },
                      ]}
                      onPress={() => {
                        let fullText = cleanedSummary;
                        if (resultData.keyTakeaways && resultData.keyTakeaways.length > 0) {
                          fullText += '\n\n' + (isArabic ? '### النقاط الرئيسية المستفادة:' : '### Key Takeaways:') + '\n' +
                            resultData.keyTakeaways.map((item) => `- ${cleanClientText(item)}`).join('\n');
                        }
                        onInsertSummaryToNote(fullText);
                        onClose();
                      }}
                    >
                      <Ionicons name="document-text-outline" size={17} color={colors.primaryText} />
                      <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>
                        {isArabic ? 'إدراج في الملاحظة' : 'Insert into Note'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {onOpenAIChat && (
                    <TouchableOpacity
                      style={[
                        styles.secondaryBtn,
                        {
                          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                          borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                        },
                      ]}
                      onPress={() => {
                        onClose();
                        setTimeout(() => {
                          onOpenAIChat();
                        }, 300);
                      }}
                    >
                      <Ionicons name="chatbubbles-outline" size={17} color="#6366F1" />
                      <Text style={[styles.secondaryBtnText, { color: '#6366F1' }]}>
                        {isArabic ? 'نقاش مع AI' : 'Ask AI'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {isTasks && (
                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      {
                        backgroundColor: selectedTaskIndices.size > 0 ? (colors.primary || '#6366F1') : isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    disabled={selectedTaskIndices.size === 0 || isAddingTasks}
                    onPress={handleAddTasksConfirm}
                  >
                    {isAddingTasks ? (
                      <ActivityIndicator size="small" color={colors.primaryText} />
                    ) : (
                      <>
                        <Ionicons name="add-circle" size={18} color={colors.primaryText} />
                        <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>
                          {isArabic
                            ? `إضافة ${selectedTaskIndices.size} مهمة إلى قائمة المهام`
                            : `Add ${selectedTaskIndices.size} Task(s) to Board`}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {onInsertTasksAsChecklist && (
                    <TouchableOpacity
                      style={[
                        styles.secondaryBtn,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                        },
                      ]}
                      onPress={() => {
                        const selectedTasks = (resultData.tasks || [])
                          .filter((_, i) => selectedTaskIndices.has(i))
                          .map((t) => ({ ...t, text: cleanClientText(t.text) }));
                        onInsertTasksAsChecklist(selectedTasks);
                        onClose();
                      }}
                    >
                      <Ionicons name="list-outline" size={16} color={colors.text} />
                      <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                        {isArabic ? 'إدراج كقائمة مهام داخل الملاحظة' : 'Insert as Checklist into Note'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetContainer: {
    maxHeight: '85%',
    minHeight: '40%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  scrollArea: {
    flexGrow: 0,
    paddingTop: 14,
  },
  contentCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryBodyText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  takeawayNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  takeawayNumberText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  takeawayText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
  },
  tasksHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  tasksCountText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  taskHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  taskItemText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  priorityText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default NoteAIResultModal;
