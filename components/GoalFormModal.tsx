import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  useWindowDimensions,
  type ScrollViewInstance,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';
import { useAction, useMutation } from 'convex/react';
import useTheme from '@/hooks/useTheme';
import LivePress from '@/components/LivePress';
import { useKeyboard } from '@/hooks/useKeyboard';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { UniversalLinkPickerModal } from './UniversalLinkPickerModal';
import { PostalStampGoalCard } from './ai-goals/PostalStampGoalCard';
import { VoiceRecordModal } from './VoiceRecordModal';

export interface MilestoneItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface GoalFormData {
  id?: string;
  text: string;
  description?: string;
  category?: string;
  color?: string;
  icon?: string;
  templateId?: string;
  visualStyleId?: string;
  milestones?: MilestoneItem[];
  isCompleted?: boolean;
  _type: 'goal' | 'achievement';
  categoryId?: Id<'projectCategories'>;
  subCategoryId?: Id<'projectSubCategories'>;
  projectId?: string;
}

interface GoalFormModalProps {
  visible: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  item?: any | null;
  initialCategory?: string;
  categories: string[];
  isArabic?: boolean;
  timeframe?: string;
  onSave: (formData: GoalFormData) => Promise<void> | void;
  onDelete?: (id: any, type: 'goal' | 'achievement') => Promise<void> | void;
}

const COLOR_OPTIONS = [
  '#EA580C', // Coral Orange
  '#2563EB', // Cobalt Blue
  '#059669', // Emerald Green
  '#7C3AED', // Purple
  '#D97706', // Amber
  '#DB2777', // Rose Pink
  '#0284C7', // Sky Blue
  '#4B5563', // Slate
];

const ICON_OPTIONS = [
  'flag-outline',
  'trophy-outline',
  'fitness-outline',
  'briefcase-outline',
  'book-outline',
  'wallet-outline',
  'rocket-outline',
  'flame-outline',
  'sparkles-outline',
  'heart-outline',
  'laptop-outline',
  'shield-checkmark-outline',
];

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  visible,
  onClose,
  mode = 'create',
  item = null,
  initialCategory = '',
  categories,
  isArabic = false,
  timeframe = 'month',
  onSave,
  onDelete,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const scrollViewRef = useRef<ScrollViewInstance>(null);

  const isEdit = mode === 'edit' || (item && item._id);
  const [type, setType] = useState<'goal' | 'achievement'>('goal');
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [color, setColor] = useState('#EA580C');
  const [icon, setIcon] = useState('flag-outline');
  const [templateId, setTemplateId] = useState('checklist');
  const [visualStyleId, setVisualStyleId] = useState('paper');
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  // AI Co-Pilot State
  const [isCoPilotLoading, setIsCoPilotLoading] = useState(false);
  const [coPilotInsights, setCoPilotInsights] = useState<{
    suggestedMilestones: MilestoneItem[];
    category?: string;
    templateId?: string;
  } | null>(null);

  // Live Card Preview Collapsible
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Voice Recording State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);

  // Convex Actions & Mutations
  const coPilotAction = useAction(api.aiGoals.coPilotAssistGoal);
  const generateAudioUploadUrl = useMutation(api.audio.generateAudioUploadUrl);
  const transcribeAudioAction = useAction(api.audio.transcribeAudio);

  // Linked Space / Project State
  const [linkedCategoryId, setLinkedCategoryId] = useState<Id<'projectCategories'> | undefined>(undefined);
  const [linkedSubCategoryId, setLinkedSubCategoryId] = useState<Id<'projectSubCategories'> | undefined>(undefined);
  const [linkedProjectId, setLinkedProjectId] = useState<string | undefined>(undefined);
  const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);

  const linkedProjectMeta = useOfflineQuery<any>('projects.getProjectMetadata', api.projects.getProjectMetadata, linkedProjectId ? { id: linkedProjectId } : 'skip');
  const linkedCategoryMeta = useOfflineQuery<any>('projects.getCategory', api.projects.getCategory, linkedCategoryId ? { id: linkedCategoryId } : 'skip');

  // Synchronize modal state on open or item update
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (visible) {
      if (item) {
        setType(item._type || 'goal');
        setText(item.text || '');
        setDescription(item.description || '');
        setCategory(item.category || initialCategory || '');
        setColor(item.color || (item._type === 'achievement' ? '#059669' : '#EA580C'));
        setIcon(item.icon || (item._type === 'achievement' ? 'trophy-outline' : 'flag-outline'));
        setTemplateId(item.templateId || 'checklist');
        setVisualStyleId(item.visualStyleId || 'paper');
        setMilestones(item.milestones ? [...item.milestones] : []);
        setLinkedCategoryId(item.categoryId);
        setLinkedSubCategoryId(item.subCategoryId);
        setLinkedProjectId(item.projectId);
      } else {
        // Reset for Create Mode
        setType('goal');
        setText('');
        setDescription('');
        setCategory(initialCategory || (categories.length > 0 ? categories[0] : ''));
        setColor('#EA580C');
        setIcon('flag-outline');
        setTemplateId('checklist');
        setVisualStyleId('paper');
        setMilestones([]);
        setLinkedCategoryId(undefined);
        setLinkedSubCategoryId(undefined);
        setLinkedProjectId(undefined);
      }
      setCustomCategoryInput('');
      setIsAddingCustomCategory(false);
      setNewMilestoneText('');
      setCoPilotInsights(null);
      setIsVoiceModalOpen(false);
      setIsLinkPickerOpen(false);
    }
  }, [item, initialCategory, visible, categories]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Adjust default color & icon when switching type
  const handleTypeSwitch = (newType: 'goal' | 'achievement') => {
    setType(newType);
    if (!item) {
      if (newType === 'achievement') {
        setColor('#059669');
        setIcon('trophy-outline');
      } else {
        setColor('#EA580C');
        setIcon('flag-outline');
      }
    }
  };

  const handleAddMilestone = () => {
    const trimmed = newMilestoneText.trim();
    if (!trimmed) return;
    setMilestones((prev) => [
      ...prev,
      { id: `ms_${Date.now()}_${Math.random()}`, text: trimmed, isCompleted: false },
    ]);
    setNewMilestoneText('');
  };

  const handleRemoveMilestone = (msId: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== msId));
  };

  const handleToggleMilestone = (msId: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === msId ? { ...m, isCompleted: !m.isCompleted } : m))
    );
  };

  const handleApplyCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (trimmed) {
      setCategory(trimmed);
      setIsAddingCustomCategory(false);
      setCustomCategoryInput('');
    }
  };

  // ─── AI Co-Pilot Assistant ──────────────────────────────────────────────
  const handleCoPilotAssist = async () => {
    const userGoalText = text.trim();
    if (!userGoalText) {
      Alert.alert(
        isArabic ? 'اكتب الهدف أولاً' : 'Enter Goal First',
        isArabic
          ? 'يرجى كتابة عنوان أو فكرة الهدف ليقوم الذكاء الاصطناعي بتحليله واقتراح الخطوات.'
          : 'Please enter a goal title or idea so the AI co-pilot can suggest categories and steps.'
      );
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsCoPilotLoading(true);

      const result = await coPilotAction({
        text: userGoalText,
        timeframe,
        language: isArabic ? 'ar' : 'en',
        existingCategories: categories,
      });

      if (result) {
        if (!category || category === 'General' || category === 'عام' || category === 'أهداف عامة') {
          if (result.category) setCategory(result.category);
        }
        if (result.color && color === '#EA580C') {
          setColor(result.color);
        }
        if (result.icon && icon === 'flag-outline') {
          setIcon(result.icon);
        }
        if (result.templateId) {
          setTemplateId(result.templateId);
        }

        const validMilestones: MilestoneItem[] = (result.suggestedMilestones || []).map((m: any, idx: number) => ({
          id: m.id || `ms_copilot_${Date.now()}_${idx}`,
          text: m.text || '',
          isCompleted: false,
        }));

        setCoPilotInsights({
          suggestedMilestones: validMilestones,
          category: result.category,
          templateId: result.templateId,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.warn('AI Co-pilot error:', err);
      Alert.alert(
        isArabic ? 'تنبيه' : 'Notice',
        isArabic
          ? 'تعذر الاتصال بالمساعد الذكي حالياً، يمكنك المتابعة يدوياً.'
          : 'Could not contact AI co-pilot right now, you can continue manually.'
      );
    } finally {
      setIsCoPilotLoading(false);
    }
  };

  const handleApplySuggestedMilestone = (ms: MilestoneItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMilestones((prev) => [...prev, ms]);
    setCoPilotInsights((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        suggestedMilestones: prev.suggestedMilestones.filter((item) => item.id !== ms.id),
      };
    });
  };

  const handleApplyAllSuggestedMilestones = () => {
    if (!coPilotInsights || coPilotInsights.suggestedMilestones.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMilestones((prev) => [...prev, ...coPilotInsights.suggestedMilestones]);
    setCoPilotInsights((prev) => (prev ? { ...prev, suggestedMilestones: [] } : null));
  };

  // ─── Voice Recording Handler ─────────────────────────────────────────────
  const handleFinishVoiceRecording = async (result: { uri: string; duration: number }) => {
    try {
      setIsTranscribingVoice(true);
      const uploadUrl = await generateAudioUploadUrl();
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, result.uri, {
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.BINARY_CONTENT,
        headers: { 'Content-Type': 'audio/m4a' },
      });

      if (uploadResult.status !== 200) {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }

      const { storageId } = JSON.parse(uploadResult.body);
      const transcribeRes = await transcribeAudioAction({
        storageId,
        languageHint: isArabic ? 'ar' : 'en',
      });

      if (transcribeRes?.transcript?.trim()) {
        const spokenText = transcribeRes.transcript.trim();
        setText(spokenText);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.warn('Voice transcription failed:', err);
      Alert.alert(
        isArabic ? 'خطأ في الصوت' : 'Voice Error',
        isArabic ? 'تعذر تحويل الصوت إلى نص.' : 'Could not transcribe voice audio.'
      );
    } finally {
      setIsTranscribingVoice(false);
      setIsVoiceModalOpen(false);
    }
  };

  const handleSave = async () => {
    // Synchronous guard: a state flag alone is stale within the same tick, so
    // two rapid taps could both run this handler (duplicate creates).
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      await runSave();
    } finally {
      savingRef.current = false;
    }
  };

  const runSave = async () => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      Alert.alert(
        isArabic ? 'العنوان مطلوب' : 'Title Required',
        isArabic ? 'يرجى كتابة عنوان للهدف أو الإنجاز.' : 'Please enter a title.'
      );
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        id: item?._id,
        text: trimmedText,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        color,
        icon,
        templateId,
        visualStyleId,
        milestones: type === 'goal' ? milestones : undefined,
        isCompleted: item?.isCompleted || false,
        _type: type,
        categoryId: linkedCategoryId,
        subCategoryId: linkedSubCategoryId,
        projectId: linkedProjectId,
      });
      onClose();
    } catch (err) {
      console.warn('Save failed:', err);
      Alert.alert(
        isArabic ? 'تعذر الحفظ' : 'Save Failed',
        isArabic
          ? 'حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.'
          : 'Something went wrong while saving. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!item || !onDelete) return;
    Alert.alert(
      isArabic ? 'تأكيد الحذف' : 'Confirm Delete',
      isArabic ? 'هل أنت متأكد من رغبتك في حذف هذا العنصر؟' : 'Are you sure you want to delete this item?',
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await onDelete(item._id, item._type);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View 
          style={[
            styles.modalSheet, 
            { 
              backgroundColor: isDarkMode ? '#0B0812' : colors.surface,
              borderColor: isDarkMode ? '#2D2245' : 'transparent',
              borderWidth: isDarkMode ? 1.5 : 0,
              marginBottom: keyboardHeight,
              maxHeight: isKeyboardVisible 
                ? Math.max(300, screenHeight - keyboardHeight - 44) 
                : '92%',
            }
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, isArabic && styles.rowReverse]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isEdit
                ? isArabic
                  ? type === 'goal' ? 'تعديل الهدف' : 'تعديل الإنجاز'
                  : type === 'goal' ? 'Edit Goal' : 'Edit Achievement'
                : isArabic
                ? type === 'goal' ? 'إضافة هدف ذكي' : 'إضافة إنجاز جديد'
                : type === 'goal' ? 'New Goal' : 'New Achievement'}
            </Text>

            {isEdit && onDelete ? (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36 }} />
            )}
          </View>

          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: isKeyboardVisible ? 120 : 30 }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Type Selector Toggle (Goal vs Achievement) */}
            <View style={[styles.typeToggleContainer, { backgroundColor: isDarkMode ? '#171422' : '#F3F4F6' }]}>
              <TouchableOpacity
                style={[
                  styles.typeToggleBtn,
                  type === 'goal' && [styles.typeToggleBtnActive, { backgroundColor: isDarkMode ? '#231E34' : colors.surface }],
                ]}
                onPress={() => handleTypeSwitch('goal')}
              >
                <Ionicons name="flag" size={15} color={type === 'goal' ? (isDarkMode ? '#AFE607' : colors.primary) : colors.textMuted} />
                <Text
                  style={[
                    styles.typeToggleText,
                    { color: type === 'goal' ? colors.text : colors.textMuted },
                  ]}
                >
                  {isArabic ? 'هدف مخطط' : 'Goal'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeToggleBtn,
                  type === 'achievement' && [styles.typeToggleBtnActive, { backgroundColor: isDarkMode ? '#231E34' : colors.surface }],
                ]}
                onPress={() => handleTypeSwitch('achievement')}
              >
                <Ionicons name="trophy" size={15} color={type === 'achievement' ? colors.success : colors.textMuted} />
                <Text
                  style={[
                    styles.typeToggleText,
                    { color: type === 'achievement' ? colors.text : colors.textMuted },
                  ]}
                >
                  {isArabic ? 'إنجاز محقق' : 'Achievement / Win'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Title Input + Ambient Co-Pilot & Mic Row */}
            <View style={[styles.titleHeaderRow, isArabic && styles.rowReverse]}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                {isArabic ? 'العنوان والهدف المطلوب' : 'Goal Title & Intent'}
              </Text>

              <View style={[styles.titleToolsRow, isArabic && styles.rowReverse]}>
                {/* Voice Input Button */}
                <TouchableOpacity
                  style={[
                    styles.micBtn,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.14)' : '#E5E7EB',
                    },
                  ]}
                  onPress={() => setIsVoiceModalOpen(true)}
                  disabled={isTranscribingVoice}
                  activeOpacity={0.75}
                >
                  {isTranscribingVoice ? (
                    <ActivityIndicator size="small" color="#AFE607" />
                  ) : (
                    <Ionicons name="mic" size={15} color={isDarkMode ? '#AFE607' : colors.primary} />
                  )}
                </TouchableOpacity>

                {/* AI Co-Pilot Button */}
                <TouchableOpacity
                  style={[
                    styles.coPilotAssistBtn,
                    {
                      backgroundColor: isDarkMode ? 'rgba(175, 230, 7, 0.14)' : '#8B5CF618',
                      borderColor: isDarkMode ? 'rgba(175, 230, 7, 0.40)' : '#8B5CF640',
                    },
                  ]}
                  onPress={handleCoPilotAssist}
                  disabled={isCoPilotLoading}
                  activeOpacity={0.8}
                >
                  {isCoPilotLoading ? (
                    <ActivityIndicator size="small" color={isDarkMode ? '#AFE607' : '#8B5CF6'} />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={13} color={isDarkMode ? '#AFE607' : '#8B5CF6'} />
                      <Text
                        style={[
                          styles.coPilotAssistText,
                          { color: isDarkMode ? '#AFE607' : '#8B5CF6' },
                        ]}
                      >
                        {isArabic ? 'مساعد ذكي' : 'AI Co-Pilot'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={[
                styles.titleInput,
                {
                  color: colors.text,
                  backgroundColor: isDarkMode ? '#13111C' : '#F9FAFB',
                  borderColor: isDarkMode ? '#2D2245' : '#E5E7EB',
                  textAlign: isArabic ? 'right' : 'left',
                },
              ]}
              value={text}
              onChangeText={(val) => {
                setText(val);
                if (coPilotInsights && val.trim().length === 0) {
                  setCoPilotInsights(null);
                }
              }}
              placeholder={
                type === 'goal'
                  ? isArabic ? 'مثال: إتقان فلاتر وبناء 3 تطبيقات عملية خلال الشهر...' : 'e.g. Master Flutter and build 3 small apps this month...'
                  : isArabic ? 'مثال: تم إكمال الدورة بنجاح...' : 'e.g. Finished certification course...'
              }
              placeholderTextColor={colors.textMuted}
              multiline
            />

            {/* AI Co-Pilot Suggestion Shelf (Dismissible, 1-tap accept) */}
            {coPilotInsights && (
              <View
                style={[
                  styles.coPilotShelf,
                  {
                    backgroundColor: isDarkMode ? 'rgba(175, 230, 7, 0.05)' : 'rgba(139, 92, 246, 0.06)',
                    borderColor: isDarkMode ? 'rgba(175, 230, 7, 0.25)' : 'rgba(139, 92, 246, 0.25)',
                  },
                ]}
              >
                <View style={[styles.coPilotShelfHeader, isArabic && styles.rowReverse]}>
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="sparkles" size={14} color={isDarkMode ? '#AFE607' : '#8B5CF6'} />
                    <Text
                      style={[
                        styles.coPilotShelfTitle,
                        { color: isDarkMode ? '#AFE607' : '#8B5CF6' },
                      ]}
                    >
                      {isArabic ? 'اقتراحات المساعد الذكي السريعة' : 'AI Co-Pilot Suggestions'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setCoPilotInsights(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {Boolean(coPilotInsights.category) && (
                  <View style={[styles.coPilotMetaRow, isArabic && styles.rowReverse]}>
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
                      {isArabic ? 'القسم المقترح:' : 'Category Match:'}
                    </Text>
                    <View style={styles.coPilotCategoryPill}>
                      <Text style={styles.coPilotCategoryPillText}>{coPilotInsights.category}</Text>
                    </View>
                  </View>
                )}

                {coPilotInsights.suggestedMilestones.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text
                      style={{
                        fontSize: 11.5,
                        color: colors.textMuted,
                        fontWeight: '600',
                        marginBottom: 6,
                        textAlign: isArabic ? 'right' : 'left',
                      }}
                    >
                      {isArabic ? 'خطوات تنفيذية مقترحة (اضغط للإضافة):' : 'Suggested Actionable Steps (tap to add):'}
                    </Text>

                    <View style={[styles.coPilotChipsWrap, isArabic && styles.rowReverse]}>
                      {coPilotInsights.suggestedMilestones.map((ms) => (
                        <TouchableOpacity
                          key={ms.id}
                          style={[
                            styles.suggestedChip,
                            {
                              backgroundColor: isDarkMode ? '#1E1B2A' : '#FFFFFF',
                              borderColor: isDarkMode ? '#3D2F5F' : '#E2E8F0',
                            },
                            isArabic && styles.rowReverse,
                          ]}
                          onPress={() => handleApplySuggestedMilestone(ms)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add-circle" size={14} color={isDarkMode ? '#AFE607' : colors.primary} />
                          <Text style={[styles.suggestedChipText, { color: colors.text }]}>{ms.text}</Text>
                        </TouchableOpacity>
                      ))}

                      <TouchableOpacity
                        style={[
                          styles.addAllChip,
                          {
                            backgroundColor: isDarkMode ? '#AFE607' : colors.primary,
                          },
                        ]}
                        onPress={handleApplyAllSuggestedMilestones}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="flash" size={12} color={isDarkMode ? '#0B0812' : '#FFFFFF'} />
                        <Text
                          style={[
                            styles.addAllChipText,
                            { color: isDarkMode ? '#0B0812' : '#FFFFFF' },
                          ]}
                        >
                          {isArabic
                            ? `+ إضافة الكل (${coPilotInsights.suggestedMilestones.length})`
                            : `+ Add All (${coPilotInsights.suggestedMilestones.length})`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Description Input */}
            <Text style={[styles.inputLabel, { color: colors.textMuted, textAlign: isArabic ? 'right' : 'left', marginTop: 14 }]}>
              {isArabic ? 'الوصف والتفاصيل (اختياري)' : 'Description (Optional)'}
            </Text>
            <TextInput
              style={[
                styles.descInput,
                {
                  color: colors.text,
                  backgroundColor: isDarkMode ? '#1E1E28' : '#F9FAFB',
                  borderColor: isDarkMode ? '#2D2D3E' : '#E5E7EB',
                  textAlign: isArabic ? 'right' : 'left',
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder={isArabic ? 'أضف سياقاً أو معايير الإنجاز...' : 'Add context or definition of done...'}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
            />

            {/* Category / Parent Section Selector */}
            <Text style={[styles.inputLabel, { color: colors.textMuted, textAlign: isArabic ? 'right' : 'left', marginTop: 14 }]}>
              {isArabic ? 'القسم الرئيسي (Parent Section)' : 'Parent Section / Category'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? color + '22' : isDarkMode ? '#22222E' : '#F3F4F6',
                        borderColor: isSelected ? color : 'transparent',
                      },
                    ]}
                    onPress={() => setCategory(isSelected ? '' : cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isSelected ? color : colors.text },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Applied custom category chip (not yet in categories list) */}
              {category.trim() && !categories.includes(category.trim()) && (
                <TouchableOpacity
                  key={category.trim()}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: color + '22',
                      borderColor: color,
                    },
                  ]}
                  onPress={() => setCategory('')}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color },
                    ]}
                  >
                    {category.trim()}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Add Custom Category Chip */}
              {!isAddingCustomCategory ? (
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isDarkMode ? '#22222E' : '#F3F4F6',
                      borderColor: colors.border,
                      borderStyle: 'dashed',
                    },
                  ]}
                  onPress={() => setIsAddingCustomCategory(true)}
                >
                  <Ionicons name="add" size={14} color={colors.primary} />
                  <Text style={[styles.categoryChipText, { color: colors.primary }]}>
                    {isArabic ? 'قسم جديد' : 'New Section'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>

            {/* Inline Custom Category Creator */}
            {isAddingCustomCategory && (
              <View style={[styles.customCatRow, isArabic && styles.rowReverse]}>
                <TextInput
                  style={[
                    styles.customCatInput,
                    { color: colors.text, textAlign: isArabic ? 'right' : 'left' },
                  ]}
                  placeholder={isArabic ? 'اسم القسم الجديد...' : 'New section name...'}
                  placeholderTextColor={colors.textMuted}
                  value={customCategoryInput}
                  onChangeText={setCustomCategoryInput}
                  onSubmitEditing={handleApplyCustomCategory}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.customCatApplyBtn, { backgroundColor: color }]}
                  onPress={handleApplyCustomCategory}
                >
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.customCatCancelBtn}
                  onPress={() => setIsAddingCustomCategory(false)}
                >
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* Visual Framework Selector */}
            {type === 'goal' && (
              <View style={{ marginTop: 14 }}>
                <Text style={[styles.inputLabel, { color: colors.textMuted, textAlign: isArabic ? 'right' : 'left' }]}>
                  {isArabic ? 'قالب التنسيق والعرض' : 'Layout Framework'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {[
                    { id: 'checklist', label: isArabic ? 'قائمة إنجاز' : 'Clean Checklist', icon: 'checkbox-outline' },
                    { id: 'roadmap', label: isArabic ? 'خارطة مرحلية' : 'Roadmap', icon: 'git-commit-outline' },
                    { id: 'sprint', label: isArabic ? 'سبرنت مكثف' : 'Sprint', icon: 'flash-outline' },
                    { id: 'metric', label: isArabic ? 'مقياس رقمي' : 'Metric Gauge', icon: 'speedometer-outline' },
                  ].map((fw) => {
                    const isSelected = templateId === fw.id;
                    return (
                      <TouchableOpacity
                        key={fw.id}
                        style={[
                          styles.frameworkChip,
                          {
                            backgroundColor: isSelected
                              ? (isDarkMode ? 'rgba(175, 230, 7, 0.14)' : color + '22')
                              : (isDarkMode ? '#171422' : '#F3F4F6'),
                            borderColor: isSelected
                              ? (isDarkMode ? '#AFE607' : color)
                              : 'transparent',
                          },
                          isArabic && styles.rowReverse,
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setTemplateId(fw.id);
                        }}
                      >
                        <Ionicons
                          name={fw.icon as any}
                          size={13}
                          color={isSelected ? (isDarkMode ? '#AFE607' : color) : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.frameworkChipText,
                            { color: isSelected ? (isDarkMode ? '#AFE607' : color) : colors.text },
                          ]}
                        >
                          {fw.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Color & Icon Pickers */}
            <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', marginTop: 16 }}>
              {/* Color Picker */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textMuted, textAlign: isArabic ? 'right' : 'left' }]}>
                  {isArabic ? 'اللون المميز' : 'Accent Color'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {COLOR_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorDot,
                        { backgroundColor: c },
                        color === c && styles.selectedColorDot,
                      ]}
                      onPress={() => setColor(c)}
                    >
                      {color === c && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Icon Picker */}
              <View style={{ flex: 1, paddingLeft: isArabic ? 0 : 16, paddingRight: isArabic ? 16 : 0 }}>
                <Text style={[styles.inputLabel, { color: colors.textMuted, textAlign: isArabic ? 'right' : 'left' }]}>
                  {isArabic ? 'الأيقونة' : 'Icon'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 6 }}>
                  {ICON_OPTIONS.map((ic) => (
                    <TouchableOpacity
                      key={ic}
                      style={[
                        styles.iconOptionBox,
                        {
                          backgroundColor: icon === ic ? color + '25' : isDarkMode ? '#22222E' : '#F3F4F6',
                          borderColor: icon === ic ? color : 'transparent',
                        },
                      ]}
                      onPress={() => setIcon(ic)}
                    >
                      <Ionicons name={ic as any} size={18} color={icon === ic ? color : colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* ─── Link to Space / Project ─── */}
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.inputLabel, { color: colors.text, fontWeight: '800', textAlign: isArabic ? 'right' : 'left' }]}>
                {isArabic ? 'الارتباط بمساحة أو مشروع' : 'Linked Space / Project'}
              </Text>

              {linkedProjectId || linkedCategoryId ? (
                <View style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: color + '15',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: color + '30',
                  marginTop: 8,
                }}>
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Ionicons name="folder-open-outline" size={20} color={color} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', textAlign: isArabic ? 'right' : 'left' }}>
                        {isArabic ? 'المساحة أو المشروع المرتبط' : 'Connected Context'}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, textAlign: isArabic ? 'right' : 'left' }} numberOfLines={1}>
                        {linkedProjectMeta?.name || linkedCategoryMeta?.name || 'Linked Item'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={() => setIsLinkPickerOpen(true)} style={{ padding: 4 }}>
                      <Ionicons name="pencil" size={16} color={color} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      setLinkedCategoryId(undefined);
                      setLinkedSubCategoryId(undefined);
                      setLinkedProjectId(undefined);
                    }} style={{ padding: 4 }}>
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setIsLinkPickerOpen(true)}
                  style={{
                    flexDirection: isArabic ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderStyle: 'dashed',
                    backgroundColor: isDarkMode ? '#1E1E28' : '#F9FAFB',
                    marginTop: 8,
                  }}
                >
                  <Ionicons name="link-outline" size={18} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted }}>
                    {isArabic ? '+ ربط بمساحة أو مشروع' : '+ Connect to Space or Project'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sub-Milestones Checklist (Only for Goals) */}
            {type === 'goal' && (
              <View style={{ marginTop: 20 }}>
                <View style={[styles.milestonesHeaderRow, isArabic && styles.rowReverse]}>
                  <Text style={[styles.inputLabel, { color: colors.text, fontWeight: '800' }]}>
                    {isArabic ? 'قائمة المهام والمراحل الفرعية (Checklist)' : 'Checklist / Sub-Milestones'}
                  </Text>
                  {milestones.length > 0 && (
                    <Text style={[styles.msCountBadge, { color: color }]}>
                      {milestones.filter((m) => m.isCompleted).length}/{milestones.length}
                    </Text>
                  )}
                </View>

                {/* Milestone list */}
                {milestones.map((ms) => (
                  <View
                    key={ms.id}
                    style={[
                      styles.msRow,
                      {
                        backgroundColor: isDarkMode ? '#1E1E28' : '#F9FAFB',
                        borderColor: isDarkMode ? '#2D2D3E' : '#E5E7EB',
                      },
                      isArabic && styles.rowReverse,
                    ]}
                  >
                    <TouchableOpacity onPress={() => handleToggleMilestone(ms.id)}>
                      <Ionicons
                        name={ms.isCompleted ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={ms.isCompleted ? colors.success : colors.textMuted}
                      />
                    </TouchableOpacity>

                    <Text
                      style={[
                        styles.msText,
                        {
                          color: ms.isCompleted ? colors.textMuted : colors.text,
                          textDecorationLine: ms.isCompleted ? 'line-through' : 'none',
                          textAlign: isArabic ? 'right' : 'left',
                        },
                      ]}
                    >
                      {ms.text}
                    </Text>

                    <TouchableOpacity onPress={() => handleRemoveMilestone(ms.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add new milestone input */}
                <View
                  style={[
                    styles.addMsInputRow,
                    {
                      backgroundColor: isDarkMode ? '#1E1E28' : '#F9FAFB',
                      borderColor: isDarkMode ? '#2D2D3E' : '#E5E7EB',
                    },
                    isArabic && styles.rowReverse,
                  ]}
                >
                  <TextInput
                    style={[
                      styles.addMsInput,
                      { color: colors.text, textAlign: isArabic ? 'right' : 'left' },
                    ]}
                    placeholder={isArabic ? '+ أضف مهمة فرعية جديدة...' : '+ Add sub-milestone...'}
                    placeholderTextColor={colors.textMuted}
                    value={newMilestoneText}
                    onChangeText={setNewMilestoneText}
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
                    }}
                    onSubmitEditing={handleAddMilestone}
                  />
                  {newMilestoneText.trim().length > 0 && (
                    <TouchableOpacity onPress={handleAddMilestone} style={[styles.addMsSubmitBtn, { backgroundColor: color }]}>
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Live Generative Card Preview (Collapsible) */}
            {type === 'goal' && (
              <View style={{ marginTop: 18 }}>
                <TouchableOpacity
                  style={[
                    styles.previewToggleRow,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                      borderColor: isDarkMode ? '#2D2245' : '#E2E8F0',
                    },
                    isArabic && styles.rowReverse,
                  ]}
                  onPress={() => setShowLivePreview((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="card" size={15} color={isDarkMode ? '#AFE607' : color} />
                    <Text style={[styles.previewToggleText, { color: colors.text }]}>
                      {isArabic ? 'معاينة البطاقة الحية (Live Card Preview)' : 'Live Generative Card Preview'}
                    </Text>
                  </View>
                  <Ionicons
                    name={showLivePreview ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                {showLivePreview && (
                  <View style={styles.cardPreviewContainer}>
                    <PostalStampGoalCard
                      title={text.trim() || (isArabic ? 'عنوان الهدف...' : 'Your goal title...')}
                      description={description.trim()}
                      category={category || (isArabic ? 'أهداف عامة' : 'General')}
                      color={color}
                      icon={icon}
                      timeframe={timeframe}
                      milestones={milestones.map((m) => ({
                        id: m.id,
                        text: m.text,
                        isCompleted: m.isCompleted,
                      }))}
                      isArabic={isArabic}
                      backdropColor={isDarkMode ? '#0B0812' : colors.bg}
                      onToggleMilestone={handleToggleMilestone}
                      onDeleteMilestone={handleRemoveMilestone}
                      onAddMilestone={(newText) => {
                        setMilestones((prev) => [
                          ...prev,
                          { id: `ms_${Date.now()}_${Math.random()}`, text: newText, isCompleted: false },
                        ]);
                      }}
                      readOnly={false}
                    />
                  </View>
                )}
              </View>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Bottom Action Row */}
          <View
            style={[
              styles.bottomActionRow,
              { borderTopColor: isDarkMode ? '#282836' : '#E5E7EB' },
              isArabic && styles.rowReverse,
            ]}
          >
            <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <LivePress
              style={[styles.saveBtn, { backgroundColor: color }]}
              onPress={handleSave}
              disabled={isSaving}
              pressScale={0.97}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name={isEdit ? 'checkmark-circle' : 'add-circle'} size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>
                    {isEdit
                      ? isArabic ? 'حفظ التعديلات' : 'Save Changes'
                      : isArabic
                      ? type === 'goal' ? 'إضافة الهدف' : 'إضافة الإنجاز'
                      : type === 'goal' ? 'Create Goal' : 'Create Achievement'}
                  </Text>
                </>
              )}
            </LivePress>
          </View>

          <UniversalLinkPickerModal
            visible={isLinkPickerOpen}
            onClose={() => setIsLinkPickerOpen(false)}
            onSelect={(selection) => {
              if (selection.type === 'category') {
                setLinkedCategoryId(selection.categoryId);
                setLinkedSubCategoryId(undefined);
                setLinkedProjectId(undefined);
              } else if (selection.type === 'subCategory') {
                setLinkedCategoryId(selection.categoryId);
                setLinkedSubCategoryId(selection.subCategoryId);
                setLinkedProjectId(undefined);
              } else if (selection.type === 'project') {
                setLinkedProjectId(selection.projectId);
                setLinkedCategoryId(undefined);
                setLinkedSubCategoryId(undefined);
              } else if (selection.type === 'none') {
                setLinkedCategoryId(undefined);
                setLinkedSubCategoryId(undefined);
                setLinkedProjectId(undefined);
              }
            }}
            currentCategoryId={linkedCategoryId}
            currentProjectId={linkedProjectId}
          />

          <VoiceRecordModal
            visible={isVoiceModalOpen}
            onClose={() => setIsVoiceModalOpen(false)}
            onFinishRecording={handleFinishVoiceRecording}
            isArabic={isArabic}
          />
        </View>
      </View>
    </Modal>
  );
};

export const EditGoalModal = GoalFormModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: 14,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  typeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  typeToggleBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  typeToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  titleInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    minHeight: 50,
  },
  descInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '500',
    minHeight: 60,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  customCatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  customCatApplyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customCatCancelBtn: {
    padding: 6,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorDot: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  iconOptionBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestonesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  msCountBadge: {
    fontSize: 12,
    fontWeight: '800',
  },
  msRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  msText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  addMsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  addMsInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 6,
  },
  addMsSubmitBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  titleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleToolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coPilotAssistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  coPilotAssistText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  coPilotShelf: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  coPilotShelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  coPilotShelfTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  coPilotMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  coPilotCategoryPill: {
    backgroundColor: 'rgba(175, 230, 7, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(175, 230, 7, 0.3)',
  },
  coPilotCategoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AFE607',
  },
  coPilotChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  suggestedChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addAllChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addAllChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  frameworkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  frameworkChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  previewToggleText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  cardPreviewContainer: {
    marginVertical: 4,
  },
});

