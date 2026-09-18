/**
 * components/ai-goals/GoalPresentationRenderer.tsx
 * Renders the 5 structural frameworks (roadmap, checklist, metric, sprint, pillar)
 * styled according to the 8 visual styles (book, paper, glass, editorial, minimal, dark-capsule, notebook, default).
 * Implements Section 11, 14, 15, 39-41 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AIGoalFrameworkId,
  AIGoalPresentation,
  AIGoalVisualStyleId,
  MilestoneItem,
} from '@/types/aiGoals';

interface GoalPresentationRendererProps {
  title: string;
  description?: string;
  category: string;
  presentation: AIGoalPresentation;
  milestones: MilestoneItem[];
  color?: string;
  icon?: string;
  isArabic?: boolean;
  onToggleMilestone?: (id: string) => void;
  onDeleteMilestone?: (id: string) => void;
  onEditGoalPress?: () => void;
  onEditCategoryPress?: () => void;
}

export const GoalPresentationRenderer: React.FC<GoalPresentationRendererProps> = ({
  title,
  description,
  category,
  presentation,
  milestones,
  color = '#2563EB',
  icon = 'flag-outline',
  isArabic = false,
  onToggleMilestone,
  onDeleteMilestone,
  onEditGoalPress,
  onEditCategoryPress,
}) => {
  const { frameworkId, visualStyleId } = presentation;
  const styleTheme = getStyleTheme(visualStyleId, color);

  // Framework content renderer
  const renderFrameworkContent = () => {
    switch (frameworkId) {
      case 'roadmap':
        return renderRoadmapFramework();
      case 'checklist':
        return renderChecklistFramework();
      case 'metric':
        return renderMetricFramework();
      case 'sprint':
        return renderSprintFramework();
      case 'pillar':
        return renderPillarFramework();
      default:
        return renderChecklistFramework();
    }
  };

  // 1. Roadmap Framework: Step-by-step progress rail
  const renderRoadmapFramework = () => {
    if (milestones.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="git-commit-outline" size={24} color={styleTheme.textMuted} />
          <Text style={[styles.emptyText, { color: styleTheme.textMuted }]}>
            {isArabic ? 'خارطة طريق مرحلية (لا توجد خطوات مضافة بعد)' : 'Sequential roadmap (no milestones yet)'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.milestonesList}>
        {milestones.map((item, idx) => {
          const isLast = idx === milestones.length - 1;
          return (
            <View key={item.id} style={[styles.roadmapRow, isArabic && styles.rowRtl]}>
              <View style={styles.roadmapNodeColumn}>
                <TouchableOpacity
                  onPress={() => onToggleMilestone?.(item.id)}
                  style={[
                    styles.roadmapNode,
                    {
                      borderColor: item.isCompleted ? '#10B981' : color,
                      backgroundColor: item.isCompleted ? '#10B981' : styleTheme.nodeBg,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  {item.isCompleted ? (
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  ) : (
                    <Text style={[styles.roadmapNodeText, { color: styleTheme.nodeText }]}>
                      {idx + 1}
                    </Text>
                  )}
                </TouchableOpacity>
                {!isLast && <View style={[styles.roadmapRail, { backgroundColor: styleTheme.railColor }]} />}
              </View>

              <TouchableOpacity
                onPress={() => onToggleMilestone?.(item.id)}
                style={styles.milestoneTextContainer}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.milestoneText,
                    { color: styleTheme.textColor },
                    item.isCompleted && styles.completedText,
                    isArabic && styles.textRtl,
                  ]}
                >
                  {item.text}
                </Text>
              </TouchableOpacity>

              {onDeleteMilestone && (
                <TouchableOpacity
                  onPress={() => onDeleteMilestone(item.id)}
                  style={styles.deleteMilestoneBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle-outline" size={16} color={styleTheme.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // 2. Checklist Framework: Crisp checkbox items
  const renderChecklistFramework = () => {
    if (milestones.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkbox-outline" size={24} color={styleTheme.textMuted} />
          <Text style={[styles.emptyText, { color: styleTheme.textMuted }]}>
            {isArabic ? 'قائمة مهام تنفيذية (لا توجد مهام فرعية)' : 'Execution checklist (no sub-tasks yet)'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.milestonesList}>
        {milestones.map((item) => (
          <View key={item.id} style={[styles.checklistRow, isArabic && styles.rowRtl]}>
            <TouchableOpacity
              onPress={() => onToggleMilestone?.(item.id)}
              style={[
                styles.checkbox,
                {
                  borderColor: item.isCompleted ? '#10B981' : color,
                  backgroundColor: item.isCompleted ? '#10B981' : 'transparent',
                },
              ]}
              activeOpacity={0.7}
            >
              {item.isCompleted && <Ionicons name="checkmark" size={13} color="#FFF" />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onToggleMilestone?.(item.id)}
              style={styles.milestoneTextContainer}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.milestoneText,
                  { color: styleTheme.textColor },
                  item.isCompleted && styles.completedText,
                  isArabic && styles.textRtl,
                ]}
              >
                {item.text}
              </Text>
            </TouchableOpacity>

            {onDeleteMilestone && (
              <TouchableOpacity
                onPress={() => onDeleteMilestone(item.id)}
                style={styles.deleteMilestoneBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle-outline" size={16} color={styleTheme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };

  // 3. Metric Framework: Quantifiable gauge + counters
  const renderMetricFramework = () => {
    const total = milestones.length;
    const completed = milestones.filter((m) => m.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
      <View style={styles.metricContainer}>
        <View style={[styles.metricHeaderRow, isArabic && styles.rowRtl]}>
          <View style={[styles.metricStatBox, { backgroundColor: styleTheme.subtleBg }]}>
            <Text style={[styles.metricStatValue, { color }]}>{percent}%</Text>
            <Text style={[styles.metricStatLabel, { color: styleTheme.textMuted }]}>
              {isArabic ? 'الإنجاز' : 'Completed'}
            </Text>
          </View>
          <View style={[styles.metricStatBox, { backgroundColor: styleTheme.subtleBg }]}>
            <Text style={[styles.metricStatValue, { color: styleTheme.textColor }]}>
              {completed} / {total}
            </Text>
            <Text style={[styles.metricStatLabel, { color: styleTheme.textMuted }]}>
              {isArabic ? 'المراحل المحققة' : 'Milestones Done'}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.metricBarTrack, { backgroundColor: styleTheme.barTrackBg }]}>
          <View
            style={[
              styles.metricBarFill,
              { width: `${Math.max(percent, total > 0 ? 5 : 0)}%`, backgroundColor: color },
            ]}
          />
        </View>

        {/* Milestone checklist below */}
        {milestones.length > 0 && renderChecklistFramework()}
      </View>
    );
  };

  // 4. Sprint Framework: Agile badges & high-intensity cards
  const renderSprintFramework = () => {
    return (
      <View style={styles.sprintContainer}>
        <View style={[styles.sprintPillRow, isArabic && styles.rowRtl]}>
          <View style={[styles.sprintBadge, { backgroundColor: `${color}20`, borderColor: color }]}>
            <Ionicons name="flash" size={12} color={color} />
            <Text style={[styles.sprintBadgeText, { color }]}>
              {isArabic ? 'سبرنت عالي التركيز' : 'High Focus Sprint'}
            </Text>
          </View>
          <Text style={[styles.sprintSubBadge, { color: styleTheme.textMuted }]}>
            {milestones.length} {isArabic ? 'أهداف سريعة' : 'Sprint Items'}
          </Text>
        </View>
        {renderChecklistFramework()}
      </View>
    );
  };

  // 5. Pillar Framework: Grounding spine & strategic depth
  const renderPillarFramework = () => {
    return (
      <View style={[styles.pillarContainer, isArabic && styles.rowRtl]}>
        <View style={[styles.pillarSpine, { backgroundColor: color }]} />
        <View style={styles.pillarContent}>
          <View style={[styles.pillarHeader, isArabic && styles.rowRtl]}>
            <Text style={[styles.pillarTag, { color }]}>
              {isArabic ? 'ركيزة استراتيجية' : 'Strategic Pillar'}
            </Text>
          </View>
          {renderChecklistFramework()}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.cardBase, styleTheme.card, visualStyleId === 'notebook' && styles.notebookCard]}>
      {/* Notebook left spiral styling */}
      {visualStyleId === 'notebook' && (
        <View style={[styles.notebookSpiral, isArabic ? styles.notebookSpiralRtl : styles.notebookSpiralLtr]}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={styles.spiralHole} />
          ))}
        </View>
      )}

      {/* Book ribbon or corner fold */}
      {visualStyleId === 'book' && (
        <View style={[styles.bookRibbon, { backgroundColor: color }]} />
      )}

      {/* Header bar: Category + Edit Trigger */}
      <View style={[styles.cardHeader, isArabic && styles.rowRtl]}>
        <TouchableOpacity
          onPress={onEditCategoryPress}
          style={[styles.categoryPill, { backgroundColor: styleTheme.categoryBg }]}
          activeOpacity={0.7}
        >
          <Ionicons name={icon as any} size={14} color={color} />
          <Text style={[styles.categoryText, { color: styleTheme.categoryText }]}>{category}</Text>
          <Ionicons name="chevron-down" size={11} color={styleTheme.textMuted} />
        </TouchableOpacity>

        {onEditGoalPress && (
          <TouchableOpacity
            onPress={onEditGoalPress}
            style={styles.editBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil-outline" size={15} color={styleTheme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Title & Description */}
      <TouchableOpacity
        onPress={onEditGoalPress}
        activeOpacity={0.85}
        style={styles.titleContainer}
      >
        <Text
          style={[
            styles.titleText,
            styleTheme.titleText,
            visualStyleId === 'editorial' && styles.editorialTitle,
            isArabic && styles.textRtl,
          ]}
        >
          {title}
        </Text>
        {Boolean(description) && (
          <Text
            style={[
              styles.descriptionText,
              { color: styleTheme.textMuted },
              isArabic && styles.textRtl,
            ]}
          >
            {description}
          </Text>
        )}
      </TouchableOpacity>

      {/* Framework divider */}
      <View style={[styles.divider, { backgroundColor: styleTheme.dividerColor }]} />

      {/* Render selected framework structure */}
      <View style={styles.frameworkBody}>{renderFrameworkContent()}</View>
    </View>
  );
};

// ─── Visual Style Theme Resolver ─────────────────────────────────────────────

interface StyleTheme {
  card: ViewStyle;
  textColor: string;
  textMuted: string;
  categoryBg: string;
  categoryText: string;
  titleText: TextStyle;
  dividerColor: string;
  nodeBg: string;
  nodeText: string;
  railColor: string;
  subtleBg: string;
  barTrackBg: string;
}

function getStyleTheme(visualStyleId: AIGoalVisualStyleId, accentColor: string): StyleTheme {
  switch (visualStyleId) {
    case 'book':
      return {
        card: {
          backgroundColor: '#FBF8F2',
          borderColor: '#E6DCB8',
          borderWidth: 1.5,
          borderRadius: 16,
          shadowColor: '#3F2C0E',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 4,
        },
        textColor: '#292524',
        textMuted: '#78716C',
        categoryBg: '#EFE8D6',
        categoryText: '#44403C',
        titleText: { fontFamily: undefined, fontWeight: '700', letterSpacing: 0.2 },
        dividerColor: '#E6DCB8',
        nodeBg: '#FFFDF9',
        nodeText: accentColor,
        railColor: '#D7CCAA',
        subtleBg: '#F3EEDB',
        barTrackBg: '#E6DCB8',
      };

    case 'paper':
      return {
        card: {
          backgroundColor: '#FDFBF7',
          borderColor: '#E7E5E4',
          borderWidth: 1,
          borderRadius: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        },
        textColor: '#1C1917',
        textMuted: '#78716C',
        categoryBg: '#F5F5F4',
        categoryText: '#292524',
        titleText: { fontWeight: '600' },
        dividerColor: '#F0EFEB',
        nodeBg: '#FFF',
        nodeText: accentColor,
        railColor: '#E7E5E4',
        subtleBg: '#F5F5F4',
        barTrackBg: '#E7E5E4',
      };

    case 'glass':
      return {
        card: {
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderColor: 'rgba(255, 255, 255, 0.6)',
          borderWidth: 1.5,
          borderRadius: 20,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 4,
        },
        textColor: '#0F172A',
        textMuted: '#64748B',
        categoryBg: `${accentColor}15`,
        categoryText: accentColor,
        titleText: { fontWeight: '700' },
        dividerColor: 'rgba(226, 232, 240, 0.6)',
        nodeBg: 'rgba(255, 255, 255, 0.9)',
        nodeText: accentColor,
        railColor: 'rgba(203, 213, 225, 0.6)',
        subtleBg: 'rgba(241, 245, 249, 0.8)',
        barTrackBg: 'rgba(226, 232, 240, 0.7)',
      };

    case 'editorial':
      return {
        card: {
          backgroundColor: '#FFFFFF',
          borderColor: '#18181B',
          borderWidth: 1.5,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 0,
          elevation: 3,
        },
        textColor: '#18181B',
        textMuted: '#71717A',
        categoryBg: '#F4F4F5',
        categoryText: '#18181B',
        titleText: { fontWeight: '800', letterSpacing: -0.3 },
        dividerColor: '#18181B',
        nodeBg: '#FFFFFF',
        nodeText: '#18181B',
        railColor: '#18181B',
        subtleBg: '#F4F4F5',
        barTrackBg: '#E4E4E7',
      };

    case 'minimal':
      return {
        card: {
          backgroundColor: '#FFFFFF',
          borderColor: '#F1F5F9',
          borderWidth: 1,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        },
        textColor: '#0F172A',
        textMuted: '#94A3B8',
        categoryBg: '#F8FAFC',
        categoryText: '#475569',
        titleText: { fontWeight: '600' },
        dividerColor: '#F8FAFC',
        nodeBg: '#F8FAFC',
        nodeText: accentColor,
        railColor: '#E2E8F0',
        subtleBg: '#F8FAFC',
        barTrackBg: '#F1F5F9',
      };

    case 'dark-capsule':
      return {
        card: {
          backgroundColor: '#18181B',
          borderColor: '#27272A',
          borderWidth: 1.5,
          borderRadius: 18,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 5,
        },
        textColor: '#FAFAFA',
        textMuted: '#A1A1AA',
        categoryBg: '#27272A',
        categoryText: '#F4F4F5',
        titleText: { fontWeight: '700' },
        dividerColor: '#27272A',
        nodeBg: '#27272A',
        nodeText: accentColor,
        railColor: '#3F3F46',
        subtleBg: '#27272A',
        barTrackBg: '#3F3F46',
      };

    case 'notebook':
      return {
        card: {
          backgroundColor: '#FEFDF8',
          borderColor: '#E2DEC9',
          borderWidth: 1,
          borderRadius: 14,
          shadowColor: '#78716C',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 2,
        },
        textColor: '#292524',
        textMuted: '#78716C',
        categoryBg: '#F3EFE0',
        categoryText: '#44403C',
        titleText: { fontWeight: '700' },
        dividerColor: '#EBE5D3',
        nodeBg: '#FFFDF9',
        nodeText: accentColor,
        railColor: '#DCD4BC',
        subtleBg: '#F7F3E6',
        barTrackBg: '#EBE5D3',
      };

    case 'default':
    default:
      return {
        card: {
          backgroundColor: '#FFFFFF',
          borderColor: `${accentColor}30`,
          borderWidth: 1.5,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        },
        textColor: '#1E293B',
        textMuted: '#64748B',
        categoryBg: `${accentColor}12`,
        categoryText: accentColor,
        titleText: { fontWeight: '700' },
        dividerColor: '#F1F5F9',
        nodeBg: '#FFFFFF',
        nodeText: accentColor,
        railColor: '#CBD5E1',
        subtleBg: '#F8FAFC',
        barTrackBg: '#E2E8F0',
      };
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  cardBase: {
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
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
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editBtn: {
    padding: 4,
  },
  titleContainer: {
    marginBottom: 12,
  },
  titleText: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  editorialTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  frameworkBody: {
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
  },
  milestonesList: {
    gap: 10,
  },
  roadmapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  roadmapNodeColumn: {
    alignItems: 'center',
    width: 24,
  },
  roadmapNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadmapNodeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roadmapRail: {
    width: 2,
    height: 20,
    marginTop: 2,
  },
  milestoneTextContainer: {
    flex: 1,
    paddingVertical: 2,
  },
  milestoneText: {
    fontSize: 14,
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  deleteMilestoneBtn: {
    padding: 2,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContainer: {
    gap: 10,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricStatBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  metricStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  metricBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sprintContainer: {
    gap: 12,
  },
  sprintPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sprintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  sprintBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sprintSubBadge: {
    fontSize: 11,
  },
  pillarContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  pillarSpine: {
    width: 4,
    borderRadius: 2,
  },
  pillarContent: {
    flex: 1,
  },
  pillarHeader: {
    marginBottom: 8,
  },
  pillarTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notebookCard: {
    paddingLeft: 28,
  },
  notebookSpiral: {
    position: 'absolute',
    top: 14,
    bottom: 14,
    width: 14,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  notebookSpiralLtr: {
    left: 8,
  },
  notebookSpiralRtl: {
    right: 8,
  },
  spiralHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1CCB8',
    borderWidth: 1,
    borderColor: '#B8B39F',
  },
  bookRibbon: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 12,
    height: 20,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
});
