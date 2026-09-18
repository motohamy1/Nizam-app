import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  return (
    <View style={[styles.card, { backgroundColor: frame.cardBg, borderColor: frame.cardBorder }]}>
      {/* Header - Tapping triggers scroll to full Tasks section */}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={onScrollToTasksSection}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: frame.badgeBg }]}>
            <Ionicons name="checkmark-done" size={20} color={frame.badgeFg} />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={[styles.cardTitle, { color: frame.text }]}>{t.todaysChecklist}</Text>
            <Text style={[styles.cardSubtitle, { color: frame.textMuted }]}>
              {totalCount === 0
                ? (isArabic ? 'لا توجد مهام مجدولة' : '0 tasks scheduled')
                : `${doneCount}/${totalCount} ${t.tasksCompleted}`}
            </Text>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          <View style={[styles.headerPill, { backgroundColor: frame.pillBg }]}>
            <Ionicons name="arrow-down-circle-outline" size={14} color={frame.pillFg} />
            <Text style={[styles.headerPillText, { color: frame.pillFg }]}>{t.tabTodo}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Body: Checklist Tasks with Internal Nested Scroll to Prevent Overflow */}
      {tasks.length === 0 ? (
        <View style={styles.emptyCardContent}>
          <Ionicons name="sparkles-outline" size={28} color={frame.accent} />
          <Text style={[styles.emptyCardTitle, { color: frame.text }]}>{t.noTasksTodayChecklist}</Text>
          {(onAddNewTask || onAddChecklistItem) && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {onAddNewTask && (
                <TouchableOpacity 
                  style={[styles.emptyCardBtn, { backgroundColor: frame.pillBg, borderColor: frame.cardBorder }]} 
                  onPress={onAddNewTask} 
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color={frame.text} />
                  <Text style={[styles.emptyCardBtnText, { color: frame.text }]}>{t.startTask}</Text>
                </TouchableOpacity>
              )}
              {onAddChecklistItem && (
                <TouchableOpacity 
                  style={[styles.emptyCardBtn, { backgroundColor: frame.pillBg, borderColor: frame.cardBorder }]} 
                  onPress={onAddChecklistItem} 
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkbox-outline" size={16} color={frame.text} />
                  <Text style={[styles.emptyCardBtnText, { color: frame.text }]}>{t.addChecklistItemBtn}</Text>
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
          {tasks.map((task) => {
            const isDone = task.status === 'done';
            const isChecklistItem = task.kind === 'checklist';

            return (
              <View 
                key={task._id} 
                style={[styles.checklistItem, { backgroundColor: frame.rowBg, borderColor: frame.rowBorder }]}
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
                      { borderColor: frame.textMuted },
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
                        { color: frame.text },
                        isDone && { textDecorationLine: 'line-through', opacity: 0.45 }
                      ]}
                      numberOfLines={1}
                    >
                      {task.text}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isChecklistItem ? (
                  <View style={[styles.kindDot, { backgroundColor: frame.pillBg }]}>
                    <Ionicons
                      name={(task.linkedCount || 0) > 0 ? 'git-branch-outline' : 'list-outline'}
                      size={11}
                      color={frame.text}
                    />
                    {(task.linkedCount || 0) > 0 && (
                      <Text style={[styles.kindDotText, { color: frame.text }]}>{task.linkedCount}</Text>
                    )}
                  </View>
                ) : (
                  task.priority && (
                    <View style={[styles.priorityTag, { backgroundColor: frame.pillBg }]}>
                      <Text style={[styles.priorityTagText, { color: frame.text }]}>
                        {task.priority}
                      </Text>
                    </View>
                  )
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add Checklist Item entry point */}
      {onAddChecklistItem && tasks.length > 0 && (
        <TouchableOpacity
          style={[styles.checklistAddRow, { borderColor: frame.textMuted, backgroundColor: isDarkMode ? undefined : frame.pillBg }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAddChecklistItem();
          }}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={14} color={frame.text} />
          <Text style={[styles.checklistAddRowText, { color: frame.text }]}>{t.addChecklistItemBtn}</Text>
        </TouchableOpacity>
      )}

      {/* Footer: Quick Manage Icon & Scroll Hint */}
      <View style={[styles.cardFooter, { borderTopColor: frame.footerBorder }]}>
        <TouchableOpacity 
          style={styles.footerActionBtn}
          onPress={onQuickManage}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={frame.footerText} />
          <Text style={[styles.footerActionText, { color: frame.footerText }]}>{t.manageTask}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onScrollToTasksSection}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[styles.footerHintText, { color: frame.text, fontWeight: '700' }]}>{t.tapToScrollTasks} ↓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChecklistCard;
