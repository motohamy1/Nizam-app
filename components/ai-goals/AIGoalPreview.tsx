/**
 * components/ai-goals/AIGoalPreview.tsx
 * Interactive goal preview card wrapping GoalPresentationRenderer with quick inline edits,
 * category switcher, and undo affordance.
 * Implements Section 31, 32, 61, 74 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { getAiTheme } from '@/utils/aiGoalTheme';
import { AIGoalDraft, AIGoalPresentation } from '@/types/aiGoals';
import { GoalPresentationRenderer } from './GoalPresentationRenderer';

interface AIGoalPreviewProps {
  draft: AIGoalDraft;
  timeframe: 'day' | 'month' | 'year';
  canUndo: boolean;
  onUndo: () => void;
  onUpdateGoalField: (field: 'title' | 'description' | 'color' | 'icon', value: string) => void;
  onSelectCategory: (name: string, existingCategoryId?: string, proposedNew?: boolean) => void;
  onSelectPresentation: (presentation: AIGoalPresentation) => void;
  onToggleMilestone: (id: string) => void;
  onDeleteMilestone: (id: string) => void;
  existingCategories?: string[];
  isArabic?: boolean;
}

export const AIGoalPreview: React.FC<AIGoalPreviewProps> = ({
  draft,
  timeframe,
  canUndo,
  onUndo,
  onUpdateGoalField,
  onSelectCategory,
  onSelectPresentation,
  onToggleMilestone,
  onDeleteMilestone,
  existingCategories = [],
  isArabic = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const T = getAiTheme(colors, isDarkMode);
  const styles = createStyles(T);
  // Inline edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(draft.goal.title);
  const [editDesc, setEditDesc] = useState(draft.goal.description);

  // Category picker modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');

  const handleOpenEdit = () => {
    setEditTitle(draft.goal.title);
    setEditDesc(draft.goal.description);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdateGoalField('title', editTitle.trim());
    }
    onUpdateGoalField('description', editDesc.trim());
    setIsEditModalOpen(false);
  };

  const handleSelectExistingCategory = (cat: string) => {
    onSelectCategory(cat, undefined, false);
    setIsCatModalOpen(false);
  };

  const handleAddCustomCategory = () => {
    if (customCatInput.trim()) {
      onSelectCategory(customCatInput.trim(), undefined, true);
      setCustomCatInput('');
      setIsCatModalOpen(false);
    }
  };

  const timeframeLabel =
    timeframe === 'day'
      ? isArabic ? 'هدف يومي' : 'Daily Goal'
      : timeframe === 'month'
      ? isArabic ? 'هدف شهري' : 'Monthly Goal'
      : isArabic ? 'هدف سنوي' : 'Annual Goal';

  return (
    <View style={styles.container}>
      {/* Top Meta Bar */}
      <View style={[styles.topBar, isArabic && styles.rowRtl]}>
        <View style={[styles.badgeGroup, isArabic && styles.rowRtl]}>
          <View style={styles.timeframeBadge}>
            <Ionicons
              name={timeframe === 'day' ? 'today-outline' : timeframe === 'month' ? 'calendar-outline' : 'ribbon-outline'}
              size={12}
              color={T.accent}
            />
            <Text style={styles.timeframeText}>{timeframeLabel}</Text>
          </View>

          {draft.dirtyByUser && (
            <View style={styles.editedBadge}>
              <Text style={styles.editedBadgeText}>
                {isArabic ? 'معدل' : 'Edited'}
              </Text>
            </View>
          )}
        </View>

        {/* Undo Button */}
        {canUndo && (
          <TouchableOpacity
            onPress={onUndo}
            style={[styles.undoBtn, isArabic && styles.rowRtl]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-undo-outline" size={13} color={T.textSecondary} />
            <Text style={styles.undoText}>{isArabic ? 'تراجع' : 'Undo'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Goal Presentation Card */}
      <GoalPresentationRenderer
        title={draft.goal.title}
        description={draft.goal.description}
        category={draft.category.selectedName}
        presentation={draft.presentation}
        milestones={draft.milestones}
        color={draft.color}
        icon={draft.icon}
        isArabic={isArabic}
        onToggleMilestone={onToggleMilestone}
        onDeleteMilestone={onDeleteMilestone}
        onEditGoalPress={handleOpenEdit}
        onEditCategoryPress={() => setIsCatModalOpen(true)}
      />

      {/* Inline Goal Title & Description Edit Modal */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, isArabic && styles.textRtl]}>
              {isArabic ? 'تعديل عنوان وتفاصيل الهدف' : 'Edit Goal Details'}
            </Text>

            <Text style={[styles.inputLabel, isArabic && styles.textRtl]}>
              {isArabic ? 'عنوان الهدف:' : 'Goal Title:'}
            </Text>
            <TextInput
              style={[styles.input, isArabic && styles.textRtl]}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder={isArabic ? 'اكتب عنوان الهدف...' : 'Enter goal title...'}
              placeholderTextColor={T.placeholder}
            />

            <Text style={[styles.inputLabel, isArabic && styles.textRtl]}>
              {isArabic ? 'التفاصيل / التعريف بالنجاح:' : 'Details / Definition of done:'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, isArabic && styles.textRtl]}
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder={isArabic ? 'توضيح إضافي (اختياري)...' : 'Additional context (optional)...'}
              placeholderTextColor={T.placeholder}
              multiline
              numberOfLines={3}
            />

            <View style={[styles.modalBtnRow, isArabic && styles.rowRtl]}>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>{isArabic ? 'إلغاء' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmBtnText}>{isArabic ? 'تحديث' : 'Update'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={isCatModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCatModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, isArabic && styles.textRtl]}>
              {isArabic ? 'اختيار أو إنشاء تصنيف' : 'Select or Create Category'}
            </Text>

            <ScrollView style={styles.catScroll} contentContainerStyle={styles.catList}>
              {existingCategories.map((cat, idx) => {
                const isSelected = draft.category.selectedName === cat;
                return (
                  <TouchableOpacity
                    key={`${cat}_${idx}`}
                    onPress={() => handleSelectExistingCategory(cat)}
                    style={[styles.catOption, isSelected && styles.selectedCatOption]}
                  >
                    <Text
                      style={[
                        styles.catOptionText,
                        isSelected && styles.selectedCatOptionText,
                        isArabic && styles.textRtl,
                      ]}
                    >
                      {cat}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={16} color={T.accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 12 }, isArabic && styles.textRtl]}>
              {isArabic ? 'أو تصنيف جديد:' : 'Or new category:'}
            </Text>
            <View style={[styles.customCatRow, isArabic && styles.rowRtl]}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }, isArabic && styles.textRtl]}
                value={customCatInput}
                onChangeText={setCustomCatInput}
                placeholder={isArabic ? 'اسم التصنيف...' : 'Category name...'}
                placeholderTextColor={T.placeholder}
              />
              <TouchableOpacity
                onPress={handleAddCustomCategory}
                style={[styles.confirmBtn, { paddingHorizontal: 14 }]}
              >
                <Text style={styles.confirmBtnText}>{isArabic ? 'إضافة' : 'Add'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setIsCatModalOpen(false)}
              style={[styles.cancelBtn, { marginTop: 14 }]}
            >
              <Text style={styles.cancelBtnText}>{isArabic ? 'إغلاق' : 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (T: any) => StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  textRtl: {
    textAlign: 'right',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeframeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.accentWash,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.accentBorder,
  },
  timeframeText: {
    fontSize: 11,
    fontWeight: '700',
    color: T.accent,
  },
  editedBadge: {
    backgroundColor: T.bubbleAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editedBadgeText: {
    fontSize: 10,
    color: T.textMuted,
    fontWeight: '500',
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.input,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  undoText: {
    fontSize: 11,
    color: T.textSecondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.text,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: T.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: T.input,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: T.text,
    marginBottom: 12,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: T.bubbleAlt,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    color: T.textSecondary,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: T.accentFill,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    color: T.accentFillText,
    fontWeight: '700',
  },
  catScroll: {
    maxHeight: 180,
  },
  catList: {
    gap: 6,
  },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: T.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  selectedCatOption: {
    backgroundColor: T.accentWash,
    borderColor: T.accentBorderStrong,
  },
  catOptionText: {
    fontSize: 13,
    color: T.textBody,
    fontWeight: '500',
    flex: 1,
  },
  selectedCatOptionText: {
    color: T.accent,
    fontWeight: '700',
  },
  customCatRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
});
