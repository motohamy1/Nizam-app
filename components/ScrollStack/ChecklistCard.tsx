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
      <TouchableOpacity 
        style={styles.cardHeader}
        onPress={onScrollToTasksSection}
        activeOpacity={0.8}
      >
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
                ? (isArabic ? '0/1 مهام مكتملة' : '0/1 tasks completed')
                : `${doneCount}/${totalCount} ${t.tasksCompleted || 'tasks completed'}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 2. Checklist Task Row */}
      {primaryTask ? (
        <View
          style={{
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
            borderRadius: 16,
            paddingVertical: 9,
            paddingHorizontal: 12,
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
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
              onPress={() => handleToggle(primaryTask)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: 'rgba(0,0,0,0.60)',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: primaryTask.status === 'done' ? '#000000' : 'transparent',
              }}
            >
              {primaryTask.status === 'done' && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTaskPress(primaryTask)}
              style={{ flex: 1 }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 13.5,
                  fontWeight: '800',
                  color: '#000000',
                  letterSpacing: 0.2,
                  textDecorationLine:
                    primaryTask.status === 'done' ? 'line-through' : 'none',
                  opacity: primaryTask.status === 'done' ? 0.5 : 1,
                }}
                numberOfLines={1}
              >
                {primaryTask.text}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Priority pill */}
          <View
            style={{
              backgroundColor: '#000000',
              borderRadius: 8,
              paddingHorizontal: 9,
              paddingVertical: 3.5,
              marginLeft: 8,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 10.5,
                fontWeight: '900',
                letterSpacing: 0.6,
              }}
            >
              {(primaryTask.priority || 'MEDIUM').toUpperCase()}
            </Text>
          </View>
        </View>
      ) : (
        /* Default placeholder row matching Stitch design when no tasks */
        <TouchableOpacity
          onPress={() => {
            if (onAddChecklistItem) onAddChecklistItem();
            else if (onAddNewTask) onAddNewTask();
          }}
          activeOpacity={0.85}
          style={{
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
            borderRadius: 16,
            paddingVertical: 9,
            paddingHorizontal: 12,
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
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
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: 'rgba(0,0,0,0.60)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <Text
              style={{
                fontSize: 13.5,
                fontWeight: '800',
                color: '#000000',
                letterSpacing: 0.2,
              }}
              numberOfLines={1}
            >
              {isArabic ? 'المهمة الأولى' : 'first task'}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: '#000000',
              borderRadius: 8,
              paddingHorizontal: 9,
              paddingVertical: 3.5,
              marginLeft: 8,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 10.5,
                fontWeight: '900',
                letterSpacing: 0.6,
              }}
            >
              MEDIUM
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
          else if (onAddNewTask) onAddNewTask();
        }}
        activeOpacity={0.75}
      >
        <Ionicons name="add" size={15} color="#000000" />
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#000000' }}>
          {isArabic ? '+ إضافة عنصر للقائمة' : '+ Add checklist item'}
        </Text>
      </TouchableOpacity>

      {/* 4. Action Links Row */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.12)',
          flexDirection: isArabic ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 7,
          paddingTop: 6,
        }}
      >
        <TouchableOpacity
          style={{
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 5,
          }}
          onPress={onQuickManage}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={14} color="#000000" />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: 'rgba(0,0,0,0.85)',
            }}
          >
            {t.manageTask || 'Manage Task'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onScrollToTasksSection}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: 'rgba(0,0,0,0.85)',
            }}
          >
            {isArabic ? 'اضغط لعرض لوحة المهام' : 'Tap to view task board'}{' '}
            <Text style={{ color: '#000000', fontWeight: '900' }}>↓</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. Big Stats Counters Row */}
      <View
        style={{
          flexDirection: isArabic ? 'row-reverse' : 'row',
          alignItems: 'baseline',
          gap: 22,
          marginTop: 5,
        }}
      >
        <View
          style={{
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'baseline',
            gap: 4,
          }}
        >
          <Text
            style={{
              fontSize: 34,
              fontWeight: '900',
              color: '#000000',
              letterSpacing: -0.6,
              lineHeight: 38,
            }}
          >
            {streakScore}
          </Text>
          <Text style={{ fontSize: 18 }}>🔥</Text>
        </View>

        <View
          style={{
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'baseline',
            gap: 4,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: '#000000',
              letterSpacing: -0.5,
              lineHeight: 32,
            }}
          >
            {notesCount}
          </Text>
          <Text style={{ fontSize: 16 }}>💬</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

export default ChecklistCard;

