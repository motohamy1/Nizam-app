import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { 
  createScrollStackStyles, 
  STACK_CARD_PALETTES, 
  createMonthCardFrame, 
  MonthPalette 
} from '@/assets/styles/scrollStack.styles';
import { Id } from '@/convex/_generated/dataModel';

export interface ChecklistTaskItem {
  _id: Id<"todos">;
  text: string;
  status?: string;
  priority?: string;
  dueDate?: number;
  kind?: 'task' | 'checklist';
  linkedCount?: number;
}

interface ChecklistCardProps {
  tasks: ChecklistTaskItem[];
  doneCount: number;
  totalCount: number;
  onToggleTask: (id: Id<"todos">, currentStatus: string) => void;
  onOpenTaskDetail: (id: Id<"todos">) => void;
  onQuickManage: () => void;
  onScrollToTasksSection: () => void;
  onAddNewTask?: () => void;
  onAddChecklistItem?: () => void;
  onOpenChecklistItem?: (id: Id<"todos">) => void;
  palette?: MonthPalette;
}

// To-Do pink → checklist rose. The card face gradients from the saturated
// To-Do pastel under the header down to a second rose behind the checklist
// rows. Light mode fades UP to a softer pink; dark mode uses the deep
// saturated rose (#BE185D) as its face color and pushes DOWN into its own
// darkest degree (#500724) — high contrast within the same hue. Rows ride
// on white chips so content keeps real contrast on both ends.
const GRAD_TOP_LIGHT = '#F9A8D4';
const GRAD_BOTTOM_LIGHT = '#FBCFE8';
const GRAD_TOP_DARK = '#BE185D';
const GRAD_BOTTOM_DARK = '#500724';
const ROW_TASK_BG = 'rgba(255,255,255,0.85)';      // To-Do task rows: firm white
const ROW_CHECKLIST_BG = 'rgba(255,255,255,0.55)'; // checklist rows: milky rose
const ROW_BORDER = 'rgba(131,24,67,0.14)';         // pink-900 hairline
const CHIP_BG = 'rgba(255,255,255,0.75)';
const CHIP_INK = '#831843';                        // pink-900 text on white chips

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  tasks,
  doneCount,
  totalCount,
  onToggleTask,
  onOpenTaskDetail,
  onQuickManage,
  onScrollToTasksSection,
  onAddNewTask,
  onAddChecklistItem,
  onOpenChecklistItem,
  palette = STACK_CARD_PALETTES.checklist,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);
  const frame = createMonthCardFrame(palette, isDarkMode, colors);

  const gradTop = isDarkMode ? GRAD_TOP_DARK : GRAD_TOP_LIGHT;
  const gradBottom = isDarkMode ? GRAD_BOTTOM_DARK : GRAD_BOTTOM_LIGHT;
  // Elements over the deep end of the gradient need light inks in dark mode.
  const footInk = isDarkMode ? '#FCE7F3' : CHIP_INK;
  const footBorder = isDarkMode ? 'rgba(255,255,255,0.24)' : 'rgba(80,7,36,0.14)';
  // Header sits on the face color: berry ink on light pink, white on deep rose.
  const headInk = isDarkMode ? '#FFFFFF' : frame.text;
  const headSubInk = isDarkMode ? 'rgba(252,231,243,0.82)' : 'rgba(80,7,36,0.72)';
  const cardEdge = isDarkMode ? 'rgba(255,255,255,0.16)' : frame.cardBorder;

  const renderRow = (task: ChecklistTaskItem) => {
    const isDone = task.status === 'done';
    const isChecklistItem = task.kind === 'checklist';

    return (
      <View
        key={task._id}
        style={[
          styles.checklistItem,
          {
            backgroundColor: isChecklistItem ? ROW_CHECKLIST_BG : ROW_TASK_BG,
            borderColor: ROW_BORDER,
          },
        ]}
      >
        <View style={styles.checklistItemLeft}>
          {/* Interactive Checkbox */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onToggleTask(task._id, task.status || 'not_started');
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.checkbox, 
              isChecklistItem && { borderRadius: 11 },
              { borderColor: 'rgba(80,7,36,0.35)' },
              isDone && { backgroundColor: frame.accent, borderColor: frame.accent }
            ]}
          >
            {isDone && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </TouchableOpacity>

          {/* Text: tasks open TaskDetailModal, checklist items open ChecklistItemModal */}
          <TouchableOpacity
            onPress={() => {
              if (isChecklistItem && onOpenChecklistItem) onOpenChecklistItem(task._id);
              else onOpenTaskDetail(task._id);
            }}
            style={{ flex: 1 }}
            activeOpacity={0.7}
          >
            <Text 
              style={[
                styles.checkItemText, 
                { color: frame.text, fontWeight: '700' },
                isDone && { textDecorationLine: 'line-through', opacity: 0.45 }
              ]}
              numberOfLines={1}
            >
              {task.text}
            </Text>
          </TouchableOpacity>
        </View>

        {isChecklistItem ? (
          <View style={[styles.kindDot, { backgroundColor: 'rgba(80,7,36,0.08)' }]}>
            <Ionicons
              name={(task.linkedCount || 0) > 0 ? 'git-branch-outline' : 'list-outline'}
              size={11}
              color={CHIP_INK}
            />
            {(task.linkedCount || 0) > 0 && (
              <Text style={[styles.kindDotText, { color: CHIP_INK }]}>{task.linkedCount}</Text>
            )}
          </View>
        ) : (
          task.priority && (
            <View style={[styles.priorityTag, { backgroundColor: 'rgba(80,7,36,0.08)' }]}>
              <Text style={[styles.priorityTagText, { color: CHIP_INK }]}>
                {task.priority}
              </Text>
            </View>
          )
        )}
      </View>
    );
  };

  const taskRows = tasks.filter((x) => x.kind !== 'checklist');
  const ckRows = tasks.filter((x) => x.kind === 'checklist');
  const mixed = taskRows.length > 0 && ckRows.length > 0;

  return (
    <LinearGradient
      colors={[gradTop, gradBottom]}
      style={[styles.card, { borderColor: cardEdge, overflow: 'hidden' }]}
    >
      {/* Header - Tapping triggers scroll to full Tasks section */}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={onScrollToTasksSection}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: CHIP_BG }]}>
            <Ionicons name="checkmark-done" size={20} color={CHIP_INK} />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={[styles.cardTitle, { color: headInk }]}>{t.todaysChecklist}</Text>
            <Text style={[styles.cardSubtitle, { color: headSubInk }]}>
              {totalCount === 0
                ? (isArabic ? 'لا توجد مهام مجدولة' : '0 tasks scheduled')
                : `${doneCount}/${totalCount} ${t.tasksCompleted}`}
            </Text>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          <View style={[styles.headerPill, { backgroundColor: CHIP_BG }]}>
            <Ionicons name="arrow-down-circle-outline" size={14} color={CHIP_INK} />
            <Text style={[styles.headerPillText, { color: CHIP_INK, fontWeight: '800' }]}>{t.tabTodo}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Body: Checklist Tasks with Internal Nested Scroll to Prevent Overflow */}
      {tasks.length === 0 ? (
        <View style={styles.emptyCardContent}>
          <Ionicons name="sparkles-outline" size={28} color={isDarkMode ? '#FBCFE8' : frame.accent} />
          <Text style={[styles.emptyCardTitle, { color: headInk }]}>{t.noTasksTodayChecklist}</Text>
          {(onAddNewTask || onAddChecklistItem) && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {onAddNewTask && (
                <TouchableOpacity 
                  style={[styles.emptyCardBtn, { backgroundColor: CHIP_BG, borderColor: ROW_BORDER }]} 
                  onPress={onAddNewTask} 
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color={CHIP_INK} />
                  <Text style={[styles.emptyCardBtnText, { color: CHIP_INK }]}>{t.startTask}</Text>
                </TouchableOpacity>
              )}
              {onAddChecklistItem && (
                <TouchableOpacity 
                  style={[styles.emptyCardBtn, { backgroundColor: CHIP_BG, borderColor: ROW_BORDER }]} 
                  onPress={onAddChecklistItem} 
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkbox-outline" size={16} color={CHIP_INK} />
                  <Text style={[styles.emptyCardBtnText, { color: CHIP_INK }]}>{t.addChecklistItemBtn}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.checklistScrollView}
          contentContainerStyle={styles.checklistScrollContent}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
          decelerationRate="fast"
          scrollEventThrottle={16}
        >
          {mixed && (
            <View style={[local.sectionPill, isArabic && local.sectionPillRtl, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.30)' }]}>
              <Text style={local.sectionLabel}>{t.tabTodo}</Text>
            </View>
          )}
          {(mixed ? taskRows : tasks).map(renderRow)}
          {mixed && (
            <LinearGradient
              colors={isDarkMode
                ? [`${gradTop}00`, '#FBCFE8', `${gradTop}00`]
                : [`${gradTop}00`, '#BE185D', `${gradBottom}00`]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={local.ribbon}
            />
          )}
          {mixed && (
            <View style={[local.sectionPill, local.sectionPillLate, isArabic && local.sectionPillRtl, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.24)' }]}>
              <Text style={local.sectionLabel}>
                {isArabic ? 'قائمة التحقق' : 'Checklist'}
              </Text>
            </View>
          )}
          {mixed && ckRows.map(renderRow)}
        </ScrollView>
      )}

      {/* Add Checklist Item entry point */}
      {onAddChecklistItem && tasks.length > 0 && (
        <TouchableOpacity
          style={[
            styles.checklistAddRow,
            isDarkMode
              ? { borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.12)' }
              : { borderColor: ROW_BORDER, backgroundColor: 'rgba(255,255,255,0.45)' },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAddChecklistItem();
          }}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={14} color={isDarkMode ? '#FCE7F3' : CHIP_INK} />
          <Text style={[styles.checklistAddRowText, { color: isDarkMode ? '#FCE7F3' : CHIP_INK }]}>{t.addChecklistItemBtn}</Text>
        </TouchableOpacity>
      )}

      {/* Footer: Quick Manage Icon & Scroll Hint */}
      <View style={[styles.cardFooter, { borderTopColor: footBorder }]}>
        <TouchableOpacity 
          style={styles.footerActionBtn}
          onPress={onQuickManage}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={footInk} />
          <Text style={[styles.footerActionText, { color: footInk }]}>{t.manageTask}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onScrollToTasksSection}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[styles.footerHintText, { color: footInk, fontWeight: '800' }]}>{t.tapToScrollTasks} ↓</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const local = StyleSheet.create({
  sectionPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
    marginBottom: 2,
  },
  sectionPillLate: {
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  sectionPillRtl: {
    alignSelf: 'flex-end',
  },
  sectionLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#4A0722',
  },
  ribbon: {
    height: 2.5,
    borderRadius: 1.25,
    marginTop: 10,
    marginBottom: 2,
    opacity: 0.6,
  },
});

export default ChecklistCard;
