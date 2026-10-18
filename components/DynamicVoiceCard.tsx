import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Clipboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';

interface DynamicVoiceCardProps {
  transcript: string;
  onUpdateTranscript?: (newText: string) => void;
  onInsertToNote: (text: string) => void;
  onClear: () => void;
  onAskAI?: (transcript: string) => void;
  isArabic?: boolean;
}

export const DynamicVoiceCard: React.FC<DynamicVoiceCardProps> = ({
  transcript,
  onUpdateTranscript,
  onInsertToNote,
  onClear,
  onAskAI,
  isArabic = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const isDark = isDarkMode;

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(transcript);
  const [copiedToast, setCopiedToast] = useState(false);

  // Sync if transcript prop changes while not actively editing
  React.useEffect(() => {
    if (!isEditing) {
      setEditText(transcript);
    }
  }, [transcript, isEditing]);

  const wordCount = transcript
    ? transcript.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleCopy = () => {
    try {
      Clipboard.setString(transcript);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Save changes
      if (onUpdateTranscript) {
        onUpdateTranscript(editText.trim());
      }
      setIsEditing(false);
    } else {
      setEditText(transcript);
      setIsEditing(true);
    }
  };

  const handleInsert = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    const textToInsert = isEditing ? editText.trim() : transcript.trim();
    onInsertToNote(textToInsert);
  };

  const accentColor = colors.primary || '#6366F1';

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isDark ? 'rgba(99, 102, 241, 0.45)' : 'rgba(99, 102, 241, 0.35)',
        },
      ]}
    >
      {/* Top Header Row */}
      <View style={[styles.headerRow, isArabic && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.badgeGroup, isArabic && { flexDirection: 'row-reverse' }]}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)' },
            ]}
          >
            <Ionicons name="mic" size={15} color={accentColor} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {isArabic ? 'تفريغ صوتي ذكي' : 'Voice Dictation'}
          </Text>
          {wordCount > 0 && (
            <View
              style={[
                styles.wordBadge,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Text style={[styles.wordBadgeText, { color: colors.textMuted }]}>
                {isArabic ? `${wordCount} كلمة` : `${wordCount} words`}
              </Text>
            </View>
          )}
        </View>

        {/* Action icons */}
        <View style={[styles.actionsRow, isArabic && { flexDirection: 'row-reverse' }]}>
          {copiedToast && (
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981', marginRight: 4 }}>
              {isArabic ? 'تم النسخ!' : 'Copied!'}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleToggleEdit}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isEditing ? 'checkmark-circle' : 'create-outline'}
              size={18}
              color={isEditing ? '#10B981' : colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCopy}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="copy-outline" size={17} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClear}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Voice Text Body - auto expands and shrinks with content */}
      <View style={styles.bodyWrapper}>
        {isEditing ? (
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                textAlign: isArabic ? 'right' : 'left',
              },
            ]}
            value={editText}
            onChangeText={setEditText}
            multiline
            scrollEnabled={false}
            autoFocus
          />
        ) : (
          <Text
            style={[
              styles.transcriptText,
              { color: colors.text },
              isArabic && { textAlign: 'right', writingDirection: 'rtl' },
            ]}
            selectable
          >
            {transcript}
          </Text>
        )}
      </View>

      {/* Bottom Action Footer */}
      <View style={[styles.footerRow, isArabic && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity
          style={[styles.insertBtn, { backgroundColor: accentColor }]}
          onPress={handleInsert}
          activeOpacity={0.85}
        >
          <Ionicons name="document-text-outline" size={15} color="#FFFFFF" />
          <Text style={styles.insertBtnText}>
            {isArabic ? 'إدراج في الملاحظة' : 'Insert into Note'}
          </Text>
        </TouchableOpacity>

        {onAskAI && (
          <TouchableOpacity
            style={[
              styles.askAIBtn,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(99, 102, 241, 0.08)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
              },
            ]}
            onPress={() => onAskAI(isEditing ? editText : transcript)}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={14} color={accentColor} />
            <Text style={[styles.askAIBtnText, { color: accentColor }]}>
              {isArabic ? 'سؤال AI' : 'Ask AI'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.clearBtn}
          onPress={onClear}
          activeOpacity={0.7}
        >
          <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>
            {isArabic ? 'مسح' : 'Clear'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  wordBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  wordBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 3,
  },
  bodyWrapper: {
    marginVertical: 4,
  },
  transcriptText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  textInput: {
    fontSize: 15,
    lineHeight: 23,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
    minHeight: 48,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  insertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  insertBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  askAIBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  askAIBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginLeft: 'auto',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
