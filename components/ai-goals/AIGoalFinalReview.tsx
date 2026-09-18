/**
 * components/ai-goals/AIGoalFinalReview.tsx
 * Final structured review sheet showing all staged goals + active draft,
 * with options to stage another goal or confirm and save all to Nizam.
 * Implements Section 46-50 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StagedGoal, AIGoalDraft } from '@/types/aiGoals';
import { getFrameworkDefinition, getVisualStyleDefinition } from '@/constants/aiGoalTemplates';

interface AIGoalFinalReviewProps {
  stagedGoals: StagedGoal[];
  activeDraft: AIGoalDraft | null;
  isSaving: boolean;
  onStageAndNext: () => void;
  onSaveAll: () => void;
  onRemoveStagedGoal: (id: string) => void;
  isArabic?: boolean;
}

export const AIGoalFinalReview: React.FC<AIGoalFinalReviewProps> = ({
  stagedGoals,
  activeDraft,
  isSaving,
  onStageAndNext,
  onSaveAll,
  onRemoveStagedGoal,
  isArabic = false,
}) => {
  const totalCount = stagedGoals.length + (activeDraft && activeDraft.goal.title.trim() ? 1 : 0);

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={[styles.headerRow, isArabic && styles.rowRtl]}>
        <View style={[styles.badgeWithIcon, isArabic && styles.rowRtl]}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
          <Text style={styles.headerTitle}>
            {isArabic
              ? `جاهز للحفظ (${totalCount} ${totalCount === 1 ? 'هدف' : 'أهداف'})`
              : `Ready to Save (${totalCount} Goal${totalCount === 1 ? '' : 's'})`}
          </Text>
        </View>
      </View>

      {/* Staged Goals List */}
      <View style={styles.goalsList}>
        {stagedGoals.map((g) => {
          const fwMeta = getFrameworkDefinition(g.templateId as any);
          const styleMeta = getVisualStyleDefinition((g.visualStyleId || 'default') as any);
          const fwName = isArabic ? fwMeta?.nameAr || g.templateId : fwMeta?.name || g.templateId;
          const styleName = isArabic ? styleMeta?.nameAr || g.visualStyleId : styleMeta?.name || g.visualStyleId;

          return (
            <View key={g.id} style={[styles.goalRow, isArabic && styles.rowRtl]}>
              <View style={styles.goalInfo}>
                <Text style={[styles.goalText, isArabic && styles.textRtl]}>{g.text}</Text>
                <View style={[styles.badgesRow, isArabic && styles.rowRtl]}>
                  <Text style={styles.catBadge}>{g.category}</Text>
                  <Text style={styles.layoutBadge}>{`${fwName} (${styleName})`}</Text>
                  {g.milestones.length > 0 && (
                    <Text style={styles.milestoneBadge}>
                      {g.milestones.length} {isArabic ? 'مراحل' : 'steps'}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => onRemoveStagedGoal(g.id)}
                style={styles.removeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Active Draft representation */}
        {activeDraft && activeDraft.goal.title.trim() && (
          <View style={[styles.goalRow, styles.activeDraftRow, isArabic && styles.rowRtl]}>
            <View style={styles.goalInfo}>
              <Text style={[styles.goalText, isArabic && styles.textRtl]}>
                {activeDraft.goal.title}
              </Text>
              <View style={[styles.badgesRow, isArabic && styles.rowRtl]}>
                <Text style={styles.catBadge}>{activeDraft.category.selectedName}</Text>
                <Text style={styles.layoutBadge}>
                  {activeDraft.presentation.frameworkId} ({activeDraft.presentation.visualStyleId})
                </Text>
                {activeDraft.milestones.length > 0 && (
                  <Text style={styles.milestoneBadge}>
                    {activeDraft.milestones.length} {isArabic ? 'مراحل' : 'steps'}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.currentIndicator}>
              <Text style={styles.currentText}>{isArabic ? 'الحالي' : 'Current'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {/* Button 1: Stage current and create another goal */}
        <TouchableOpacity
          onPress={onStageAndNext}
          style={[styles.stageBtn, isArabic && styles.rowRtl]}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color="#EA580C" />
          <Text style={styles.stageBtnText}>
            {isArabic ? 'إضافة هذا الهدف وتصميم هدف آخر' : 'Add Goal & Shape Another'}
          </Text>
        </TouchableOpacity>

        {/* Button 2: Save All to Plan */}
        <TouchableOpacity
          onPress={onSaveAll}
          disabled={isSaving || totalCount === 0}
          style={[
            styles.saveAllBtn,
            isSaving || totalCount === 0 ? styles.saveBtnDisabled : styles.saveBtnActive,
            isArabic && styles.rowRtl,
          ]}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveAllBtnText}>
                {isArabic
                  ? `حفظ الكل في الخطة (${totalCount})`
                  : `Save All to Plan (${totalCount})`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  textRtl: {
    textAlign: 'right',
  },
  badgeWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  goalsList: {
    gap: 8,
    marginBottom: 14,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeDraftRow: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  goalInfo: {
    flex: 1,
  },
  goalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  catBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  layoutBadge: {
    fontSize: 10,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  milestoneBadge: {
    fontSize: 10,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  removeBtn: {
    padding: 4,
  },
  currentIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FFEDD5',
  },
  currentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
  },
  actionsContainer: {
    gap: 8,
  },
  stageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 10,
  },
  stageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
  saveAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveBtnActive: {
    backgroundColor: '#EA580C',
  },
  saveBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  saveAllBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
