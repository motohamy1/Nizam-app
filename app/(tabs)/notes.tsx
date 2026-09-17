import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Modal,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

import { createAddScreenStyles } from '@/assets/styles/addScreen.styles';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { useGuardedSubmit } from '@/hooks/useSubmitGuard';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import useTheme from '@/hooks/useTheme';
import { modeColor } from '@/utils/colorUtils';
import { useTranslation } from '@/utils/i18n';
import ActionModal from '@/components/ActionModal';
import { useScreenGuide } from '@/hooks/useScreenGuide';
import ScreenGuide from '@/components/ScreenGuide';
import type { GuideTip } from '@/components/ScreenGuide';
import LivePress from '@/components/LivePress';
import VoiceWaveform from '@/components/VoiceWaveform';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';
import { useMutation, useAction } from 'convex/react';
import AnimatedWavyHeader from '@/components/AnimatedWavyHeader';

// Helper to format date with ordinal day (e.g., "4th Jan 2026")
const formatCardDate = (timestamp?: number): string => {
  if (!timestamp) return 'Today';
  const d = new Date(timestamp);
  const day = d.getDate();
  const suffix =
    day >= 11 && day <= 13
      ? 'th'
      : day % 10 === 1
      ? 'st'
      : day % 10 === 2
      ? 'nd'
      : day % 10 === 3
      ? 'rd'
      : 'th';
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
};

// Subtle playful rotation angles for card deck layout (matching reference mockup)
const CARD_ROTATIONS = ['-2.4deg', '1.8deg', '-1.5deg', '2.2deg', '-2.0deg', '1.4deg'];

// High-fidelity sample notes matching the reference mockup aesthetic
const DEFAULT_MOCKUP_NOTES = [
  {
    _id: 'mockup-1',
    text: 'This is a mockup stupid 🙂',
    description: "Don't read the caption, its all same, you dumb dumb, did you even read this though",
    type: 'note',
    hashtags: ['#work'],
    createdAt: Date.now() - 3600 * 1000,
    icon: 'snow-outline',
    isSample: true,
  },
  {
    _id: 'mockup-2',
    text: 'What do you expect from me 😡 ?',
    description: "Don't read the caption, its all same, you dumb dumb, did you even read this though",
    type: 'note',
    hashtags: ['#work'],
    createdAt: Date.now() - 2 * 3600 * 1000,
    icon: 'bulb-outline',
    isSample: true,
  },
  {
    _id: 'mockup-3',
    text: 'Yes, created all notes on same day 🙂',
    description: "Don't read the caption, its all same, you dumb dumb, did you even read this though",
    type: 'note',
    hashtags: ['#work'],
    createdAt: Date.now() - 3 * 3600 * 1000,
    icon: 'layers-outline',
    isSample: true,
  },
  {
    _id: 'mockup-4',
    text: 'Not sure where this is going',
    description: "Don't read the caption, its all same, you dumb dumb, did you even read this though",
    type: 'note',
    hashtags: ['#Personal'],
    createdAt: Date.now() - 4 * 3600 * 1000,
    icon: 'compass-outline',
    isSample: true,
  },
  {
    _id: 'mockup-5',
    text: 'Yes, created all notes on same day 🙂',
    description: "Don't read the caption, its all same, you dumb dumb, did you even read this though",
    type: 'reminder',
    dueDate: Date.now() + 2 * 3600 * 1000,
    hashtags: ['#Personal'],
    createdAt: Date.now() - 5 * 3600 * 1000,
    icon: 'alarm-outline',
    isSample: true,
  },
  {
    _id: 'mockup-6',
    text: 'Morning Workout & Cardio 🏃‍♂️',
    description: '45 mins interval training, core workout, and post-stretch recovery.',
    type: 'reminder',
    dueDate: Date.now() + 12 * 3600 * 1000,
    hashtags: ['#Fitness'],
    createdAt: Date.now() - 6 * 3600 * 1000,
    icon: 'barbell-outline',
    isSample: true,
  },
];

export default function AddScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { userId, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = useMemo(() => createAddScreenStyles(colors, isArabic), [colors, isArabic]);
  const insets = useSafeAreaInsets();
  const { showGuide, dismissGuide } = useScreenGuide('addScreen');

  // Input Mode: Voice vs Typing
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isListening, setIsListening] = useState(false);

  // Dynamic user-defined hashtag for current note creation
  const [currentHashtag, setCurrentHashtag] = useState<string>('#work');
  const [customHashtags, setCustomHashtags] = useState<string[]>(['#work', '#Personal', '#Fitness', '#Ideas']);
  const [isAddTagModalVisible, setAddTagModalVisible] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Quick Typing State
  const [typingText, setTypingText] = useState('');
  const [typingType, setTypingType] = useState<'note' | 'reminder'>('note');
  const [typingDueDate, setTypingDueDate] = useState<number | undefined>(undefined);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // Reminder Time Picker (option inside the note composer)
  const [isCalendarModalVisible, setCalendarModalVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Card Action State
  const [actionVisible, setActionVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Native Voice Recorder Hook (Inline, No Disruptive Modals)
  const {
    isRecording,
    isPaused,
    duration: recordingDuration,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Convex Data & Mutations
  const todos = useOfflineQuery<any[]>('todos', api.todos.get, userId ? { userId } : 'skip');
  const addTodo = useOfflineMutation(api.todos.addTodo, 'todos:addTodo');
  const deleteTodo = useOfflineMutation(api.todos.deleteTodo, 'todos:deleteTodo');

  const generateAudioUploadUrl = useMutation(api.audio.generateAudioUploadUrl);
  const attachAudioToNote = useMutation(api.audio.attachAudioToNote);
  const transcribeAudioAction = useAction(api.audio.transcribeAudio);

  // Handler when voice recording completes in notes tab
  const handleVoiceRecordingFinished = async (result: { uri: string; duration: number }) => {
    if (!userId) return;
    try {
      // 1. Create a new note
      const newNoteId = await addTodo({
        userId,
        text: isArabic ? 'ملاحظة صوتية' : 'Voice Note',
        description: '',
        status: 'not_started',
        type: 'note',
        hashtags: [currentHashtag || '#Voice'],
        date: Date.now(),
      });

      if (!newNoteId) return;

      // 2. Request signed upload URL from Convex
      const uploadUrl = await generateAudioUploadUrl();

      // 3. Upload audio binary directly to Convex storage
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, result.uri, {
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'Content-Type': 'audio/m4a',
        },
      });

      if (uploadResult.status !== 200) {
        throw new Error(`Audio upload failed: ${uploadResult.body}`);
      }

      const { storageId } = JSON.parse(uploadResult.body);

      // 4. Attach audio to note document
      await attachAudioToNote({
        noteId: newNoteId,
        storageId,
        duration: result.duration,
        mimeType: 'audio/m4a',
      });

      // 5. Trigger AI transcription in background
      transcribeAudioAction({
        noteId: newNoteId,
        storageId,
        languageHint: isArabic ? 'ar' : 'en',
      }).catch((err) => console.warn('Background transcription error:', err));

      // 6. Navigate directly to the new note detail screen
      router.push({
        pathname: '/note-detail',
        params: { id: newNoteId },
      });
    } catch (err) {
      console.error('Error creating voice note from notes tab:', err);
    }
  };

  const handleToggleInlineRecording = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        await handleVoiceRecordingFinished(result);
      }
    } else {
      await startRecording();
    }
  };

  const handleCancelInlineRecording = async () => {
    await cancelRecording();
  };

  // Pulsing recording dot animation when speaking
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (isListening) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [isListening, pulseOpacity]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Guide tips
  const tips: GuideTip[] = isArabic
    ? [
        { icon: 'mic-outline', title: 'المساعد الصوتي للملاحظات', description: 'اضغط على زر التحدث للبدء في إملاء الملاحظات والتذكيرات.', accentColor: '#dbd4fd' },
        { icon: 'create-outline', title: 'الكتابة المباشرة', description: 'يمكنك التبديل إلى وضع الكتابة لإدخال ملاحظاتك وتذكيراتك نصياً.', accentColor: '#defef9' },
        { icon: 'pricetag-outline', title: 'الأوسمة المخصصة', description: 'ضع وسماً مخصصاً # لكل ملاحظة وتذكير لتنظيمها ببطاقات أنيقة.', accentColor: '#D4FF00' },
      ]
    : [
        { icon: 'mic-outline', title: 'Voice Notes Assistant', description: 'Tap speak to dictate ideas, notes, and reminders instantly.', accentColor: '#dbd4fd' },
        { icon: 'create-outline', title: 'Direct Quick Typing', description: 'Switch to Type mode to jot down notes with your own hashtag.', accentColor: '#defef9' },
        { icon: 'pricetag-outline', title: 'Dynamic Hashtags', description: 'Tag notes with your own custom #tag to organize them into decks.', accentColor: '#D4FF00' },
      ];

  // Derive dynamic list of all available hashtags from existing notes + custom additions
  const allAvailableHashtags = useMemo(() => {
    const set = new Set<string>();
    customHashtags.forEach((tag) => set.add(tag.startsWith('#') ? tag : `#${tag}`));

    if (todos && todos.length > 0) {
      todos.forEach((t: any) => {
        if (t.hashtags && Array.isArray(t.hashtags)) {
          t.hashtags.forEach((h: string) => {
            if (h && typeof h === 'string') {
              set.add(h.startsWith('#') ? h : `#${h}`);
            }
          });
        }
      });
    }

    return Array.from(set);
  }, [todos, customHashtags]);

  // STRICT Filter: ONLY Notes and Reminders
  // Explicitly excludes Tasks & Events
  const notesAndRemindersList = useMemo(() => {
    let list: any[] = [];

    if (todos && todos.length > 0) {
      list = todos
        .filter((t: any) => {
          if (t.location || t.meetingLink) return false;
          if (t.parentId || t.categoryId || t.subCategoryId || t.projectId || t.timerDuration) return false;
          if (t.type === 'note' || t.type === 'reminder') return true;
          if (!t.type && (t.description || t.dueDate) && !t.priority && !t.isCompleted && (!t.status || t.status === 'not_started')) {
            return true;
          }
          return false;
        })
        .map((item: any) => ({
          ...item,
          type: item.type || (item.dueDate && item.dueDate > 0 ? 'reminder' : 'note'),
          createdAt: item.date || item._creationTime || Date.now(),
          hashtags: item.hashtags && item.hashtags.length > 0 ? item.hashtags : [item.type === 'reminder' ? '#Personal' : '#work'],
        }));
    }

    // If user has no saved notes/reminders yet, show sample notes
    if (list.length === 0) {
      list = [...DEFAULT_MOCKUP_NOTES];
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          (item.text && item.text.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [todos, searchQuery]);

  // Group notes by Dynamic Hashtags into sections
  const groupedByHashtags = useMemo(() => {
    const groups: { [tag: string]: any[] } = {};

    notesAndRemindersList.forEach((item) => {
      const tags = (item.hashtags && item.hashtags.length > 0) ? item.hashtags : ['#General'];
      tags.forEach((rawTag: string) => {
        const tag = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(item);
      });
    });

    return groups;
  }, [notesAndRemindersList]);

  // Handler for adding a new dynamic hashtag
  const handleAddNewHashtag = () => {
    if (!newTagInput.trim()) return;
    const formatted = newTagInput.trim().startsWith('#') ? newTagInput.trim() : `#${newTagInput.trim()}`;
    if (!customHashtags.includes(formatted)) {
      setCustomHashtags((prev) => [...prev, formatted]);
    }
    setCurrentHashtag(formatted);
    setNewTagInput('');
    setAddTagModalVisible(false);
  };

  // Guarded: typingText is cleared via setState (not synchronously), so two
  // taps in the same tick both pass the emptiness check and create two notes.
  const handleSaveTypedNote = useGuardedSubmit(async () => {
    const textToSave = typingText.trim();
    if (!textToSave) return;
    const tagToSave = currentHashtag || '#Notes';
    const savedType = typingType;
    const savedDueDate = typingDueDate;

    setTypingText('');
    setTypingDueDate(undefined);
    Keyboard.dismiss();

    if (userId) {
      try {
        await addTodo({
          userId,
          text: textToSave,
          type: savedType, // 'note' | 'reminder'
          dueDate: savedType === 'reminder' ? (savedDueDate || Date.now() + 3600 * 1000) : undefined,
          date: Date.now(),
          status: 'not_started',
          hashtags: [tagToSave],
        });
      } catch (err) {
        console.warn('Failed to add note', err);
      }
    }
  });

  // Applies the picked time to the composer's reminder option (next occurrence)
  const handleApplyReminderTime = () => {
    setCalendarModalVisible(false);
    const target = new Date();
    target.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);
    if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);
    setTypingDueDate(target.getTime());
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ─── Top Status Bar ────────────────────────────────────────── */}
      <AnimatedWavyHeader backgroundColor={colors.bg} waveHeight={10} contentStyle={{ paddingBottom: 2 }}>
        <View style={[styles.topStatusBar, { paddingBottom: 6 }]}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {isArabic ? 'الملاحظات' : 'Notes'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.topMenuBtn}
            activeOpacity={0.8}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </AnimatedWavyHeader>

      {/* ─── Mode Switcher: Voice vs Type ─────────────────────────── */}
      <View style={styles.modeSelectorRow}>
        <TouchableOpacity
          style={[styles.modePill, inputMode === 'voice' && styles.modePillActive]}
          onPress={() => {
            setInputMode('voice');
            Keyboard.dismiss();
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="mic-outline"
            size={16}
            color={inputMode === 'voice' ? colors.text : colors.textMuted}
          />
          <Text style={[styles.modePillText, inputMode === 'voice' && styles.modePillTextActive]}>
            {isArabic ? 'إملاء صوتي' : 'Voice Input'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modePill}
          onPress={() => {
            if (isRecording) {
              handleToggleInlineRecording();
            }
            router.push({
              pathname: '/note-detail',
              params: {
                isReminder: 'false',
                tag: currentHashtag,
              },
            });
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={colors.textMuted}
          />
          <Text style={styles.modePillText}>
            {isArabic ? 'كتابة' : 'Type'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Hero Input Section: Voice OR Typing ─────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroSection}>
          {inputMode === 'voice' ? (
            /* ─── Voice Hero Card ─────────────────────────────────── */
            <View style={styles.voiceHeroCard}>
              <View style={styles.heroStatusRow}>
                {/* Listening / Idle Status Indicator */}
                <TouchableOpacity
                  style={isRecording ? styles.listeningPill : styles.idlePill}
                  activeOpacity={0.8}
                  onPress={handleToggleInlineRecording}
                >
                  {isRecording ? (
                    <>
                      <Animated.View style={[styles.recordingDot, animatedDotStyle]} />
                      <Text style={styles.listeningText}>
                        {isArabic
                          ? `تسجيل (${formatRecordingTime(recordingDuration)})`
                          : `Recording ${formatRecordingTime(recordingDuration)}`}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="mic-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.idleText}>
                        {isArabic ? 'جاهز للتسجيل' : 'Tap to Speak'}
                      </Text>
                      <View style={styles.idleDot} />
                    </>
                  )}
                </TouchableOpacity>

                {/* User Defined Hashtag Chip */}
                <TouchableOpacity
                  style={styles.heroTagChip}
                  activeOpacity={0.8}
                  onPress={() => setAddTagModalVisible(true)}
                >
                  <Ionicons name="pricetag-outline" size={13} color={modeColor('#D4FF00', isDarkMode)} />
                  <Text style={styles.heroTagChipText}>{currentHashtag}</Text>
                  <Ionicons name="chevron-down" size={12} color={modeColor('#D4FF00', isDarkMode)} />
                </TouchableOpacity>
              </View>

              {/* Pure Transparent Siri Waveform responding to live voice audio level */}
              <TouchableOpacity
                style={styles.waveformBox}
                activeOpacity={0.9}
                onPress={handleToggleInlineRecording}
              >
                <VoiceWaveform isListening={isRecording} audioLevel={audioLevel} />
              </TouchableOpacity>

              {/* Dynamic Transcript / Recording Status Preview */}
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptPreviousText}>
                  {isRecording
                    ? (isArabic ? 'جارِ التقاط الصوت بجودة عالية...' : 'Capturing voice in high fidelity...')
                    : (isArabic ? 'ملاحظة صوتية ذكية' : 'Smart Voice Note')}
                </Text>
                <Text style={styles.transcriptFocusText}>
                  {isRecording
                    ? (isArabic ? 'تحدث الآن، ستتفاعل الأمواج مع صوتك' : 'Speak now — waves react to your voice')
                    : (isArabic ? 'اضغط للتحدث أو تسجيل فكرة' : 'Tap below to capture your idea')}
                </Text>
                <Text style={styles.transcriptNextText}>
                  {isRecording
                    ? (isArabic ? `سيتم تحويلها لنص وحفظها تحت ${currentHashtag}` : `Will transcribe & save to ${currentHashtag}`)
                    : (isArabic ? 'سيتم حفظها تحت الوسم المحدد' : `Will be saved under ${currentHashtag}`)}
                </Text>
              </View>

              {/* Inline Action Controls */}
              {isRecording ? (
                <View
                  style={{
                    flexDirection: isArabic ? 'row-reverse' : 'row',
                    gap: 10,
                    width: '100%',
                    marginTop: 8,
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.tapToSpeakBtn,
                      {
                        flex: 1,
                        backgroundColor: 'rgba(239, 68, 68, 0.16)',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={handleToggleInlineRecording}
                  >
                    <Ionicons name="stop-circle" size={20} color="#EF4444" />
                    <Text
                      style={[
                        styles.tapToSpeakText,
                        { color: '#EF4444', fontWeight: '700' },
                      ]}
                    >
                      {isArabic
                        ? `إيقاف وحفظ (${formatRecordingTime(recordingDuration)})`
                        : `Stop & Save (${formatRecordingTime(recordingDuration)})`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 22,
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceHigh,
                      borderWidth: 1,
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    activeOpacity={0.85}
                    onPress={handleCancelInlineRecording}
                  >
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.tapToSpeakBtn}
                  activeOpacity={0.85}
                  onPress={handleToggleInlineRecording}
                >
                  <Ionicons name="mic" size={18} color={colors.primary} />
                  <Text style={styles.tapToSpeakText}>
                    {isArabic ? 'بدء التسجيل الصوتي' : 'Start Voice Input'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* ─── Direct Keyboard Input Card ─────────────────────── */
            <View style={styles.typingCard}>
              {/* Type Switcher + Hashtag Selector */}
              <View style={styles.typingTypeToggles}>
                <View style={styles.typingLeftToggles}>
                  <TouchableOpacity
                    style={[styles.typeToggleBtn, typingType === 'note' && styles.typeToggleBtnActive]}
                    onPress={() => setTypingType('note')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typeToggleText, typingType === 'note' && styles.typeToggleTextActive]}>
                      {isArabic ? '📝 ملاحظة' : '📝 Note'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeToggleBtn, typingType === 'reminder' && styles.typeToggleBtnActive]}
                    onPress={() => {
                      setTypingType('reminder');
                      if (!typingDueDate) setTypingDueDate(Date.now() + 3600 * 1000);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typeToggleText, typingType === 'reminder' && styles.typeToggleTextActive]}>
                      {isArabic ? '⏰ تذكير' : '⏰ Reminder'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Hashtag Selector Chip */}
                <TouchableOpacity
                  style={styles.heroTagChip}
                  activeOpacity={0.8}
                  onPress={() => setAddTagModalVisible(true)}
                >
                  <Ionicons name="pricetag-outline" size={13} color={modeColor('#D4FF00', isDarkMode)} />
                  <Text style={styles.heroTagChipText}>{currentHashtag}</Text>
                  <Ionicons name="chevron-down" size={12} color={modeColor('#D4FF00', isDarkMode)} />
                </TouchableOpacity>
              </View>

              {/* Inline Editable Hashtag Input */}
              <View style={styles.typingTagInputContainer}>
                <Ionicons name="pricetag" size={14} color={modeColor('#D4FF00', isDarkMode)} />
                <TextInput
                  style={[styles.typingTagInput, isArabic && { textAlign: 'right' }]}
                  placeholder={isArabic ? 'اكتب الوسم مثل: #عمل' : 'Enter hashtag e.g. #work'}
                  placeholderTextColor="#6B7280"
                  value={currentHashtag}
                  onChangeText={(text) => {
                    if (text && !text.startsWith('#')) {
                      setCurrentHashtag(`#${text}`);
                    } else {
                      setCurrentHashtag(text);
                    }
                  }}
                />
              </View>

              {/* Text Input */}
              <TextInput
                style={[styles.typingInput, isArabic && { textAlign: 'right' }]}
                placeholder={
                  typingType === 'reminder'
                    ? (isArabic ? 'اكتب عنوان التذكير هنا...' : 'Type reminder title & details...')
                    : (isArabic ? 'اكتب ملاحظتك السريعة هنا...' : 'Type your quick note here...')
                }
                placeholderTextColor="#6B7280"
                value={typingText}
                onChangeText={setTypingText}
                multiline={true}
                blurOnSubmit={false}
              />

              {/* Footer */}
              <View style={styles.typingFooterRow}>
                {typingType === 'reminder' ? (
                  <TouchableOpacity
                    style={styles.typingReminderBtn}
                    onPress={() => {
                      if (typingDueDate) setReminderTime(new Date(typingDueDate));
                      setCalendarModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={15} color="#FBBF24" />
                    <Text style={styles.typingReminderText}>
                      {typingDueDate
                        ? new Date(typingDueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : (isArabic ? 'تحديد الوقت' : 'Set Time')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                <TouchableOpacity
                  style={[
                    styles.typingSaveBtn,
                    !typingText.trim() && styles.typingSaveBtnDisabled,
                  ]}
                  onPress={handleSaveTypedNote}
                  disabled={!typingText.trim()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.typingSaveText}>
                    {isArabic ? 'حفظ' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        {/* ─── Search & Controls Row ─────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={styles.controlsRow}>
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={19} color="#8E92A0" />
            <TextInput
              style={[styles.searchInput, isArabic && { textAlign: 'right' }]}
              placeholder={isArabic ? 'البحث في الملاحظات' : 'Search Notes'}
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#8E92A0" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ─── Grouped Sections By Dynamic Hashtags ─────────────────── */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)}>
          {Object.keys(groupedByHashtags).length === 0 ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={42} color="#6B7280" />
              <Text style={{ color: colors.textMuted, fontSize: 15, fontWeight: '600', marginTop: 10 }}>
                {isArabic ? 'لا توجد ملاحظات بعد' : 'No notes found'}
              </Text>
            </View>
          ) : (
            Object.entries(groupedByHashtags).map(([hashtagTitle, items]) => (
              <View key={hashtagTitle} style={styles.hashtagSection}>
                {/* Hashtag Header + Underline Divider (Reference Mockup) */}
                <View style={styles.hashtagHeaderBlock}>
                  <Text style={[styles.hashtagSectionTitle, isArabic && { textAlign: 'right' }]}>
                    {hashtagTitle}
                  </Text>
                  <View style={styles.hashtagSectionLine} />
                </View>

                {/* Horizontal Deck Carousel */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsCarouselContent}
                >
                  {items.map((item, index) => {
                    const formattedDate = formatCardDate(item.createdAt);
                    const isReminderItem = item.type === 'reminder' || (item.dueDate && item.dueDate > 0);
                    const tiltDegree = CARD_ROTATIONS[index % CARD_ROTATIONS.length];

                    return (
                      <Animated.View
                        key={item._id}
                        entering={FadeInDown.duration(350).delay(index * 40)}
                      >
                        <View style={{ transform: [{ rotate: tiltDegree }] }}>
                          <LivePress
                            style={styles.whiteCardOuter}
                            activeOpacity={0.92}
                            onPress={() => {
                              if (item.isSample) {
                                router.push({
                                  pathname: '/note-detail',
                                  params: {
                                    isReminder: isReminderItem ? 'true' : 'false',
                                    tag: hashtagTitle,
                                  },
                                });
                              } else {
                                router.push({
                                  pathname: '/note-detail',
                                  params: { id: item._id, tag: hashtagTitle },
                                });
                              }
                            }}
                            onLongPress={() => {
                              setSelectedItem(item);
                              setActionVisible(true);
                            }}
                          >
                            {/* Top: Title & Date Subtitle */}
                            <View style={styles.cardTopBlock}>
                              <Text
                                style={[styles.cardTitleText, isArabic && { textAlign: 'right' }]}
                                numberOfLines={2}
                              >
                                {item.text || (isArabic ? 'ملاحظة بدون عنوان' : 'Untitled Note')}
                              </Text>
                              <Text style={[styles.cardDateText, isArabic && { textAlign: 'right' }]}>
                                {formattedDate}
                              </Text>

                              {/* Caption Preview */}
                              <Text
                                style={[styles.cardSnippetText, isArabic && { textAlign: 'right' }]}
                                numberOfLines={4}
                              >
                                {item.description || (isArabic ? 'لا توجد تفاصيل.' : 'No caption entered.')}
                              </Text>
                            </View>

                            {/* Bottom Row: Icon badge & optional reminder time */}
                            <View style={styles.cardBottomRow}>
                              <View style={styles.cardIconCircle}>
                                <Ionicons
                                  name={(item.icon as any) || (isReminderItem ? 'alarm-outline' : 'snow-outline')}
                                  size={16}
                                  color="#0F172A"
                                />
                              </View>

                              {item.dueDate ? (
                                <View style={styles.cardReminderTimeBadge}>
                                  <Ionicons name="time" size={11} color="#92400E" />
                                  <Text style={styles.cardReminderTimeText}>
                                    {new Date(item.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Text>
                                </View>
                              ) : (
                                <View />
                              )}
                            </View>
                          </LivePress>
                        </View>
                      </Animated.View>
                    );
                  })}
                </ScrollView>
              </View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* ─── Add/Change Custom Dynamic Hashtag Modal ─────────────────── */}
      <Modal
        visible={isAddTagModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddTagModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddTagModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isArabic ? 'اختيار أو كتابة وسم #' : 'Select or Create #Tag'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setAddTagModalVisible(false)}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Tag input */}
            <TextInput
              style={[styles.tagModalInput, isArabic && { textAlign: 'right' }]}
              placeholder={isArabic ? 'اكتب اسم الوسم... مثال: #مشروع' : 'Enter hashtag... e.g. #Project'}
              placeholderTextColor="#6B7280"
              value={newTagInput}
              onChangeText={setNewTagInput}
              autoFocus={true}
              onSubmitEditing={handleAddNewHashtag}
            />

            {/* Quick suggested chips */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 14 }}>
              {isArabic ? 'الأوسمة الحالية:' : 'Existing Hashtags:'}
            </Text>
            <View style={styles.suggestedTagsRow}>
              {allAvailableHashtags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.suggestedTagChip,
                    currentHashtag === tag && { borderColor: modeColor('#D4FF00', isDarkMode), backgroundColor: isDarkMode ? 'rgba(212, 255, 0, 0.15)' : 'rgba(84, 118, 0, 0.09)' },
                  ]}
                  onPress={() => {
                    setCurrentHashtag(tag);
                    setAddTagModalVisible(false);
                  }}
                >
                  <Text style={[styles.suggestedTagText, currentHashtag === tag && { color: modeColor('#D4FF00', isDarkMode), fontWeight: '800' }]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalActionBtn, !newTagInput.trim() && { opacity: 0.5 }]}
              activeOpacity={0.88}
              disabled={!newTagInput.trim()}
              onPress={handleAddNewHashtag}
            >
              <Text style={styles.modalActionBtnText}>
                {isArabic ? 'تطبيق هذا الوسم' : 'Apply Hashtag'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Calendar & Time Reminder Modal ───────────────────────── */}
      <Modal
        visible={isCalendarModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCalendarModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isArabic ? 'جدولة تذكير بوقت' : 'Schedule Reminder with Time'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCalendarModalVisible(false)}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Time Selector */}
            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted }}>
                {isArabic ? 'اختر وقت التذكير:' : 'Select Reminder Time:'}
              </Text>

              <View
                style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isDarkMode ? '#1E2028' : colors.surfaceHigh,
                  padding: 14,
                  borderRadius: 16,
                }}
              >
                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="time-outline" size={22} color={modeColor('#D4FF00', isDarkMode)} />
                  <Text style={{ color: isDarkMode ? '#FFFFFF' : colors.text, fontSize: 16, fontWeight: '700' }}>
                    {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    display="compact"
                    themeVariant="dark"
                    onChange={(e, d) => d && setReminderTime(d)}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    style={{
                      backgroundColor: '#2A2C38',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: modeColor('#D4FF00', isDarkMode), fontWeight: '700' }}>
                      {isArabic ? 'تغيير الوقت' : 'Set Time'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {showTimePicker && Platform.OS !== 'ios' && (
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display="default"
                  themeVariant="dark"
                  onChange={(e, d) => {
                    setShowTimePicker(false);
                    if (d) setReminderTime(d);
                  }}
                />
              )}

              {/* Action Button: Apply time to reminder option */}
              <TouchableOpacity
                style={styles.modalActionBtn}
                activeOpacity={0.88}
                onPress={handleApplyReminderTime}
              >
                <Text style={styles.modalActionBtnText}>
                  {isArabic ? 'تعيين وقت التذكير' : 'Set Reminder Time'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Top 3-Dots Quick Action Modal ───────────────────────── */}
      <ActionModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={isArabic ? 'خيارات الملاحظات' : 'Notes Options'}
        isArabic={isArabic}
        options={[
          {
            label: isArabic ? 'ملاحظة جديدة' : 'New Note',
            icon: 'create-outline',
            onPress: () => router.push({ pathname: '/note-detail', params: { isReminder: 'false', tag: currentHashtag } }),
          },
          {
            label: isArabic ? 'تذكير جديد بوقت' : 'New Reminder with Time',
            icon: 'alarm-outline',
            onPress: () => router.push({ pathname: '/note-detail', params: { isReminder: 'true', tag: currentHashtag } }),
          },
          {
            label: isArabic ? 'تغيير الوسم الحالي' : 'Change Active #Hashtag',
            icon: 'pricetag-outline',
            onPress: () => setAddTagModalVisible(true),
          },
          {
            label: isArabic ? 'دليل الاستخدام' : 'Screen Guide',
            icon: 'help-circle-outline',
            onPress: () => dismissGuide && dismissGuide(),
          },
          {
            label: isArabic ? 'مسح البحث' : 'Clear Search',
            icon: 'refresh-outline',
            onPress: () => {
              setSearchQuery('');
            },
          },
        ]}
      />

      {/* ─── Card Long-Press Action Modal ─────────────────────────── */}
      <ActionModal
        visible={actionVisible}
        onClose={() => {
          setActionVisible(false);
          setSelectedItem(null);
        }}
        title={selectedItem?.text || (isArabic ? 'ملاحظة' : 'Note')}
        isArabic={isArabic}
        options={[
          {
            label: isArabic ? 'فتح وتعديل' : 'Open & Edit',
            icon: 'create-outline',
            onPress: () => {
              if (selectedItem && !selectedItem.isSample) {
                router.push({ pathname: '/note-detail', params: { id: selectedItem._id } });
              } else {
                router.push({
                  pathname: '/note-detail',
                  params: {
                    isReminder: selectedItem?.type === 'reminder' ? 'true' : 'false',
                    tag: selectedItem?.hashtags?.[0] || currentHashtag,
                  },
                });
              }
            },
          },
          {
            label: isArabic ? 'مشاركة' : 'Share',
            icon: 'share-social-outline',
            onPress: () => {
              if (selectedItem) {
                Share.share({
                  message: `${selectedItem.text || 'Note'}\n\n${selectedItem.description || ''}`,
                });
              }
            },
          },
          {
            label: isArabic ? 'حذف' : 'Delete',
            icon: 'trash-outline',
            variant: 'destructive',
            onPress: () => {
              if (selectedItem && !selectedItem.isSample) {
                deleteTodo({ id: selectedItem._id });
              }
            },
          },
        ]}
      />

      {/* ─── Screen Guide Tips ────────────────────────────────────── */}
      <ScreenGuide
        visible={showGuide}
        tips={tips}
        onDismiss={dismissGuide}
        isArabic={isArabic}
      />
    </SafeAreaView>
  );
}
