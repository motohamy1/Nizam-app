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
  streakScore?: string | number;
  notesCount?: string | number;
}

// Vibrant Brand Electric Orange matching Stitch design (#ff5c16)
const GRAD_TOP = '#ff5c16';
const GRAD_BOTTOM = '#ff4a00';

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
  streakScore = '1,245',
  notesCount = '186',
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);

  const displayTasks = tasks.length > 0 ? tasks : [];
  const primaryTask = displayTasks[0];
  const pendingCount = Math.max(0, totalCount - doneCount);

  const handleToggle = (task: ChecklistTaskItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleTask(task._id, task.status || 'not_started');
  };

  const handleTaskPress = (task: ChecklistTaskItem) => {
    if (task.kind === 'checklist' && onOpenChecklistItem) {
      onOpenChecklistItem(task._id);
    } else {
      onOpenTaskDetail(task._id);
    }
  };

  return (
    <LinearGradient
      colors={[GRAD_TOP, GRAD_BOTTOM]}
      style={[styles.card, { borderColor: 'rgba(0,0,0,0.12)', overflow: 'hidden' }]}
    >
      {/* 1. Header Row */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          {/* Rounded square checkmark badge */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 13,
              backgroundColor: 'rgba(0,0,0,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Ionicons name="checkmark" size={20} color="#000000" />
          </View>
          <View style={[{ flex: 1, minWidth: 0 }, isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '900',
                color: '#000000',
                letterSpacing: -0.3,
                lineHeight: 21,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t.todaysChecklist || "Today's Checklist"}
            </Text>
            <Text
              style={{
                fontSize: 11.5,
                fontWeight: '700',
                color: 'rgba(0,0,0,0.75)',
                marginTop: 1,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {totalCount === 0
                ? (isArabic ? 'لا توجد عناصر بعد' : 'No items yet')
                : `${doneCount}/${totalCount} ${isArabic ? 'عناصر مكتملة' : 'items completed'}`}
            </Text>
          </View>
        </View>

        {/* Quick Manage / List Options button on header */}
        {onQuickManage && (
          <TouchableOpacity
            style={{
              flexDirection: isArabic ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: 'rgba(0,0,0,0.14)',
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 10,
            }}
            onPress={onQuickManage}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="create-outline" size={13} color="#000000" />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: 'rgba(0,0,0,0.85)',
              }}
            >
              {isArabic ? 'خيارات' : 'Options'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Checklist Items List / Rows (Checklist items ONLY) */}
      {displayTasks.length > 0 ? (
        <ScrollView
          style={{ maxHeight: 96, marginTop: 4 }}
          contentContainerStyle={{ gap: 6 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {displayTasks.map((item) => (
            <View
              key={item._id}
              style={{
                backgroundColor: 'rgba(0,0,0,0.15)',
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.08)',
                borderRadius: 14,
                paddingVertical: 7,
                paddingHorizontal: 11,
                flexDirection: isArabic ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 10,
                  flex: 1,
                }}
              >
                <TouchableOpacity
                  onPress={() => handleToggle(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: 'rgba(0,0,0,0.60)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: item.status === 'done' ? '#000000' : 'transparent',
                  }}
                >
                  {item.status === 'done' && (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleTaskPress(item)}
                  style={{ flex: 1 }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '800',
                      color: '#000000',
                      letterSpacing: 0.2,
                      textDecorationLine:
                        item.status === 'done' ? 'line-through' : 'none',
                      opacity: item.status === 'done' ? 0.5 : 1,
                    }}
                    numberOfLines={1}
                  >
                    {item.text}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Linked count badge or Priority pill */}
              {item.linkedCount && item.linkedCount > 0 ? (
                <View
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.22)',
                    borderRadius: 7,
                    paddingHorizontal: 7,
                    paddingVertical: 2.5,
                    flexDirection: isArabic ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 3,
                    marginLeft: 6,
                  }}
                >
                  <Ionicons name="link" size={10} color="#000000" />
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#000000' }}>
                    {item.linkedCount}
                  </Text>
                </View>
              ) : item.priority ? (
                <View
                  style={{
                    backgroundColor: '#000000',
                    borderRadius: 7,
                    paddingHorizontal: 7,
                    paddingVertical: 2.5,
                    marginLeft: 6,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 9.5,
                      fontWeight: '900',
                      letterSpacing: 0.5,
                    }}
                  >
                    {item.priority.toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : (
        /* Default placeholder row when no checklist items */
        <TouchableOpacity
          onPress={() => {
            if (onAddChecklistItem) onAddChecklistItem();
          }}
          activeOpacity={0.85}
          style={{
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
            borderRadius: 14,
            paddingVertical: 8,
            paddingHorizontal: 11,
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <View
            style={{
              flexDirection: isArabic ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 10,
              flex: 1,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: 'rgba(0,0,0,0.60)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: 'rgba(0,0,0,0.65)',
                letterSpacing: 0.2,
              }}
              numberOfLines={1}
            >
              {isArabic ? 'أضف أول عنصر في قائمتك...' : 'Add your first checklist item...'}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: '#000000',
              borderRadius: 7,
              paddingHorizontal: 8,
              paddingVertical: 2.5,
              marginLeft: 6,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 9.5,
                fontWeight: '900',
                letterSpacing: 0.5,
              }}
            >
              {isArabic ? 'جديد' : 'NEW'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* 3. Add Checklist Item Dashed Button */}
      <TouchableOpacity
        style={{
          width: '100%',
          borderWidth: 1.6,
          borderStyle: 'dashed',
          borderColor: 'rgba(0,0,0,0.30)',
          borderRadius: 16,
          paddingVertical: 8,
          flexDirection: isArabic ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 7,
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (onAddChecklistItem) onAddChecklistItem();
        }}
        activeOpacity={0.75}
      >
        <Ionicons name="add" size={15} color="#000000" />
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#000000' }}>
          {isArabic ? '+ إضافة عنصر للقائمة' : '+ Add checklist item'}
        </Text>
      </TouchableOpacity>

      {/* 4. Bottom Checklist Stats: Done (at beginning) & Not Done Yet (at end) */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.12)',
          flexDirection: isArabic ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 6,
          paddingTop: 8,
        }}
      >
        {/* Beginning Number: Total checklist items checked as done each day */}
        <View
          style={{
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              backgroundColor: 'rgba(0,0,0,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="checkmark-done" size={18} color="#000000" />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '900',
                color: '#000000',
                letterSpacing: -0.6,
                lineHeight: 28,
              }}
            >
              {doneCount}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: 'rgba(0,0,0,0.72)',
                textTransform: 'uppercase',
                letterSpacing: 0.3,
              }}
            >
              {isArabic ? 'المكتملة اليوم' : 'Done Today'}
            </Text>
          </View>
        </View>

        {/* End Number: Checklist items that aren't done yet */}
        <View
          style={{
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <View style={isArabic ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '900',
                color: '#000000',
                letterSpacing: -0.6,
                lineHeight: 28,
              }}
            >
              {pendingCount}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: 'rgba(0,0,0,0.72)',
                textTransform: 'uppercase',
                letterSpacing: 0.3,
              }}
            >
              {isArabic ? 'غير المكتملة' : 'Not Done'}
            </Text>
          </View>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              backgroundColor: 'rgba(0,0,0,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="time-outline" size={18} color="#000000" />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

export default ChecklistCard;

