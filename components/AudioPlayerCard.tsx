import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import useAudioPlayerCustom from '@/hooks/useAudioPlayer';
import { TranscriptStatus } from '@/types/voiceNote';

interface AudioPlayerCardProps {
  audioUrl?: string | null;
  duration?: number; // in seconds
  transcriptStatus?: TranscriptStatus;
  transcript?: string;
  onDeleteAudio?: () => void;
  onRetryTranscribe?: () => void;
  isArabic?: boolean;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const PLAYBACK_SPEEDS = [1.0, 1.25, 1.5, 2.0];

// Fixed visual audio bar distribution for the scrubber
const AUDIO_BAR_HEIGHTS = [
  0.35, 0.6, 0.8, 0.45, 0.9, 0.65, 0.4, 0.75, 1.0, 0.7, 0.5, 0.85, 0.95,
  0.6, 0.4, 0.7, 0.85, 0.55, 0.9, 0.75, 0.5, 0.65, 0.4, 0.3,
];

export const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({
  audioUrl,
  duration = 0,
  transcriptStatus = 'none',
  transcript,
  onDeleteAudio,
  onRetryTranscribe,
  isArabic = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const isDark = isDarkMode;
  const { t } = useTranslation(isArabic ? 'ar' : 'en');
  const [speedIndex, setSpeedIndex] = useState(0);
  const [trackWidth, setTrackWidth] = useState(280);

  const {
    isPlaying,
    currentTime,
    duration: playerDuration,
    playbackRate,
    togglePlayPause,
    seekTo,
    setRate,
  } = useAudioPlayerCustom(audioUrl, duration);

  const totalDuration = playerDuration > 0 ? playerDuration : duration;
  const progressPercent = totalDuration > 0 ? Math.min(1, Math.max(0, currentTime / totalDuration)) : 0;

  const handleTogglePlayback = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    togglePlayPause();
  };

  const handleCycleSpeed = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    const nextIdx = (speedIndex + 1) % PLAYBACK_SPEEDS.length;
    setSpeedIndex(nextIdx);
    setRate(PLAYBACK_SPEEDS[nextIdx]);
  };

  const handleSkip = (secondsDelta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    const target = Math.max(0, Math.min(totalDuration, currentTime + secondsDelta));
    seekTo(target);
  };

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 50) setTrackWidth(width);
  };

  const handleScrub = (locationX: number) => {
    if (trackWidth <= 0 || totalDuration <= 0) return;
    try {
      Haptics.selectionAsync();
    } catch (_) {}
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    seekTo(ratio * totalDuration);
  };

  const confirmDelete = () => {
    Alert.alert(
      t.delete || 'Delete Audio',
      t.deleteAudioConfirm || 'Are you sure you want to delete this audio recording?',
      [
        { text: t.cancel || 'Cancel', style: 'cancel' },
        {
          text: t.delete || 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (_) {}
            onDeleteAudio?.();
          },
        },
      ]
    );
  };

  const wordCount = transcript ? transcript.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0B0812' : colors.surface,
          borderColor: isDark ? 'rgba(139, 92, 246, 0.28)' : colors.border,
        },
      ]}
    >
      {/* ─── Top Main Control Row ─── */}
      <View style={[styles.mainRow, isArabic && { flexDirection: 'row-reverse' }]}>
        {/* Play / Pause Circular Button */}
        <TouchableOpacity
          style={[
            styles.playButton,
            { backgroundColor: isDark ? '#AFE607' : colors.primary },
          ]}
          onPress={handleTogglePlayback}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color={isDark ? '#0B0812' : '#FFFFFF'}
            style={{ marginLeft: isPlaying ? 0 : 2 }}
          />
        </TouchableOpacity>

        {/* 10s Rewind Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => handleSkip(-10)}
          activeOpacity={0.75}
        >
          <Ionicons name="play-back-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.skipText, { color: colors.textMuted }]}>10s</Text>
        </TouchableOpacity>

        {/* 10s Forward Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => handleSkip(10)}
          activeOpacity={0.75}
        >
          <Ionicons name="play-forward-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.skipText, { color: colors.textMuted }]}>10s</Text>
        </TouchableOpacity>

        {/* Middle: Title & Time Counter */}
        <View style={[styles.infoBlock, isArabic && { alignItems: 'flex-end' }]}>
          <Text style={[styles.audioLabel, { color: colors.text }]}>
            {isArabic ? 'تسجيل صوتي عالي الجودة' : 'High-Fidelity Audio'}
          </Text>
          <Text style={[styles.timeLabel, { color: colors.textMuted }]}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </Text>
        </View>

        {/* Right Actions: Speed Pill & Delete */}
        <View style={[styles.actionsRow, isArabic && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity
            style={[
              styles.speedBadge,
              {
                backgroundColor: isDark ? 'rgba(175, 230, 7, 0.12)' : 'rgba(108, 56, 233, 0.08)',
                borderColor: isDark ? 'rgba(175, 230, 7, 0.35)' : 'rgba(108, 56, 233, 0.25)',
              },
            ]}
            onPress={handleCycleSpeed}
            activeOpacity={0.8}
          >
            <Text style={[styles.speedText, { color: isDark ? '#AFE607' : colors.primary }]}>
              {PLAYBACK_SPEEDS[speedIndex]}x
            </Text>
          </TouchableOpacity>

          {onDeleteAudio && (
            <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Equalizer Scrubber Timeline ─── */}
      <TouchableOpacity
        style={styles.visualizerContainer}
        activeOpacity={1}
        onLayout={handleTrackLayout}
        onPress={(e) => handleScrub(e.nativeEvent.locationX)}
      >
        <View style={styles.barsRow}>
          {AUDIO_BAR_HEIGHTS.map((relHeight, index) => {
            const barFraction = (index + 0.5) / AUDIO_BAR_HEIGHTS.length;
            const isPlayed = barFraction <= progressPercent;
            return (
              <View
                key={index}
                style={[
                  styles.audioBar,
                  {
                    height: Math.max(6, relHeight * 26),
                    backgroundColor: isPlayed
                      ? (isDark ? '#AFE607' : colors.primary)
                      : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'),
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Scrubber Progress Fill Line with Knob */}
        <View style={styles.timelineTrack}>
          <View
            style={[
              styles.timelineProgress,
              {
                width: `${progressPercent * 100}%`,
                backgroundColor: isDark ? '#AFE607' : colors.primary,
              },
            ]}
          />
          <View
            style={[
              styles.scrubberThumb,
              {
                left: `${progressPercent * 100}%`,
                backgroundColor: isDark ? '#AFE607' : colors.primary,
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* ─── Transcription Status Bar ─── */}
      {transcriptStatus === 'transcribing' && (
        <View
          style={[
            styles.transcribingRow,
            {
              backgroundColor: isDark ? 'rgba(175, 230, 7, 0.08)' : 'rgba(108, 56, 233, 0.06)',
              borderColor: isDark ? 'rgba(175, 230, 7, 0.25)' : 'rgba(108, 56, 233, 0.2)',
            },
            isArabic && { flexDirection: 'row-reverse' },
          ]}
        >
          <ActivityIndicator size="small" color={isDark ? '#AFE607' : colors.primary} />
          <Text style={[styles.transcribingText, { color: isDark ? '#AFE607' : colors.primary }]}>
            {isArabic ? 'جارِ تفريغ التسجيل بالذكاء الاصطناعي في الخلفية...' : 'AI transcribing audio in background...'}
          </Text>
        </View>
      )}

      {transcriptStatus === 'completed' && (
        <View
          style={[
            styles.completedBadgeRow,
            isArabic && { flexDirection: 'row-reverse' },
          ]}
        >
          <View style={[styles.completedChip, isArabic && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.completedText}>
              {isArabic ? 'تم التفريغ بدقة' : 'Transcribed'}
            </Text>
          </View>
          {wordCount > 0 && (
            <Text style={[styles.wordCountText, { color: colors.textMuted }]}>
              {wordCount} {isArabic ? 'كلمة' : 'words'}
            </Text>
          )}
        </View>
      )}

      {transcriptStatus === 'failed' && (
        <View
          style={[
            styles.failedRow,
            isArabic && { flexDirection: 'row-reverse' },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
          <Text style={[styles.failedText, { color: '#EF4444' }]}>
            {isArabic ? 'تعذر التفريغ التلقائي' : 'Transcription failed'}
          </Text>
          {onRetryTranscribe && (
            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch (_) {}
                onRetryTranscribe();
              }}
              style={styles.retryButton}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={12} color="#EF4444" />
              <Text style={styles.retryButtonText}>
                {isArabic ? 'إعادة المحاولة' : 'Retry'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#AFE607',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  infoBlock: {
    flex: 1,
    paddingHorizontal: 6,
  },
  audioLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  timeLabel: {
    fontSize: 11,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  speedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deleteButton: {
    padding: 6,
  },
  visualizerContainer: {
    marginTop: 14,
    paddingVertical: 4,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 30,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  audioBar: {
    width: 3.5,
    borderRadius: 2,
  },
  timelineTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    position: 'relative',
  },
  timelineProgress: {
    height: '100%',
    borderRadius: 2,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  transcribingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  transcribingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  completedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  wordCountText: {
    fontSize: 11,
    fontWeight: '500',
  },
  failedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.15)',
  },
  failedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    marginLeft: 6,
  },
  retryButtonText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default AudioPlayerCard;
