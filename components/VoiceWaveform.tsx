import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface VoiceWaveformProps {
  isListening: boolean;
  audioLevel?: number; // 0 to 1
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isListening = false,
  audioLevel = 0.5,
}) => {
  const phase1 = useSharedValue(0);
  const phase2 = useSharedValue(0);
  const amplitude = useSharedValue(isListening ? 1 : 0.12);
  const targetLevel = useSharedValue(0.5);

  useEffect(() => {
    if (audioLevel !== undefined) {
      targetLevel.value = withTiming(Math.max(0.2, Math.min(1.4, audioLevel)), { duration: 120 });
    }
  }, [audioLevel]);

  useEffect(() => {
    // Keep a subtle ambient phase moving even when idle
    phase1.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: isListening ? 1800 : 4500,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    phase2.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: isListening ? 1400 : 3800,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    if (isListening) {
      amplitude.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
    } else {
      // Gentle breathing resting line
      amplitude.value = withTiming(0.12, { duration: 400, easing: Easing.out(Easing.quad) });
    }
  }, [isListening, amplitude, phase1, phase2]);

  const animatedWaveProps1 = useAnimatedProps(() => {
    const p = phase1.value;
    const a = amplitude.value * (isListening ? targetLevel.value : 0.15);
    const w = 360;
    const midY = 45;

    const y1 = midY - 26 * a * Math.sin(p + 0.5);
    const y2 = midY + 30 * a * Math.cos(p + 1.2);
    const y3 = midY - 20 * a * Math.sin(p + 2.4);

    const d = `M 0 ${midY} 
      Q ${w * 0.2} ${midY - 5 * a} ${w * 0.35} ${y1} 
      T ${w * 0.65} ${y2} 
      T ${w * 0.85} ${y3} 
      T ${w} ${midY}`;

    return { d };
  });

  const animatedWaveProps2 = useAnimatedProps(() => {
    const p = phase2.value;
    const a = amplitude.value * (isListening ? Math.max(0.3, targetLevel.value * 0.85) : 0.12);
    const w = 360;
    const midY = 45;

    const y1 = midY + 22 * a * Math.cos(p);
    const y2 = midY - 24 * a * Math.sin(p + 1.6);
    const y3 = midY + 16 * a * Math.cos(p + 2.8);

    const d = `M 0 ${midY} 
      Q ${w * 0.25} ${midY + 6 * a} ${w * 0.42} ${y1} 
      T ${w * 0.68} ${y2} 
      T ${w * 0.88} ${y3} 
      T ${w} ${midY}`;

    return { d };
  });

  const animatedWaveProps3 = useAnimatedProps(() => {
    const p = phase1.value * 0.85;
    const a = amplitude.value * (isListening ? targetLevel.value * 0.75 : 0.08);
    const w = 360;
    const midY = 45;

    const y1 = midY - 14 * a * Math.cos(p + 0.8);
    const y2 = midY + 18 * a * Math.sin(p + 1.9);

    const d = `M 0 ${midY} 
      Q ${w * 0.3} ${midY} ${w * 0.5} ${y1} 
      T ${w * 0.75} ${y2} 
      T ${w} ${midY}`;

    return { d };
  });

  return (
    <View style={styles.container}>
      <Svg width="100%" height={90} viewBox="0 0 360 90">
        <Defs>
          {/* Brand Neon Lime to Mint & Royal Violet */}
          <LinearGradient id="nizamVoiceGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#AFE607" stopOpacity="0" />
            <Stop offset="20%" stopColor="#AFE607" stopOpacity="0.85" />
            <Stop offset="50%" stopColor="#00E8DE" stopOpacity="0.95" />
            <Stop offset="80%" stopColor="#8B5CF6" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </LinearGradient>

          {/* Royal Violet to Lavender & Gold */}
          <LinearGradient id="nizamVoiceGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0" />
            <Stop offset="30%" stopColor="#A78BFA" stopOpacity="0.8" />
            <Stop offset="60%" stopColor="#AFE607" stopOpacity="0.9" />
            <Stop offset="85%" stopColor="#FFB986" stopOpacity="0.75" />
            <Stop offset="100%" stopColor="#FFB986" stopOpacity="0" />
          </LinearGradient>

          {/* Core Crisp Specular Line */}
          <LinearGradient id="nizamVoiceCoreLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#AFE607" stopOpacity="0.1" />
            <Stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <Stop offset="50%" stopColor="#AFE607" stopOpacity="1" />
            <Stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
          </LinearGradient>
        </Defs>

        {/* Outer Glow Wave Layer 1 (Expanded presence when listening) */}
        <AnimatedPath
          animatedProps={animatedWaveProps1}
          stroke="url(#nizamVoiceGrad1)"
          strokeWidth={isListening ? 14 : 4}
          strokeOpacity={isListening ? 0.45 : 0.18}
          fill="none"
          strokeLinecap="round"
        />

        {/* Secondary Harmonic Wave Layer 2 */}
        <AnimatedPath
          animatedProps={animatedWaveProps2}
          stroke="url(#nizamVoiceGrad2)"
          strokeWidth={isListening ? 9 : 3}
          strokeOpacity={isListening ? 0.65 : 0.22}
          fill="none"
          strokeLinecap="round"
        />

        {/* Tertiary Accent Wave Layer 3 (Active when listening) */}
        {isListening && (
          <AnimatedPath
            animatedProps={animatedWaveProps3}
            stroke="url(#nizamVoiceGrad1)"
            strokeWidth={5}
            strokeOpacity={0.8}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Center Glowing Specular Wave */}
        <AnimatedPath
          animatedProps={animatedWaveProps1}
          stroke={isListening ? 'url(#nizamVoiceCoreLine)' : 'rgba(175, 230, 7, 0.45)'}
          strokeWidth={isListening ? 2.6 : 1.4}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoiceWaveform;
