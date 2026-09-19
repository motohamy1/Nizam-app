/**
 * components/ai-goals/GoalCardDetailView.tsx
 * Renders individual confirmed goals in the goals list with distinct frameworks and visual styles:
 * - Frameworks: roadmap (connected milestone rail), checklist, metric (gauge/progress bar), sprint, pillar
 * - Visual Styles: paper (fabric/paper texture, dashed border, paper tape), notebook (spiral binding holes),
 *   book (bookmark ribbon, spine border), glass (frosted blur surface, glowing border),
 *   dark-capsule (rounded modern animated card, neon border), editorial (high-contrast, hard drop-shadow), minimal
 * Implements Section 11, 14, 15, 39-41 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { getAiTheme } from '@/utils/aiGoalTheme';
import { GoalLinkedTasks } from '@/components/GoalLinkedTasks';
import { AIGoalFrameworkId, AIGoalVisualStyleId, MilestoneItem } from '@/types/aiGoals';

interface GoalCardDetailViewProps {
  goal: any;
  isArabic: boolean;
  isDarkMode: boolean;
  colors: any;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onToggleGoal: () => void;
  onToggleMilestone: (milestoneId: string) => void;
  onAddSubMilestone: () => void;
  newMilestoneText: string;
  onChangeNewMilestoneText: (text: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenTaskDetail: (taskId: any) => void;
}

export const GoalCardDetailView: React.FC<GoalCardDetailViewProps> = ({
  goal,
  isArabic,
  isDarkMode,
  colors,
  isExpanded,
  onToggleExpansion,
  onToggleGoal,
  onToggleMilestone,
  onAddSubMilestone,
  newMilestoneText,
  onChangeNewMilestoneText,
  onEdit,
  onDelete,
  onOpenTaskDetail,
}) => {
  const T = getAiTheme(colors, isDarkMode);
  const styles = createStyles(T);
  const milestones: MilestoneItem[] = goal.milestones || [];
  const completedMilestones = milestones.filter((m) => m.isCompleted).length;
  const totalMilestones = milestones.length;
  const progressPercent =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : goal.isCompleted
      ? 100
      : 0;

  const frameworkId: AIGoalFrameworkId = (goal.templateId as AIGoalFrameworkId) || 'roadmap';
  const rawStyle = goal.visualStyleId as AIGoalVisualStyleId | undefined;

  // Graceful fallback style based on framework if visualStyleId is not explicitly set
  const visualStyleId: AIGoalVisualStyleId =
    rawStyle && rawStyle !== 'default'
      ? rawStyle
      : frameworkId === 'roadmap'
      ? 'glass'
      : frameworkId === 'checklist'
      ? 'paper'
      : frameworkId === 'metric'
      ? 'editorial'
      : frameworkId === 'sprint'
      ? 'dark-capsule'
      : frameworkId === 'pillar'
      ? 'book'
      : 'paper';

  const accentColor = goal.color || '#2563EB';
  const theme = getCardTheme(visualStyleId, accentColor, isDarkMode, colors);

  // ─── Framework Content Renderers ─────────────────────────────────────────────

  const renderMilestonesContent = () => {
    if (milestones.length === 0) return null;

    if (frameworkId === 'roadmap') {
      return (
        <View style={styles.milestonesListContainer}>
          {milestones.map((ms, idx) => {
            const isLast = idx === milestones.length - 1;
            return (
              <View
                key={ms.id}
                style={[
                  styles.roadmapRow,
                  isArabic && styles.rowReverse,
                ]}
              >
                {/* Connected Rail + Node */}
                <View style={styles.roadmapNodeCol}>
                  <TouchableOpacity
                    onPress={() => onToggleMilestone(ms.id)}
                    style={[
                      styles.roadmapCircleNode,
                      {
                        borderColor: ms.isCompleted ? '#10B981' : accentColor,
                        backgroundColor: ms.isCompleted ? '#10B981' : theme.nodeBg,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    {ms.isCompleted ? (
                      <Ionicons name="checkmark" size={12} color={T.accentFillText} />
                    ) : (
                      <Text style={[styles.roadmapNodeIndex, { color: theme.nodeText }]}>
                        {idx + 1}
                      </Text>
                    )}
                  </TouchableOpacity>
                  {!isLast && (
                    <View
                      style={[
                        styles.roadmapRailLine,
                        {
                          backgroundColor: ms.isCompleted ? '#10B98180' : theme.railColor,
                        },
                      ]}
                    />
                  )}
                </View>

                {/* Milestone Text */}
                <TouchableOpacity
                  style={[styles.milestoneTextContainer, isArabic && styles.alignRight]}
                  onPress={() => onToggleMilestone(ms.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.milestoneCheckText,
                      {
                        color: ms.isCompleted ? theme.textMuted : theme.textColor,
                        textDecorationLine: ms.isCompleted ? 'line-through' : 'none',
                        opacity: ms.isCompleted ? 0.6 : 1,
                        textAlign: isArabic ? 'right' : 'left',
                      },
                    ]}
                  >
                    {ms.text}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      );
    }

    // Default & Checklist & Sprint & Pillar Milestones List
    return (
      <View style={styles.milestonesListContainer}>
        {milestones.map((ms, idx) => (
          <TouchableOpacity
            key={ms.id}
            style={[styles.milestoneCheckRow, isArabic && styles.rowReverse]}
            onPress={() => onToggleMilestone(ms.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={ms.isCompleted ? 'checkbox' : 'square-outline'}
              size={18}
              color={ms.isCompleted ? '#10B981' : theme.textMuted}
            />

            {frameworkId === 'pillar' && (
              <View
                style={[
                  styles.pillarStepBadge,
                  { backgroundColor: accentColor + '20' },
                ]}
              >
                <Text style={[styles.pillarStepText, { color: accentColor }]}>
                  P{idx + 1}
                </Text>
              </View>
            )}

            {visualStyleId === 'editorial' && (
              <Text style={[styles.editorialStepNum, { color: accentColor }]}>
                {String(idx + 1).padStart(2, '0')}.
              </Text>
            )}

            <Text
              style={[
                styles.milestoneCheckText,
                {
                  color: ms.isCompleted ? theme.textMuted : theme.textColor,
                  textDecorationLine: ms.isCompleted ? 'line-through' : 'none',
                  opacity: ms.isCompleted ? 0.6 : 1,
                  textAlign: isArabic ? 'right' : 'left',
                },
              ]}
            >
              {ms.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.cardContainer,
        theme.card,
        goal.isCompleted && styles.completedCard,
        // Visual Style specific container tweaks
        visualStyleId === 'book' && (isArabic ? styles.bookSpineAr : styles.bookSpine),
        visualStyleId === 'paper' && styles.paperCard,
        visualStyleId === 'notebook' && styles.notebookCard,
        visualStyleId === 'dark-capsule' && styles.capsuleCard,
        visualStyleId === 'editorial' && styles.editorialCard,
      ]}
    >
      {/* ─── Visual Style Physical Decorations ─── */}

      {/* 1. Paper: Paper Tape Ornament at Top */}
      {visualStyleId === 'paper' && (
        <View style={styles.paperTapeStrip}>
          <View style={styles.paperTapeInner} />
        </View>
      )}

      {/* 2. Book: Bookmark Ribbon hanging over top edge */}
      {visualStyleId === 'book' && (
        <View
          style={[
            styles.bookmarkRibbon,
            { backgroundColor: accentColor },
            isArabic ? { left: 24 } : { right: 24 },
          ]}
        >
          <View style={styles.ribbonNotch} />
        </View>
      )}

      {/* 3. Notebook: Spiral Punched Holes on the leading edge */}
      {visualStyleId === 'notebook' && (
        <View
          style={[
            styles.notebookSpiralsCol,
            isArabic ? { right: 8 } : { left: 8 },
          ]}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.notebookHole,
                {
                  backgroundColor: isDarkMode ? '#121218' : '#CBD5E1',
                  borderColor: isDarkMode ? '#2D2D3E' : '#94A3B8',
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* ─── Main Goal Card Header & Title ─── */}
      <View
        style={[
          styles.mainHeaderRow,
          isArabic && styles.rowReverse,
          visualStyleId === 'notebook' && (isArabic ? { paddingRight: 20 } : { paddingLeft: 20 }),
        ]}
      >
        {/* Goal Checkbox Button */}
        <TouchableOpacity
          onPress={onToggleGoal}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.goalCheckboxBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name={goal.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={goal.isCompleted ? '#10B981' : theme.textMuted}
          />
        </TouchableOpacity>

        {/* Title, Description & Badges */}
        <View style={styles.titleColumn}>
          <Text
            style={[
              styles.goalTitle,
              theme.titleText,
              goal.isCompleted && styles.completedTitleText,
              { textAlign: isArabic ? 'right' : 'left' },
            ]}
          >
            {goal.text}
          </Text>

          {Boolean(goal.description) && (
            <Text
              style={[
                styles.goalDesc,
                { color: theme.textMuted, textAlign: isArabic ? 'right' : 'left' },
              ]}
              numberOfLines={2}
            >
              {goal.description}
            </Text>
          )}

          {/* Metric Progress Bar (Prominent Gauge) */}
          {frameworkId === 'metric' && (
            <View style={styles.metricBarContainer}>
              <View
                style={[
                  styles.metricTrack,
                  { backgroundColor: isDarkMode ? '#27272A' : '#E2E8F0' },
                ]}
              >
                <View
                  style={[
                    styles.metricFill,
                    {
                      width: `${Math.max(progressPercent, 4)}%`,
                      backgroundColor: accentColor,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Meta Badges: Framework Tag + Visual Style Tag + Milestones Pill */}
          <View
            style={[
              styles.metaBadgesRow,
              isArabic && styles.rowReverse,
            ]}
          >
            {/* Achieved Win Badge */}
            {goal.isCompleted && (
              <View style={[styles.badgePill, { backgroundColor: '#10B98120' }, isArabic && styles.rowReverse]}>
                <Ionicons name="trophy" size={11} color={T.success} />
                <Text style={[styles.badgeText, { color: T.success }]}>
                  {isArabic ? 'إنجاز محقق' : 'Completed'}
                </Text>
              </View>
            )}

            {/* Framework Badge */}
            {frameworkId === 'roadmap' && (
              <View style={[styles.badgePill, { backgroundColor: '#3B82F618' }, isArabic && styles.rowReverse]}>
                <Ionicons name="git-commit-outline" size={11} color="#3B82F6" />
                <Text style={[styles.badgeText, { color: T.info }]}>
                  {isArabic ? 'خارطة طريق' : 'Roadmap'}
                </Text>
              </View>
            )}
            {frameworkId === 'checklist' && (
              <View style={[styles.badgePill, { backgroundColor: '#10B98118' }, isArabic && styles.rowReverse]}>
                <Ionicons name="checkbox-outline" size={11} color={T.success} />
                <Text style={[styles.badgeText, { color: T.success }]}>
                  {isArabic ? 'قائمة مهام' : 'Checklist'}
                </Text>
              </View>
            )}
            {frameworkId === 'metric' && (
              <View style={[styles.badgePill, { backgroundColor: '#F59E0B18' }, isArabic && styles.rowReverse]}>
                <Ionicons name="analytics-outline" size={11} color={T.warning} />
                <Text style={[styles.badgeText, { color: T.warning }]}>
                  {progressPercent}%
                </Text>
              </View>
            )}
            {frameworkId === 'sprint' && (
              <View style={[styles.badgePill, { backgroundColor: '#EF444418' }, isArabic && styles.rowReverse]}>
                <Ionicons name="flash" size={11} color={T.danger} />
                <Text style={[styles.badgeText, { color: T.danger }]}>
                  {isArabic ? 'سبرنت' : 'Sprint'}
                </Text>
              </View>
            )}
            {frameworkId === 'pillar' && (
              <View style={[styles.badgePill, { backgroundColor: '#8B5CF618' }, isArabic && styles.rowReverse]}>
                <Ionicons name="shield-checkmark" size={11} color={T.special} />
                <Text style={[styles.badgeText, { color: T.special }]}>
                  {isArabic ? 'ركيزة' : 'Pillar'}
                </Text>
              </View>
            )}

            {/* Visual Style Name Badge */}
            {visualStyleId && (
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: isDarkMode ? '#27272A' : '#F1F5F9' },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.textMuted }]}>
                  {visualStyleId === 'paper'
                    ? (isArabic ? 'مظهر ورقي' : 'Paper')
                    : visualStyleId === 'notebook'
                    ? (isArabic ? 'دفتر ملاحظات' : 'Notebook')
                    : visualStyleId === 'book'
                    ? (isArabic ? 'طابع كتاب' : 'Book')
                    : visualStyleId === 'glass'
                    ? (isArabic ? 'زجاجي' : 'Glass')
                    : visualStyleId === 'dark-capsule'
                    ? (isArabic ? 'كبسولة دائرية' : 'Capsule')
                    : visualStyleId === 'editorial'
                    ? (isArabic ? 'صحفي' : 'Editorial')
                    : (isArabic ? 'بسيط' : 'Minimal')}
                </Text>
              </View>
            )}

            {/* Sub-Milestones Toggle Pill */}
            {totalMilestones > 0 && (
              <TouchableOpacity
                style={[
                  styles.milestonesTogglePill,
                  { backgroundColor: accentColor + '15' },
                  isArabic && styles.rowReverse,
                ]}
                onPress={onToggleExpansion}
                activeOpacity={0.7}
              >
                <Ionicons name="checkbox-outline" size={12} color={accentColor} />
                <Text style={[styles.milestonesToggleText, { color: accentColor }]}>
                  {completedMilestones}/{totalMilestones}{' '}
                  {isArabic ? 'مهام فرعية' : 'sub-tasks'}
                </Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={accentColor}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Buttons: Edit & Delete */}
        <View style={[styles.actionsCol, isArabic && styles.rowReverse]}>
          <TouchableOpacity
            onPress={onEdit}
            style={styles.actionIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            style={styles.actionIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={T.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Level 3: Nested Sub-Milestones Framework Rendering (Collapsible) ─── */}
      {isExpanded && (
        <View
          style={[
            styles.expandedSection,
            { borderTopColor: theme.dividerColor },
            visualStyleId === 'notebook' && (isArabic ? { paddingRight: 20 } : { paddingLeft: 20 }),
          ]}
        >
          {renderMilestonesContent()}

          {/* Quick Add Sub-Milestone Inline */}
          <View style={[styles.inlineAddRow, isArabic && styles.rowReverse]}>
            <TextInput
              style={[
                styles.inlineAddInput,
                { color: theme.textColor, textAlign: isArabic ? 'right' : 'left' },
              ]}
              placeholder={
                isArabic
                  ? '+ إضافة خطوة فرعية جديدة...'
                  : '+ Add sub-milestone step...'
              }
              placeholderTextColor={theme.textMuted}
              value={newMilestoneText}
              onChangeText={onChangeNewMilestoneText}
              onSubmitEditing={onAddSubMilestone}
            />
            {newMilestoneText.trim().length > 0 && (
              <TouchableOpacity
                onPress={onAddSubMilestone}
                style={[styles.inlineAddBtn, { backgroundColor: accentColor }]}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={T.accentFillText} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ─── Level 4: Linked Tasks (Cross-connected from Todos) ─── */}
      <View style={[styles.linkedTasksWrapper, visualStyleId === 'notebook' && (isArabic ? { paddingRight: 16 } : { paddingLeft: 16 })]}>
        <GoalLinkedTasks
          goalId={goal._id}
          goalTitle={goal.text}
          goalColor={accentColor}
          onOpenTaskDetail={onOpenTaskDetail}
        />
      </View>
    </View>
  );
};

// ─── Theme Resolver for Card Styles ──────────────────────────────────────────

interface CardTheme {
  card: ViewStyle;
  textColor: string;
  textMuted: string;
  titleText: TextStyle;
  dividerColor: string;
  nodeBg: string;
  nodeText: string;
  railColor: string;
}

function getCardTheme(
  visualStyleId: AIGoalVisualStyleId,
  accentColor: string,
  isDarkMode: boolean,
  appColors: any
): CardTheme {
  switch (visualStyleId) {
    case 'paper':
      return {
        card: {
          backgroundColor: isDarkMode ? '#22201D' : '#FAF8F5',
          borderColor: isDarkMode ? '#3D3833' : '#E4DFD7',
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.2 : 0.06,
          shadowRadius: 6,
          elevation: 2,
        },
        textColor: isDarkMode ? '#EDE8E1' : '#1C1917',
        textMuted: isDarkMode ? '#A8A29E' : '#78716C',
        titleText: {
          fontWeight: '600',
          color: isDarkMode ? '#EDE8E1' : '#1C1917',
        },
        dividerColor: isDarkMode ? '#332E28' : '#ECE7DE',
        nodeBg: isDarkMode ? '#2B2824' : '#FFFFFF',
        nodeText: accentColor,
        railColor: isDarkMode ? '#443E37' : '#D6D0C5',
      };

    case 'notebook':
      return {
        card: {
          backgroundColor: isDarkMode ? '#1F1D1B' : '#FEFCF8',
          borderColor: isDarkMode ? '#35302A' : '#E5DFD3',
          borderWidth: 1,
          borderRadius: 14,
          shadowColor: '#78716C',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 2,
        },
        textColor: isDarkMode ? '#E7E5E4' : '#292524',
        textMuted: isDarkMode ? '#A8A29E' : '#78716C',
        titleText: {
          fontWeight: '600',
          color: isDarkMode ? '#E7E5E4' : '#292524',
        },
        dividerColor: isDarkMode ? '#332E29' : '#EFE9DE',
        nodeBg: isDarkMode ? '#282522' : '#FFFFFF',
        nodeText: accentColor,
        railColor: isDarkMode ? '#443D35' : '#D5CDBF',
      };

    case 'book':
      return {
        card: {
          backgroundColor: isDarkMode ? '#24211D' : '#FAF7EE',
          borderColor: isDarkMode ? '#3D372E' : '#E8DFCC',
          borderWidth: 1.5,
          borderRadius: 16,
          shadowColor: '#3F2C0E',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDarkMode ? 0.25 : 0.1,
          shadowRadius: 8,
          elevation: 3,
        },
        textColor: isDarkMode ? '#F5F5F4' : '#292524',
        textMuted: isDarkMode ? '#A8A29E' : '#78716C',
        titleText: {
          fontWeight: '700',
          letterSpacing: 0.2,
          color: isDarkMode ? '#F5F5F4' : '#292524',
        },
        dividerColor: isDarkMode ? '#383229' : '#E6DCC6',
        nodeBg: isDarkMode ? '#2D2924' : '#FFFFFF',
        nodeText: accentColor,
        railColor: isDarkMode ? '#484136' : '#D8CCB2',
      };

    case 'glass':
      return {
        card: {
          backgroundColor: isDarkMode ? 'rgba(28, 28, 42, 0.78)' : 'rgba(255, 255, 255, 0.88)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.75)',
          borderWidth: 1.5,
          borderRadius: 20,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.25 : 0.12,
          shadowRadius: 14,
          elevation: 4,
        },
        textColor: isDarkMode ? '#F8FAFC' : '#0F172A',
        textMuted: isDarkMode ? '#94A3B8' : '#64748B',
        titleText: {
          fontWeight: '700',
          color: isDarkMode ? '#F8FAFC' : '#0F172A',
        },
        dividerColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.7)',
        nodeBg: isDarkMode ? 'rgba(38, 38, 56, 0.9)' : '#FFFFFF',
        nodeText: accentColor,
        railColor: isDarkMode ? 'rgba(255, 255, 255, 0.18)' : 'rgba(203, 213, 225, 0.7)',
      };

    case 'dark-capsule':
      return {
        card: {
          backgroundColor: '#151520',
          borderColor: (accentColor || '#3B82F6') + '70',
          borderWidth: 1.5,
          borderRadius: 22,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 5,
        },
        textColor: '#FFFFFF',
        textMuted: '#94A3B8',
        titleText: {
          fontWeight: '700',
          color: '#FFFFFF',
        },
        dividerColor: '#242436',
        nodeBg: '#1C1C2C',
        nodeText: accentColor,
        railColor: '#363650',
      };

    case 'editorial':
      return {
        card: {
          backgroundColor: isDarkMode ? '#1E1E26' : '#FFFFFF',
          borderColor: isDarkMode ? '#E4E4E7' : '#18181B',
          borderWidth: 2,
          borderRadius: 10,
          shadowColor: '#000',
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: isDarkMode ? 0.35 : 0.2,
          shadowRadius: 0,
          elevation: 4,
        },
        textColor: isDarkMode ? '#FAFAFA' : '#18181B',
        textMuted: isDarkMode ? '#A1A1AA' : '#71717A',
        titleText: {
          fontWeight: '800',
          letterSpacing: -0.3,
          color: isDarkMode ? '#FAFAFA' : '#18181B',
        },
        dividerColor: isDarkMode ? '#333342' : '#18181B',
        nodeBg: isDarkMode ? '#272734' : '#FFFFFF',
        nodeText: accentColor,
        railColor: isDarkMode ? '#E4E4E7' : '#18181B',
      };

    case 'minimal':
    default:
      return {
        card: {
          backgroundColor: isDarkMode ? '#1E1E28' : '#FFFFFF',
          borderColor: isDarkMode ? '#2D2D3E' : '#EEF2F6',
          borderWidth: 1,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        },
        textColor: isDarkMode ? '#FFFFFF' : '#0F172A',
        textMuted: isDarkMode ? '#94A3B8' : '#64748B',
        titleText: {
          fontWeight: '600',
          color: isDarkMode ? '#FFFFFF' : '#0F172A',
        },
        dividerColor: isDarkMode ? '#2A2A3C' : '#F1F5F9',
        nodeBg: isDarkMode ? '#252536' : '#F8FAFC',
        nodeText: accentColor,
        railColor: isDarkMode ? '#3D3D52' : '#E2E8F0',
      };
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (T: any) => StyleSheet.create({
  cardContainer: {
    marginVertical: 6,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  completedCard: {
    opacity: 0.85,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  alignRight: {
    alignItems: 'flex-end',
  },

  // 1. Paper Specifics
  paperCard: {
    paddingTop: 16,
  },
  paperTapeStrip: {
    position: 'absolute',
    top: 0,
    left: '35%',
    right: '35%',
    height: 10,
    backgroundColor: '#EBE5D899',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    zIndex: 10,
  },
  paperTapeInner: {
    width: '100%',
    height: 1,
    backgroundColor: '#DDD5C4',
    marginTop: 4,
  },

  // 2. Book Specifics
  bookSpine: {
    borderLeftWidth: 5,
  },
  bookSpineAr: {
    borderRightWidth: 5,
  },
  bookmarkRibbon: {
    position: 'absolute',
    top: 0,
    width: 14,
    height: 22,
    zIndex: 10,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  ribbonNotch: {
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    height: 5,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'inherit',
  },

  // 3. Notebook Specifics
  notebookCard: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  notebookSpiralsCol: {
    position: 'absolute',
    top: 16,
    bottom: 16,
    width: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },
  notebookHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },

  // 4. Capsule Specifics
  capsuleCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  // 5. Editorial Specifics
  editorialCard: {},
  editorialStepNum: {
    fontSize: 13,
    fontWeight: '800',
    marginRight: 6,
    marginLeft: 6,
  },

  // Header Elements
  mainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalCheckboxBtn: {
    paddingTop: 1,
    marginRight: 10,
    marginLeft: 10,
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  completedTitleText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  goalDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },

  // Metric Progress Bar
  metricBarContainer: {
    marginTop: 8,
    marginBottom: 2,
  },
  metricTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  metricFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Meta Badges Row
  metaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Milestones Toggle Pill
  milestonesTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  milestonesToggleText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Action Buttons
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
    marginRight: 6,
  },
  actionIconBtn: {
    padding: 5,
    borderRadius: 6,
  },

  // Expanded Section
  expandedSection: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  milestonesListContainer: {
    paddingVertical: 4,
  },
  milestoneCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  milestoneCheckText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  pillarStepBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pillarStepText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Roadmap Framework Elements
  roadmapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 34,
  },
  roadmapNodeCol: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
    marginLeft: 8,
  },
  roadmapCircleNode: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  roadmapNodeIndex: {
    fontSize: 10,
    fontWeight: '700',
  },
  roadmapRailLine: {
    width: 2,
    flex: 1,
    minHeight: 14,
    marginVertical: 2,
  },
  milestoneTextContainer: {
    flex: 1,
    paddingTop: 1,
    paddingBottom: 8,
  },

  // Inline Add Input
  inlineAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
    gap: 8,
  },
  inlineAddInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 6,
  },
  inlineAddBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Linked Tasks Wrapper
  linkedTasksWrapper: {
    marginTop: 6,
  },
});
