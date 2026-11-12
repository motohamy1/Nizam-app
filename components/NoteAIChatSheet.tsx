import React, { useState, useRef, useEffect } from 'react';
import { View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
  Alert,
  useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { AIChatMessage } from '@/types/voiceNote';
import { useKeyboard } from '@/hooks/useKeyboard';

interface NoteAIChatSheetProps {
  visible: boolean;
  onClose: () => void;
  noteTitle: string;
  chatHistory: AIChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  onInsertToNote?: (content: string) => void;
  onClearChat?: () => void;
  onAddExtractedTasks?: (tasks: string[]) => void;
  isArabic?: boolean;
  isLoading?: boolean;
}

/**
 * Clean any remaining thinking/reasoning tags or thinking headers from AI model responses.
 */
export const cleanClientText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
    .replace(/<thought>[\s\S]*?(?:<\/thought>|$)/gi, '')
    .replace(/<reasoning>[\s\S]*?(?:<\/reasoning>|$)/gi, '')
    .replace(/<reflection>[\s\S]*?(?:<\/reflection>|$)/gi, '')
    .replace(/<scratchpad>[\s\S]*?(?:<\/scratchpad>|$)/gi, '')
    .replace(/<antThinking>[\s\S]*?(?:<\/antThinking>|$)/gi, '')
    .replace(/```(?:thought|thinking|reasoning)[\s\S]*?```/gi, '')
    .replace(/\[(?:Thinking Process|Thought Process|Reasoning)[\s\S]*?(?:\]|$)/gi, '')
    .replace(/^(?:#{1,6}\s*)?\*?\*?(?:Thought|Thinking Process|Thought Process|Reasoning Process|Internal Thoughts|Chain of Thought)\*?\*?:?[\s\S]*?(?=\n\n|\n[#*A-Z\u0600-\u06FF]|$)/gim, '')
    .replace(/^(?:Here's a thinking process|Let's analyze this step-by-step):?[\s\S]*?(?=\n\n|\n[#*A-Z\u0600-\u06FF]|$)/gim, '')
    .replace(/^(?:#{1,6}\s*)?\*?\*?(?:Question|User Question|Prompt|User Prompt|السؤال|سؤالك|استفسارك|المطلوب)\*?\*?:?\s*(?:".*?"|'.*?'|[^\n]+)?\n+/gim, '')
    .replace(/^(?:#{1,6}\s*)?\*?\*?(?:Answer|AI Response|Response|الإجابة|الرد|جواب)\*?\*?:?\s*/gim, '')
    .replace(/^(?:#{1,6}\s*)?\*?\*?(?:Executive Summary|Executive overview|الملخص التنفيذي|الملخص|Summary)\*?\*?:?\s*/gim, '')
    .trim();
};

/**
 * Helper to render inline markdown tags (**bold**, *italic*, `code`).
 */
const renderInlineSpans = (text: string, colors: any, isArabic: boolean) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <Text key={i} style={{ fontWeight: '800', color: colors.text }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <Text key={i} style={{ fontStyle: 'italic', color: colors.text }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <Text
          key={i}
          style={{
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
            backgroundColor: 'rgba(150, 150, 150, 0.18)',
            color: colors.primary || '#6366F1',
            paddingHorizontal: 4,
            borderRadius: 4,
            fontSize: 12.5,
          }}
        >
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

/**
 * Rich Formatted Markdown Content Renderer for AI Messages.
 */
const FormattedAIMessage: React.FC<{
  content: string;
  colors: any;
  isDark: boolean;
  isArabic: boolean;
}> = ({ content, colors, isDark, isArabic }) => {
  const sanitized = cleanClientText(content);
  if (!sanitized) return null;

  const lines = sanitized.split('\n');

  return (
    <View style={{ gap: 6 }}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={lineIdx} style={{ height: 4 }} />;
        }

        // H1 Heading
        if (trimmed.startsWith('# ')) {
          return (
            <Text
              key={lineIdx}
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: colors.primary || '#6366F1',
                marginTop: lineIdx > 0 ? 8 : 0,
                textAlign: isArabic ? 'right' : 'left',
              }}
            >
              {renderInlineSpans(trimmed.replace(/^#\s+/, ''), colors, isArabic)}
            </Text>
          );
        }

        // H2 Heading
        if (trimmed.startsWith('## ')) {
          return (
            <Text
              key={lineIdx}
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.text,
                marginTop: lineIdx > 0 ? 6 : 0,
                textAlign: isArabic ? 'right' : 'left',
              }}
            >
              {renderInlineSpans(trimmed.replace(/^##\s+/, ''), colors, isArabic)}
            </Text>
          );
        }

        // H3 Heading
        if (trimmed.startsWith('### ')) {
          return (
            <Text
              key={lineIdx}
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.text,
                marginTop: lineIdx > 0 ? 4 : 0,
                textAlign: isArabic ? 'right' : 'left',
              }}
            >
              {renderInlineSpans(trimmed.replace(/^###\s+/, ''), colors, isArabic)}
            </Text>
          );
        }

        // Bullet item
        const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
        if (bulletMatch) {
          return (
            <View
              key={lineIdx}
              style={{
                flexDirection: isArabic ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 8,
                paddingVertical: 1,
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: colors.primary || '#6366F1',
                  marginTop: 7,
                }}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.text,
                  textAlign: isArabic ? 'right' : 'left',
                }}
              >
                {renderInlineSpans(bulletMatch[1], colors, isArabic)}
              </Text>
            </View>
          );
        }

        // Numbered list item
        const numberMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
        if (numberMatch) {
          return (
            <View
              key={lineIdx}
              style={{
                flexDirection: isArabic ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 6,
                paddingVertical: 1,
              }}
            >
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)',
                  borderRadius: 6,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  minWidth: 18,
                  alignItems: 'center',
                  marginTop: 1,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary || '#6366F1' }}>
                  {numberMatch[1]}
                </Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.text,
                  textAlign: isArabic ? 'right' : 'left',
                }}
              >
                {renderInlineSpans(numberMatch[2], colors, isArabic)}
              </Text>
            </View>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <View
              key={lineIdx}
              style={{
                borderLeftWidth: isArabic ? 0 : 3,
                borderRightWidth: isArabic ? 3 : 0,
                borderColor: colors.primary || '#6366F1',
                paddingLeft: isArabic ? 0 : 10,
                paddingRight: isArabic ? 10 : 0,
                paddingVertical: 2,
                marginVertical: 2,
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 13.5,
                  lineHeight: 19,
                  fontStyle: 'italic',
                  color: colors.textMuted,
                  textAlign: isArabic ? 'right' : 'left',
                }}
              >
                {renderInlineSpans(trimmed.replace(/^>\s+/, ''), colors, isArabic)}
              </Text>
            </View>
          );
        }

        // Standard Paragraph
        return (
          <Text
            key={lineIdx}
            style={{
              fontSize: 14,
              lineHeight: 21,
              color: colors.text,
              textAlign: isArabic ? 'right' : 'left',
            }}
          >
            {renderInlineSpans(trimmed, colors, isArabic)}
          </Text>
        );
      })}
    </View>
  );
};

export const NoteAIChatSheet: React.FC<NoteAIChatSheetProps> = ({
  visible,
  onClose,
  noteTitle,
  chatHistory = [],
  onSendMessage,
  onInsertToNote,
  onClearChat,
  onAddExtractedTasks,
  isArabic = false,
  isLoading = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const isDark = isDarkMode;
  const { t } = useTranslation(isArabic ? 'ar' : 'en');
  const { height: screenHeight } = useWindowDimensions();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const [inputMessage, setInputMessage] = useState('');
  const scrollViewRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [visible, chatHistory, isLoading]);

  useEffect(() => {
    if (isKeyboardVisible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [isKeyboardVisible, keyboardHeight]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const msg = inputMessage.trim();
    setInputMessage('');
    await onSendMessage(msg);
  };

  const handleCopy = (text: string) => {
    const cleaned = cleanClientText(text);
    Clipboard.setString(cleaned);
    Alert.alert(t.actionSuccess || 'Copied', isArabic ? 'تم نسخ الرد بنجاح.' : 'Response copied to clipboard.');
  };

  const QUICK_PROMPTS = isArabic
    ? [
        { label: '📝 تلخيص الملاحظة', prompt: 'يرجى تقديم ملخص تنفيذي مركز لأهم الأفكار في هذه الملاحظة والتسجيل الصوتي.' },
        { label: '📋 استخراج المهام', prompt: 'استخرج جميع المهام وخطوات العمل القابلة للتنفيذ من هذه الملاحظة مع تحديد أولوياتها.' },
        { label: '💡 أبرز القرارات', prompt: 'ما هي أهم القرارات والأفكار المحورية الواردة في الملاحظة؟' },
        { label: '✨ تدقيق وصياغة', prompt: 'أعد صياغة وتنسيق هذه الملاحظة بأسلوب احترافي منظم وخالٍ من الأخطاء.' },
        { label: '🌐 ترجمة', prompt: 'ترجم محتوى هذه الملاحظة بدقة واحترافية.' },
      ]
    : [
        { label: '📝 Summarize Note', prompt: 'Please provide an executive summary of the key takeaways from this note.' },
        { label: '📋 Extract Tasks', prompt: 'Extract all actionable tasks and next steps from this note with suggested priorities.' },
        { label: '💡 Key Decisions', prompt: 'What are the main decisions, conclusions, and insights in this note?' },
        { label: '✨ Polish & Format', prompt: 'Refine and polish the phrasing and formatting of this note while preserving its full meaning.' },
        { label: '🌐 Translate', prompt: 'Translate the contents of this note with professional clarity.' },
      ];

  const handleSelectPrompt = async (promptText: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    await onSendMessage(promptText);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent={true}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#0B0812' : '#FFFFFF',
              borderColor: isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(0, 0, 0, 0.08)',
              // Lift the sheet on BOTH platforms using useKeyboard() height
              marginBottom: keyboardHeight,
              height: isKeyboardVisible
                ? Math.max(300, screenHeight - keyboardHeight - 44)
                : '78%',
              maxHeight: isKeyboardVisible
                ? Math.max(300, screenHeight - keyboardHeight - 44)
                : '78%',
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={styles.headerInfo}>
              <View style={[styles.headerBadge, isArabic && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="sparkles" size={15} color={isDark ? '#AFE607' : '#6C38E9'} />
                <Text style={[styles.aiTitle, { color: colors.text }]}>
                  {t.aiAssistant || 'Note AI Assistant'}
                </Text>
              </View>
              <Text
                style={[styles.noteSubtitle, { color: colors.textMuted }, isArabic && { textAlign: 'right' }]}
                numberOfLines={1}
              >
                {noteTitle || (isArabic ? 'ملاحظة بدون عنوان' : 'Untitled Note')}
              </Text>
            </View>
            <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
              {chatHistory.length > 0 && onClearChat && (
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    Alert.alert(
                      isArabic ? 'بدء محادثة جديدة' : 'New Conversation',
                      isArabic
                        ? 'هل تريد مسح سجل المحادثة والبدء من جديد لهذه الملاحظة؟'
                        : 'Do you want to clear chat history and start fresh for this note?',
                      [
                        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
                        {
                          text: isArabic ? 'مسح وبدء جديد' : 'Start Fresh',
                          style: 'destructive',
                          onPress: () => {
                            try {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            } catch (_) {}
                            onClearChat();
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="refresh-outline" size={19} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages Scroll Area */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ paddingVertical: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {chatHistory.length === 0 && !isLoading && (
              <View style={styles.emptyPrompt}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: isDark ? 'rgba(175, 230, 7, 0.12)' : 'rgba(108, 56, 233, 0.1)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Ionicons name="sparkles" size={28} color={isDark ? '#AFE607' : '#6C38E9'} />
                </View>
                <Text style={[styles.emptyPromptTitle, { color: colors.text }]}>
                  {isArabic ? 'اسأل المساعد الذكي للملاحظة' : 'Ask Note AI Assistant'}
                </Text>
                <Text style={[styles.emptyPromptSub, { color: colors.textMuted }]}>
                  {isArabic
                    ? 'ناقش محتوى الملاحظة، استخرج مهام العمل، أو اطلب تلخيصاً وافياً للأفكار.'
                    : 'Discuss your note, extract actionable tasks, or generate key insights.'}
                </Text>
              </View>
            )}

            {chatHistory.map((msg, index) => {
              const isUser = msg.role === 'user';
              const messageText = isUser ? msg.content : cleanClientText(msg.content);
              if (!messageText && !isUser) return null;

              return (
                <View
                  key={index}
                  style={[
                    styles.messageRow,
                    isUser ? styles.userRow : styles.modelRow,
                    isArabic && (isUser ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' }),
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? {
                            backgroundColor: isDark ? '#5B1497' : colors.primary,
                            shadowColor: isDark ? '#5B1497' : colors.primary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 6,
                            elevation: 3,
                          }
                        : {
                            backgroundColor: isDark ? '#181528' : 'rgba(241, 245, 249, 0.95)',
                            borderColor: isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(0, 0, 0, 0.06)',
                            borderWidth: 1,
                          },
                    ]}
                  >
                    {isUser ? (
                      <Text
                        style={[
                          styles.messageText,
                          {
                            color: '#FFFFFF',
                            fontWeight: '600',
                          },
                          isArabic && { textAlign: 'right' },
                        ]}
                      >
                        {messageText}
                      </Text>
                    ) : (
                      <FormattedAIMessage
                        content={messageText}
                        colors={colors}
                        isDark={isDark}
                        isArabic={isArabic}
                      />
                    )}

                    {/* Action buttons on AI responses */}
                    {!isUser && (
                      <View
                        style={[
                          styles.bubbleActions,
                          isArabic && { flexDirection: 'row-reverse' },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.bubbleActionBtn}
                          onPress={() => handleCopy(messageText)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="copy-outline" size={13} color={colors.textMuted} />
                          <Text style={[styles.bubbleActionText, { color: colors.textMuted }]}>
                            {t.share || 'Copy'}
                          </Text>
                        </TouchableOpacity>

                        {onInsertToNote && (
                          <TouchableOpacity
                            style={[
                              styles.bubbleActionBtn,
                              {
                                backgroundColor: isDark ? 'rgba(175, 230, 7, 0.12)' : 'rgba(108, 56, 233, 0.1)',
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 8,
                              },
                            ]}
                            onPress={() => {
                              try {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              } catch (_) {}
                              onInsertToNote(messageText);
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="add-circle-outline" size={13} color={isDark ? '#AFE607' : colors.primary} />
                            <Text style={[styles.bubbleActionText, { color: isDark ? '#AFE607' : colors.primary, fontWeight: '700' }]}>
                              {t.insertToNote || 'Insert into Note'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {isLoading && (
              <View style={[styles.messageRow, styles.modelRow]}>
                <View
                  style={[
                    styles.bubble,
                    {
                      backgroundColor: isDark ? '#181528' : 'rgba(241, 245, 249, 0.95)',
                      borderColor: isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(0, 0, 0, 0.06)',
                      borderWidth: 1,
                      paddingVertical: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    },
                  ]}
                >
                  <ActivityIndicator size="small" color={isDark ? '#AFE607' : colors.primary} />
                  <Text style={{ color: isDark ? '#AFE607' : colors.textMuted, fontSize: 13, fontWeight: '600' }}>
                    {t.aiThinking || 'Thinking & analyzing...'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* ─── Quick Suggestion Prompts Strip ─── */}
          <View style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)', paddingTop: 8 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                gap: 8,
                flexDirection: isArabic ? 'row-reverse' : 'row',
              }}
            >
              {QUICK_PROMPTS.map((qp, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    flexDirection: isArabic ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 14,
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(108, 56, 233, 0.07)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(108, 56, 233, 0.18)',
                  }}
                  onPress={() => handleSelectPrompt(qp.prompt)}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#FFFFFF' : colors.primary }}>
                    {qp.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Bottom Input Area */}
          <View
            style={[
              styles.inputRow,
              {
                borderTopColor: 'transparent',
              },
              isArabic && { flexDirection: 'row-reverse' },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  backgroundColor: isDark ? '#181528' : 'rgba(241, 245, 249, 0.8)',
                  borderColor: isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                  borderWidth: 1,
                },
                isArabic && { textAlign: 'right' },
              ]}
              placeholder={t.askAboutNote || 'Ask about this note...'}
              placeholderTextColor={colors.textMuted}
              value={inputMessage}
              onChangeText={setInputMessage}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: inputMessage.trim()
                    ? (isDark ? '#AFE607' : colors.primary)
                    : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'),
                },
              ]}
              onPress={handleSend}
              disabled={!inputMessage.trim() || isLoading}
              activeOpacity={0.85}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={inputMessage.trim() ? (isDark ? '#0B0812' : '#FFFFFF') : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    height: '75%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  headerInfo: {
    flex: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  noteSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyPromptSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  modelRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  bubbleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bubbleActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NoteAIChatSheet;
