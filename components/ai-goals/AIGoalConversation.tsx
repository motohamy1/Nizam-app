/**
 * components/ai-goals/AIGoalConversation.tsx
 * Conversational thread and input dock for the AI Goal Architect.
 * Supports text, voice transcription, and contextual quick action prompt chips.
 * Implements Section 17-21, 26, 61 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { VoiceRecordModal } from '@/components/VoiceRecordModal';
import { AIGoalMessage } from '@/types/aiGoals';

interface AIGoalConversationProps {
  messages: AIGoalMessage[];
  isThinking: boolean;
  onSendMessage: (text: string) => void;
  onQuickAction: (action: string) => void;
  isArabic?: boolean;
}

export const AIGoalConversation: React.FC<AIGoalConversationProps> = ({
  messages,
  isThinking,
  onSendMessage,
  onQuickAction,
  isArabic = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Convex voice helpers
  const generateAudioUploadUrl = useMutation(api.audio.generateAudioUploadUrl);
  const transcribeAudioAction = useAction(api.audio.transcribeAudio);

  const handleSend = () => {
    if (!inputText.trim() || isThinking) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleFinishVoice = async (result: { uri: string; duration: number }) => {
    try {
      setIsTranscribing(true);
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
        onSendMessage(transcribeRes.transcript.trim());
      }
    } catch (err) {
      console.warn('Voice transcription error:', err);
    } finally {
      setIsTranscribing(false);
      setIsVoiceOpen(false);
    }
  };

  // Contextual quick chips
  const quickChips = isArabic
    ? [
        { label: 'اقترح مراحل', action: 'suggest_milestones' },
        { label: 'اختصر العنوان', action: 'shorten_title' },
        { label: 'تحويل لقائمة مهام', action: 'switch_to_checklist' },
        { label: 'اقتراح مشاريع', action: 'suggest_projects' },
      ]
    : [
        { label: 'Suggest milestones', action: 'suggest_milestones' },
        { label: 'Make title punchier', action: 'shorten_title' },
        { label: 'Switch to checklist', action: 'switch_to_checklist' },
        { label: 'Suggest projects', action: 'suggest_projects' },
      ];

  return (
    <View style={styles.container}>
      {/* Messages Feed */}
      <ScrollView
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <View
              key={m.id}
              style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.assistantRow,
                isArabic && (isUser ? styles.rowReverseRtl : styles.rowNormalRtl),
              ]}
            >
              {!isUser && (
                <View style={styles.assistantAvatar}>
                  <Ionicons name="sparkles" size={13} color="#EA580C" />
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.userText : styles.assistantText,
                    isArabic && styles.textRtl,
                  ]}
                >
                  {m.content}
                </Text>
              </View>
            </View>
          );
        })}

        {isThinking && (
          <View style={[styles.messageRow, styles.assistantRow, isArabic && styles.rowNormalRtl]}>
            <View style={styles.assistantAvatar}>
              <Ionicons name="sparkles" size={13} color="#EA580C" />
            </View>
            <View style={[styles.bubble, styles.assistantBubble, styles.thinkingBubble]}>
              <ActivityIndicator size="small" color="#EA580C" />
              <Text style={styles.thinkingText}>
                {isArabic ? 'جاري الصياغة...' : 'Shaping your goal...'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Contextual Action Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipsContainer, isArabic && styles.chipsContainerRtl]}
      >
        {quickChips.map((chip, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => onQuickAction(chip.action)}
            style={styles.quickChip}
            activeOpacity={0.7}
          >
            <Text style={styles.quickChipText}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input Dock: Mic + Text + Send */}
      <View style={[styles.inputDock, isArabic && styles.rowRtl]}>
        <TouchableOpacity
          onPress={() => setIsVoiceOpen(true)}
          style={[styles.micBtn, isTranscribing && styles.micBtnActive]}
          activeOpacity={0.8}
          disabled={isTranscribing || isThinking}
        >
          {isTranscribing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="mic" size={18} color="#EA580C" />
          )}
        </TouchableOpacity>

        <TextInput
          style={[styles.inputField, isArabic && styles.textRtl]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={
            isArabic
              ? 'تحدث أو اكتب للتعديل (مثلاً: أضف كورس، اختصر...)'
              : 'Speak or type instruction (e.g. add milestones...)'
          }
          placeholderTextColor="#94A3B8"
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || isThinking}
          style={[
            styles.sendBtn,
            inputText.trim() && !isThinking ? styles.sendBtnActive : styles.sendBtnDisabled,
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isArabic ? 'arrow-back' : 'arrow-forward'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Voice Recording Modal */}
      <VoiceRecordModal
        visible={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onFinishRecording={handleFinishVoice}
        isArabic={isArabic}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  messagesScroll: {
    maxHeight: 180,
    marginBottom: 8,
  },
  messagesList: {
    gap: 8,
    paddingVertical: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  rowReverseRtl: {
    flexDirection: 'row',
  },
  rowNormalRtl: {
    flexDirection: 'row-reverse',
  },
  textRtl: {
    textAlign: 'right',
  },
  assistantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  userBubble: {
    backgroundColor: '#EA580C',
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 2,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontSize: 12,
    color: '#64748B',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#1E293B',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 6,
  },
  chipsContainerRtl: {
    flexDirection: 'row-reverse',
  },
  quickChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  quickChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#EA580C',
  },
  sendBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
});
