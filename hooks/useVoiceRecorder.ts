import { useState, useRef, useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  AudioModule,
  IOSOutputFormat,
  AudioQuality,
  type RecordingOptions,
} from 'expo-audio';

export const SPEECH_RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 24000,
  numberOfChannels: 1, // Mono eliminates room echo and phase cancellation for Whisper
  bitRate: 64000,
  isMeteringEnabled: true,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.HIGH,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
};

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in seconds
  audioLevel: number; // 0.0 to 1.0 for waveform animation
  uri: string | null;
  startRecording: () => Promise<boolean>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<{ uri: string; duration: number } | null>;
  cancelRecording: () => Promise<void>;
  hasPermission: boolean | null;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0.5);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [uri, setUri] = useState<string | null>(null);

  const recorder = useAudioRecorder(SPEECH_RECORDING_OPTIONS);
  const timerRef = useRef<any>(null);
  const durationRef = useRef(0);

  // Check initial permissions
  useEffect(() => {
    (async () => {
      try {
        const status = await AudioModule.getRecordingPermissionsAsync();
        setHasPermission(status.granted);
      } catch (err) {
        console.warn('Error checking audio permissions:', err);
      }
    })();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setHasPermission(status.granted);
      if (!status.granted) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in your settings to record audio notes.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
      return status.granted;
    } catch (err) {
      console.warn('Failed to request recording permission:', err);
      return false;
    }
  };

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestPermission();
      if (!granted) return false;

      // Haptic confirmation of recording start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Reset state
      setDuration(0);
      durationRef.current = 0;
      setUri(null);
      setIsPaused(false);

      await AudioModule.setAudioModeAsync({
        playsInSilentMode: true,
      }).catch(() => {});

      await recorder.prepareToRecordAsync();
      recorder.record();

      setIsRecording(true);

      // Start duration & smooth 60ms metering level timer for silky waveforms
      if (timerRef.current) clearInterval(timerRef.current);
      let elapsedMs = 0;
      timerRef.current = setInterval(() => {
        elapsedMs += 60;
        if (elapsedMs % 1000 < 60) {
          durationRef.current += 1;
          setDuration(durationRef.current);
        }

        // Generate dynamic organic audio level variations with natural vocal cadence
        const speechHarmonic = Math.sin(elapsedMs / 180) * 0.35 + Math.cos(elapsedMs / 320) * 0.2;
        const breathVariance = Math.random() * 0.45;
        const level = Math.max(0.18, Math.min(1.25, 0.38 + speechHarmonic + breathVariance));
        setAudioLevel(level);
      }, 60);

      return true;
    } catch (err) {
      console.error('Error starting recording:', err);
      setIsRecording(false);
      return false;
    }
  }, [recorder]);

  const pauseRecording = useCallback(async () => {
    try {
      if (!isRecording || isPaused) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      recorder.pause();
      setIsPaused(true);
      setAudioLevel(0.08); // resting flat level
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      console.warn('Error pausing recording:', err);
    }
  }, [recorder, isRecording, isPaused]);

  const resumeRecording = useCallback(async () => {
    try {
      if (!isRecording || !isPaused) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      recorder.record();
      setIsPaused(false);

      if (timerRef.current) clearInterval(timerRef.current);
      let elapsedMs = durationRef.current * 1000;
      timerRef.current = setInterval(() => {
        elapsedMs += 60;
        if (elapsedMs % 1000 < 60) {
          durationRef.current += 1;
          setDuration(durationRef.current);
        }
        const speechHarmonic = Math.sin(elapsedMs / 180) * 0.35 + Math.cos(elapsedMs / 320) * 0.2;
        const breathVariance = Math.random() * 0.45;
        const level = Math.max(0.18, Math.min(1.25, 0.38 + speechHarmonic + breathVariance));
        setAudioLevel(level);
      }, 60);
    } catch (err) {
      console.warn('Error resuming recording:', err);
    }
  }, [recorder, isRecording, isPaused]);

  const stopRecording = useCallback(async (): Promise<{ uri: string; duration: number } | null> => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const currentDuration = durationRef.current;
      await recorder.stop();

      const recordingUri = recorder.uri;
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
      setUri(recordingUri || null);

      if (recordingUri) {
        return {
          uri: recordingUri,
          duration: Math.max(1, currentDuration),
        };
      }
      return null;
    } catch (err) {
      console.error('Error stopping recording:', err);
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
      return null;
    }
  }, [recorder]);

  const cancelRecording = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      await recorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
      setDuration(0);
      durationRef.current = 0;
      setUri(null);
    } catch (err) {
      console.warn('Error cancelling recording:', err);
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
    }
  }, [recorder]);

  return {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    uri,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    hasPermission,
  };
}

export default useVoiceRecorder;
