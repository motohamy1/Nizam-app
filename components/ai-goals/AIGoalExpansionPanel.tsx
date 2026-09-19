/**
 * components/ai-goals/AIGoalExpansionPanel.tsx
 * On-demand expansion for milestones, sub-goals, and project candidates.
 * Implements Section 17-21, 42-45 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { getAiTheme } from '@/utils/aiGoalTheme';
import { MilestoneItem, ProjectCandidate } from '@/types/aiGoals';

interface AIGoalExpansionPanelProps {
  milestones: MilestoneItem[];
  suggestedProjects: ProjectCandidate[];
  isExpanding: boolean;
  onExpandWithAI: (instructions: string) => void;
  onAddMilestone: (text: string) => void;
  onDeleteMilestone: (id: string) => void;
  onRemoveProject: (localDraftId: string) => void;
  isArabic?: boolean;
}

export const AIGoalExpansionPanel: React.FC<AIGoalExpansionPanelProps> = ({
  milestones,
  suggestedProjects,
  isExpanding,
  onExpandWithAI,
  onAddMilestone,
  onDeleteMilestone,
  onRemoveProject,
  isArabic = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const T = getAiTheme(colors, isDarkMode);
  const styles = createStyles(T);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);

  const handleManualAdd = () => {
    if (newMilestoneText.trim()) {
      onAddMilestone(newMilestoneText.trim());
      setNewMilestoneText('');
      setIsManualInputOpen(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* AI Expansion Action Chips */}
      <View style={[styles.chipsRow, isArabic && styles.rowRtl]}>
        <TouchableOpacity
          onPress={() => onExpandWithAI('')}
          disabled={isExpanding}
          style={[styles.aiExpandBtn, isArabic && styles.rowRtl]}
          activeOpacity={0.8}
        >
          {isExpanding ? (
            <ActivityIndicator size="small" color={T.accent} />
          ) : (
            <Ionicons name="sparkles" size={14} color={T.accent} />
          )}
          <Text style={styles.aiExpandText}>
            {isArabic ? 'اقتراح مراحل بالذكاء الاصطناعي' : 'Suggest Milestones with AI'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsManualInputOpen(!isManualInputOpen)}
          style={[styles.manualAddBtn, isArabic && styles.rowRtl]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isManualInputOpen ? 'close' : 'add-circle-outline'}
            size={14}
            color={T.textSecondary}
          />
          <Text style={styles.manualAddText}>
            {isArabic ? 'إضافة يدوية' : 'Add Manual'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Manual Input Field */}
      {isManualInputOpen && (
        <View style={[styles.manualInputRow, isArabic && styles.rowRtl]}>
          <TextInput
            style={[styles.manualInput, isArabic && styles.textRtl]}
            value={newMilestoneText}
            onChangeText={setNewMilestoneText}
            placeholder={isArabic ? 'اكتب مرحلة أو خطوة جديدة...' : 'Enter milestone or step...'}
            placeholderTextColor={T.placeholder}
            onSubmitEditing={handleManualAdd}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleManualAdd}
            style={styles.addSubmitBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={16} color={T.accentFillText} />
          </TouchableOpacity>
        </View>
      )}

      {/* Suggested Projects Section (If Detected by AI) */}
      {suggestedProjects.length > 0 && (
        <View style={styles.projectsSection}>
          <View style={[styles.projectsHeader, isArabic && styles.rowRtl]}>
            <Ionicons name="folder-open-outline" size={14} color={T.info} />
            <Text style={styles.projectsTitle}>
              {isArabic ? 'مشاريع مقترحة مرتبطة بالهدف' : 'Suggested Projects Linked to Goal'}
            </Text>
          </View>

          <View style={styles.projectsList}>
            {suggestedProjects.map((p) => (
              <View key={p.localDraftId} style={[styles.projectCard, isArabic && styles.rowRtl]}>
                <View style={styles.projectInfo}>
                  <Text style={[styles.projectName, isArabic && styles.textRtl]}>{p.name}</Text>
                  {Boolean(p.description) && (
                    <Text style={[styles.projectDesc, isArabic && styles.textRtl]}>
                      {p.description}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => onRemoveProject(p.localDraftId)}
                  style={styles.removeProjBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color={T.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (T: any) => StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  textRtl: {
    textAlign: 'right',
  },
  aiExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.accentWash,
    borderWidth: 1,
    borderColor: T.accentBorder,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  aiExpandText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.accent,
  },
  manualAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.input,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  manualAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.textSecondary,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    color: T.text,
  },
  addSubmitBtn: {
    backgroundColor: T.accentFill,
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectsSection: {
    marginTop: 12,
    backgroundColor: T.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 10,
  },
  projectsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  projectsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: T.text,
  },
  projectsList: {
    gap: 6,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: T.border,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 13,
    fontWeight: '600',
    color: T.text,
  },
  projectDesc: {
    fontSize: 11,
    color: T.textMuted,
    marginTop: 1,
  },
  removeProjBtn: {
    padding: 2,
  },
});
