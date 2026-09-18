/**
 * components/ai-goals/AIGoalTemplatePicker.tsx
 * Clean, accessible selector for up to 3 recommended templates (primary fit + alternatives).
 * Separates Framework structure from Visual Style.
 * Implements Section 12, 13, 37, 38 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AIGoalPresentation,
  AITemplateRecommendation,
  AIGoalVisualStyleId,
} from '@/types/aiGoals';
import {
  GOAL_FRAMEWORK_REGISTRY,
  GOAL_VISUAL_STYLE_REGISTRY,
} from '@/constants/aiGoalTemplates';

interface AIGoalTemplatePickerProps {
  recommendations: AITemplateRecommendation[];
  selectedPresentation: AIGoalPresentation;
  onSelectPresentation: (presentation: AIGoalPresentation) => void;
  isArabic?: boolean;
}

export const AIGoalTemplatePicker: React.FC<AIGoalTemplatePickerProps> = ({
  recommendations,
  selectedPresentation,
  onSelectPresentation,
  isArabic = false,
}) => {
  const [showAllStyles, setShowAllStyles] = useState(false);

  // Safe slice to guarantee maximum 3 recommendations per Blueprint Section 12
  const topRecommendations = recommendations.slice(0, 3);

  const handleSelectRec = (rec: AITemplateRecommendation) => {
    onSelectPresentation({
      frameworkId: rec.frameworkId,
      visualStyleId: rec.visualStyleId,
    });
  };

  const handleSelectCustomStyle = (styleId: AIGoalVisualStyleId) => {
    onSelectPresentation({
      frameworkId: selectedPresentation.frameworkId,
      visualStyleId: styleId,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerRow, isArabic && styles.rowRtl]}>
        <View style={[styles.titleWithIcon, isArabic && styles.rowRtl]}>
          <Ionicons name="sparkles" size={15} color="#EA580C" />
          <Text style={styles.headerTitle}>
            {isArabic ? 'القوالب المقترحة لهدفك' : 'Recommended Layouts'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowAllStyles(!showAllStyles)}
          style={styles.moreStylesToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.moreStylesText}>
            {showAllStyles
              ? isArabic ? 'إخفاء الأنماط' : 'Hide styles'
              : isArabic ? 'تغيير المظهر' : 'Change style'}
          </Text>
          <Ionicons
            name={showAllStyles ? 'chevron-up' : 'chevron-down'}
            size={12}
            color="#64748B"
          />
        </TouchableOpacity>
      </View>

      {/* Recommended Up To 3 Cards */}
      <View style={styles.recommendationsList}>
        {topRecommendations.map((rec, index) => {
          const isSelected =
            selectedPresentation.frameworkId === rec.frameworkId &&
            selectedPresentation.visualStyleId === rec.visualStyleId;

          const fwMeta = GOAL_FRAMEWORK_REGISTRY[rec.frameworkId];
          const styleMeta = GOAL_VISUAL_STYLE_REGISTRY[rec.visualStyleId];
          const isPrimary = rec.fit === 'primary';

          const fwName = isArabic ? fwMeta?.nameAr || rec.frameworkId : fwMeta?.name || rec.frameworkId;
          const styleName = isArabic ? styleMeta?.nameAr || rec.visualStyleId : styleMeta?.name || rec.visualStyleId;
          const reason = isArabic ? rec.reasonAr || rec.reason : rec.reason;

          return (
            <TouchableOpacity
              key={`${rec.frameworkId}_${rec.visualStyleId}_${index}`}
              onPress={() => handleSelectRec(rec)}
              style={[
                styles.recCard,
                isSelected && styles.selectedRecCard,
                isPrimary && !isSelected && styles.primaryBorder,
              ]}
              activeOpacity={0.8}
            >
              {/* Card top row: Icon + Names + Fit Badge */}
              <View style={[styles.cardTopRow, isArabic && styles.rowRtl]}>
                <View style={styles.iconAndNames}>
                  <View style={[styles.recIconCircle, { backgroundColor: isSelected ? '#EA580C' : '#F1F5F9' }]}>
                    <Ionicons
                      name={(fwMeta?.icon as any) || 'grid-outline'}
                      size={14}
                      color={isSelected ? '#FFF' : '#475569'}
                    />
                  </View>
                  <View>
                    <Text style={[styles.recFwName, isSelected && styles.selectedText]}>
                      {fwName}
                    </Text>
                    <Text style={styles.recStyleName}>
                      {isArabic ? `مظهر: ${styleName}` : `Style: ${styleName}`}
                    </Text>
                  </View>
                </View>

                {isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Ionicons name="star" size={10} color="#EA580C" />
                    <Text style={styles.primaryBadgeText}>
                      {isArabic ? 'الأنسب' : 'Best Fit'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Rationale explanation */}
              {Boolean(reason) && (
                <Text style={[styles.reasonText, isArabic && styles.textRtl]}>
                  {reason}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Optional Full Visual Style Switcher Drawer */}
      {showAllStyles && (
        <View style={styles.allStylesContainer}>
          <Text style={[styles.allStylesTitle, isArabic && styles.textRtl]}>
            {isArabic ? 'اختر مظهر البطاقة (Visual Style):' : 'Select Card Appearance:'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.stylesScroll, isArabic && styles.stylesScrollRtl]}
          >
            {Object.values(GOAL_VISUAL_STYLE_REGISTRY).map((styleDef) => {
              const isStyleActive = selectedPresentation.visualStyleId === styleDef.id;
              const name = isArabic ? styleDef.nameAr : styleDef.name;
              return (
                <TouchableOpacity
                  key={styleDef.id}
                  onPress={() => handleSelectCustomStyle(styleDef.id)}
                  style={[
                    styles.styleChip,
                    isStyleActive && styles.activeStyleChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.styleChipText,
                      isStyleActive && styles.activeStyleChipText,
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  textRtl: {
    textAlign: 'right',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  moreStylesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  moreStylesText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  recommendationsList: {
    gap: 8,
  },
  recCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  selectedRecCard: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  primaryBorder: {
    borderColor: '#FED7AA',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconAndNames: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recFwName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  selectedText: {
    color: '#C2410C',
  },
  recStyleName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
  },
  reasonText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 16,
  },
  allStylesContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  allStylesTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  stylesScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  stylesScrollRtl: {
    flexDirection: 'row-reverse',
  },
  styleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeStyleChip: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  styleChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  activeStyleChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
