/**
 * components/AIGoalGeneratorModal.tsx
 * Modular orchestration modal for the Nizam AI Goal Architect.
 * Implements Section 25-33, 61, 71, 74-76 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { getAiTheme } from '@/utils/aiGoalTheme';
import { useAIGoalSession } from '@/hooks/useAIGoalSession';
import { AIGoalPreview } from '@/components/ai-goals/AIGoalPreview';
import { AIGoalTemplatePicker } from '@/components/ai-goals/AIGoalTemplatePicker';
import { AIGoalExpansionPanel } from '@/components/ai-goals/AIGoalExpansionPanel';
import { AIGoalConversation } from '@/components/ai-goals/AIGoalConversation';
import { AIGoalFinalReview } from '@/components/ai-goals/AIGoalFinalReview';
import { VoiceRecordModal } from '@/components/VoiceRecordModal';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Exported interfaces for full backward compatibility
export interface MilestoneItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface StagedGoal {
  id: string;
  text: string;
  description?: string;
  category: string;
  color?: string;
  icon?: string;
  templateId: string;
  milestones: MilestoneItem[];
}

export interface HeaderOption {
  title: string;
  isExisting: boolean;
}

export interface AIGoalGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  year: number;
  month?: number;
  day?: number;
  userId: string;
  isArabic?: boolean;
  existingCategories?: string[];
  onPlanApplied?: () => void;
}

export const AIGoalGeneratorModal: React.FC<AIGoalGeneratorModalProps> = ({
  visible,
  onClose,
  year,
  month,
  day,
  userId,
  isArabic = false,
  existingCategories = [],
  onPlanApplied,
}) => {
  const { colors, isDarkMode } = useTheme();
  const T = getAiTheme(colors, isDarkMode);
  const styles = createStyles(T);

  // Initial prompt state (before draft is created)
  const [initialPrompt, setInitialPrompt] = useState('');
  const [isInitialVoiceOpen, setIsInitialVoiceOpen] = useState(false);
  const [isInitialTranscribing, setIsInitialTranscribing] = useState(false);

  // Audio actions for initial voice
  const generateAudioUploadUrl = useMutation(api.audio.generateAudioUploadUrl);
  const transcribeAudioAction = useAction(api.audio.transcribeAudio);

  // Goal Architect Session Hook
  const session = useAIGoalSession({
    year,
    month,
    day,
    userId,
    isArabic,
    existingCategories,
    onPlanApplied: () => {
      if (onPlanApplied) onPlanApplied();
      onClose();
    },
  });

  const timeframe: 'day' | 'month' | 'year' =
    day !== undefined ? 'day' : month !== undefined ? 'month' : 'year';

  // Reset initial prompt when modal opens
  useEffect(() => {
    if (visible) {
      setInitialPrompt('');
    } else {
      session.reset();
    }
  }, [visible]);

  // Prompt suggestions for initial screen
  const inspirationSuggestions = isArabic
    ? timeframe === 'day'
      ? [
          '🎯 إنهاء مراجعة الكود وإطلاق التحديث',
          '📚 قراءة الفصل 4 من كتاب التصميم وتدوين الملاحظات',
          '🏃‍♂️ تمرين جري 5 كم وشرب 3 لتر ماء',
        ]
      : timeframe === 'month'
      ? [
          '🚀 إتقان فلاتر وبناء 3 تطبيقات عملية',
          '💪 16 تمرين في الجيم مع الالتزام بنظام غذائي صحي',
          '💰 ادخار 1000 دولار وترشيد الميزانية الشهرية',
        ]
      : [
          '🌟 إطلاق مشروع تجاري جانبي وتحقيق أول مبيعات',
          '🏃‍♂️ إنهاء نصف ماراثون وبناء لياقة بدنية ممتازة',
          '📖 قراءة 20 كتاباً وتلخيص أهم الدروس',
        ]
    : timeframe === 'day'
    ? [
        '🎯 Finish code review and ship app update',
        '📚 Read chapter 4 and write notes',
        '🏃‍♂️ 5km run and 3L water hydration',
      ]
    : timeframe === 'month'
    ? [
        '🚀 Master Flutter and build 3 small apps',
        '💪 16 gym sessions and clean nutrition',
        '💰 Save $1,000 and optimize monthly spending',
      ]
    : [
        '🌟 Launch side business and earn first revenue',
        '🏃‍♂️ Complete half-marathon and peak vitality',
        '📖 Read 20 books and publish summaries',
      ];

  const handleStartWithPrompt = (prompt: string) => {
    const text = prompt.trim();
    if (!text) return;
    session.startGoal(text);
  };

  const handleInitialVoiceFinish = async (result: { uri: string; duration: number }) => {
    try {
      setIsInitialTranscribing(true);
      const uploadUrl = await generateAudioUploadUrl();
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, result.uri, {
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.BINARY_CONTENT,
        headers: { 'Content-Type': 'audio/m4a' },
      });

      if (uploadResult.status !== 200) {
        throw new Error(`Upload failed: ${uploadResult.status}`);
      }

      const { storageId } = JSON.parse(uploadResult.body);
      const transcribeRes = await transcribeAudioAction({
        storageId,
        languageHint: isArabic ? 'ar' : 'en',
      });

      if (transcribeRes?.transcript?.trim()) {
        const text = transcribeRes.transcript.trim();
        setInitialPrompt(text);
        handleStartWithPrompt(text);
      }
    } catch (err) {
      console.warn('Initial voice recording failed:', err);
      Alert.alert(
        isArabic ? 'خطأ في التسجيل' : 'Voice Error',
        isArabic ? 'تعذر تحويل الصوت إلى نص. يرجى المحاولة مرة أخرى.' : 'Could not transcribe voice.'
      );
    } finally {
      setIsInitialTranscribing(false);
      setIsInitialVoiceOpen(false);
    }
  };

  const timeframeTitle =
    timeframe === 'day'
      ? isArabic ? 'هدف اليوم' : 'Daily Goal'
      : timeframe === 'month'
      ? isArabic ? 'هدف الشهر' : 'Monthly Goal'
      : isArabic ? 'هدف السنة' : 'Annual Goal';

  const isAnalyzing = session.state === 'analyzing';
  const isSaving = session.state === 'saving';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: T.page }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header Bar */}
        <View style={[styles.modalHeader, isArabic && styles.rowRtl]}>
          <View style={styles.headerInfo}>
            <View style={[styles.titleBadgeRow, isArabic && styles.rowRtl]}>
              <Ionicons name="sparkles" size={18} color={T.accent} />
              <Text style={[styles.headerTitle, { color: T.text }]}>
                {isArabic ? 'مهندس الأهداف الذكي' : 'AI Goal Architect'}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, isArabic && styles.textRtl]}>
              {timeframeTitle} • {year}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={T.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Modal Body */}
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STATE 1: INITIAL PROMPT INPUT (Before Draft Created) */}
          {!session.draft && !isAnalyzing && (
            <View style={styles.initialScreen}>
              <View style={styles.heroCard}>
                <View style={styles.heroIconCircle}>
                  <Ionicons name="bulb-outline" size={28} color={T.accent} />
                </View>
                <Text style={[styles.heroTitle, isArabic && styles.textRtl]}>
                  {isArabic
                    ? 'ما الذي ترغب في تحقيقه؟'
                    : 'What do you want to accomplish?'}
                </Text>
                <Text style={[styles.heroDesc, isArabic && styles.textRtl]}>
                  {isArabic
                    ? 'اكتب أو تحدث بصوتك بحرية. سيقوم الذكاء الاصطناعي بصياغة الهدف بدقة واقتراح القالب الأمثل وتصنيفه بدون أي تفاصيل غير مرغوبة.'
                    : 'Speak or type in your natural language. The AI will shape your outcome, map categories, and propose the best framework without fluff.'}
                </Text>

                {/* Input box */}
                <View style={styles.promptInputContainer}>
                  <TextInput
                    style={[styles.promptInput, isArabic && styles.textRtl]}
                    value={initialPrompt}
                    onChangeText={setInitialPrompt}
                    placeholder={
                      isArabic
                        ? 'مثال: أريد إتقان فلاتر وبناء 3 تطبيقات عملية خلال الشهر...'
                        : 'e.g. Master Flutter and build 3 small apps this month...'
                    }
                    placeholderTextColor={T.placeholder}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={[styles.promptActionsRow, isArabic && styles.rowRtl]}>
                    <TouchableOpacity
                      onPress={() => setIsInitialVoiceOpen(true)}
                      style={[styles.voiceBtn, isInitialTranscribing && styles.voiceBtnActive]}
                      disabled={isInitialTranscribing}
                      activeOpacity={0.8}
                    >
                      {isInitialTranscribing ? (
                        <ActivityIndicator size="small" color={T.dangerFillText} />
                      ) : (
                        <>
                          <Ionicons name="mic" size={18} color={T.accent} />
                          <Text style={styles.voiceBtnText}>
                            {isArabic ? 'تسجيل صوتي' : 'Voice Input'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleStartWithPrompt(initialPrompt)}
                      disabled={!initialPrompt.trim()}
                      style={[
                        styles.startBtn,
                        initialPrompt.trim() ? styles.startBtnActive : styles.startBtnDisabled,
                      ]}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="sparkles" size={16} color={T.accentFillText} />
                      <Text style={styles.startBtnText}>
                        {isArabic ? 'صياغة الهدف' : 'Shape Goal'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Inspiration Suggestions */}
              <View style={styles.suggestionsContainer}>
                <Text style={[styles.suggestionsTitle, isArabic && styles.textRtl]}>
                  {isArabic ? 'أفكار ملهمة للبدء:' : 'Inspiration to get started:'}
                </Text>
                <View style={styles.suggestionsList}>
                  {inspirationSuggestions.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setInitialPrompt(item);
                        handleStartWithPrompt(item);
                      }}
                      style={styles.suggestionCard}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.suggestionText, isArabic && styles.textRtl]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* STATE 2: ANALYZING SPINNER */}
          {isAnalyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={T.accent} />
              <Text style={[styles.loadingTitle, isArabic && styles.textRtl]}>
                {isArabic ? 'جاري استيعاب وصياغة الهدف...' : 'Analyzing intent & structuring goal...'}
              </Text>
              <Text style={[styles.loadingDesc, isArabic && styles.textRtl]}>
                {isArabic
                  ? 'يتم تحديد نطاق الهدف واقتراح التصنيف والقالب الأنسب.'
                  : 'Mapping scope, categories, and up to 3 visual layouts.'}
              </Text>
            </View>
          )}

          {/* STATE 3: DRAFT ACTIVE (Reviewing / Refining / Expanding) */}
          {session.draft && !isAnalyzing && (
            <View style={styles.draftSection}>
              {/* 1. Interactive Preview Card */}
              <AIGoalPreview
                draft={session.draft}
                timeframe={timeframe}
                canUndo={session.canUndo}
                onUndo={session.undo}
                onUpdateGoalField={session.updateGoalField}
                onSelectCategory={session.selectCategory}
                onSelectPresentation={session.selectPresentation}
                onToggleMilestone={session.toggleMilestone}
                onDeleteMilestone={session.deleteMilestone}
                existingCategories={existingCategories}
                isArabic={isArabic}
              />

              {/* 2. Template Recommendations Picker (Max 3) */}
              <AIGoalTemplatePicker
                recommendations={session.draft.templateOptions}
                selectedPresentation={session.draft.presentation}
                onSelectPresentation={session.selectPresentation}
                isArabic={isArabic}
              />

              {/* 3. On-Demand Expansion Panel (Milestones & Projects) */}
              <AIGoalExpansionPanel
                milestones={session.draft.milestones}
                suggestedProjects={session.draft.suggestedProjects}
                isExpanding={session.state === 'expanding'}
                onExpandWithAI={session.expandWithAI}
                onAddMilestone={session.addMilestone}
                onDeleteMilestone={session.deleteMilestone}
                onRemoveProject={session.removeProjectCandidate}
                isArabic={isArabic}
              />

              {/* 4. Conversational Chat & Input Bar */}
              <AIGoalConversation
                messages={session.messages}
                isThinking={session.state === 'refining'}
                onSendMessage={(text) => session.refineGoal(text)}
                onQuickAction={(action) => {
                  if (action === 'suggest_milestones') {
                    session.expandWithAI('');
                  } else if (action === 'shorten_title') {
                    session.refineGoal(isArabic ? 'اجعل عنوان الهدف أكثر إيجازاً وقوة' : 'Make title punchier and more concise');
                  } else if (action === 'switch_to_checklist') {
                    session.selectPresentation({ frameworkId: 'checklist', visualStyleId: session.draft?.presentation.visualStyleId || 'default' });
                  } else if (action === 'suggest_projects') {
                    session.expandWithAI(isArabic ? 'اقترح مشاريع فرعية لتنفيذ هذا الهدف' : 'Suggest project deliverables for this goal');
                  }
                }}
                isArabic={isArabic}
              />

              {/* 5. Final Review & Batch Save Section */}
              <AIGoalFinalReview
                stagedGoals={session.stagedGoals}
                activeDraft={session.draft}
                isSaving={isSaving}
                onStageAndNext={() => session.stageCurrentGoal()}
                onSaveAll={() => session.saveAllToGoals()}
                onRemoveStagedGoal={(id) => session.removeStagedGoal(id)}
                isArabic={isArabic}
              />
            </View>
          )}
        </ScrollView>

        {/* Initial Voice Modal */}
        <VoiceRecordModal
          visible={isInitialVoiceOpen}
          onClose={() => setIsInitialVoiceOpen(false)}
          onFinishRecording={handleInitialVoiceFinish}
          isArabic={isArabic}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (T: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  textRtl: {
    textAlign: 'right',
  },
  headerInfo: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    color: T.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  initialScreen: {
    gap: 16,
  },
  heroCard: {
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.accentWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: T.text,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    color: T.textMuted,
    lineHeight: 19,
    marginBottom: 16,
  },
  promptInputContainer: {
    backgroundColor: T.input,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.borderStrong,
    padding: 10,
  },
  promptInput: {
    fontSize: 14,
    color: T.text,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  promptActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.accentWash,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.accentBorder,
  },
  voiceBtnActive: {
    backgroundColor: T.danger,
  },
  voiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.accent,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startBtnActive: {
    backgroundColor: T.accentFill,
  },
  startBtnDisabled: {
    backgroundColor: T.borderStrong,
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: T.accentFillText,
  },
  suggestionsContainer: {
    marginTop: 4,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: T.textSecondary,
    marginBottom: 8,
  },
  suggestionsList: {
    gap: 8,
  },
  suggestionCard: {
    backgroundColor: T.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: {
    fontSize: 13,
    color: T.textBody,
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.text,
    marginTop: 6,
  },
  loadingDesc: {
    fontSize: 13,
    color: T.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  draftSection: {
    gap: 4,
  },
});
