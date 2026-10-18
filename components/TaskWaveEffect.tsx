import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

interface TaskWaveEffectProps {
  status: string; // 'in_progress' | 'paused' | 'ready' | 'idle' | 'done'
  width?: number;
  height?: number;
}

/**
 * TaskWaveEffect renders an interactive live wavy sea background
 * for the Active Task card.
 *
 * - When 'in_progress': Waves continuously undulate and flow diagonally
 *   from top-left toward bottom-right with multi-layer oceanic swell.
 * - When 'paused': The flowing wave motion halts, transitioning into a calm,
 *   rhythmic "waiting / breathing" pulse.
 * - When idle / done: Settles into a calm, subtle resting gradient surface.
 */
export const TaskWaveEffect: React.FC<TaskWaveEffectProps> = ({
  status,
  width = 420,
  height = 200,
}) => {
  const isRunning = status === 'in_progress';
  const isPaused = status === 'paused';

  // Wave 1 horizontal flow (faster, foreground swell)
  const wave1TranslateX = useSharedValue(0);
  // Wave 2 horizontal flow (slower, background swell)
  const wave2TranslateX = useSharedValue(0);
  // Vertical undulating swell / bobbing
  const waveBobbing = useSharedValue(0);
  // Paused waiting breathing pulse
  const waitingPulse = useSharedValue(1);

  useEffect(() => {
    if (isRunning) {
      // Cancel waiting pulse and reset to active visibility
      cancelAnimation(waitingPulse);
      waitingPulse.value = withTiming(1, { duration: 300 });

      // Live flow: repeating seamless translation over one 400px cycle
      wave1TranslateX.value = withRepeat(
        withTiming(-400, { duration: 4200, easing: Easing.linear }),
        -1,
        false
      );

      wave2TranslateX.value = withRepeat(
        withTiming(-400, { duration: 6800, easing: Easing.linear }),
        -1,
        false
      );

      // Organic vertical swell bobbing
      waveBobbing.value = withRepeat(
        withSequence(
          withTiming(6, { duration: 2100, easing: Easing.inOut(Easing.sin) }),
          withTiming(-6, { duration: 2100, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else if (isPaused) {
      // Freeze wave translations in place to signal stop
      cancelAnimation(wave1TranslateX);
      cancelAnimation(wave2TranslateX);
      cancelAnimation(waveBobbing);

      // Activate "waiting" effect: gentle, breathing ambient pulse
      waitingPulse.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      // Stopped / idle state
      cancelAnimation(wave1TranslateX);
      cancelAnimation(wave2TranslateX);
      cancelAnimation(waveBobbing);
      cancelAnimation(waitingPulse);
      waitingPulse.value = withTiming(0.5, { duration: 400 });
      waveBobbing.value = withTiming(0, { duration: 400 });
    }

    return () => {
      cancelAnimation(wave1TranslateX);
      cancelAnimation(wave2TranslateX);
      cancelAnimation(waveBobbing);
      cancelAnimation(waitingPulse);
    };
  }, [isRunning, isPaused, wave1TranslateX, wave2TranslateX, waveBobbing, waitingPulse]);

  // Wave 1 Animated Style (Foreground)
  const animatedWave1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: wave1TranslateX.value },
      { translateY: waveBobbing.value },
    ],
    opacity: waitingPulse.value,
  }));

  // Wave 2 Animated Style (Background swell)
  const animatedWave2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: wave2TranslateX.value },
      { translateY: -waveBobbing.value * 0.7 },
    ],
    opacity: waitingPulse.value * 0.85,
  }));

  // Seamless wave path with period of 400px, repeated across 1200px
  const wavePath1 =
    'M 0 55 C 100 25, 100 85, 200 55 C 300 25, 300 85, 400 55 ' +
    'C 500 25, 500 85, 600 55 C 700 25, 700 85, 800 55 ' +
    'C 900 25, 900 85, 1000 55 C 1100 25, 1100 85, 1200 55 ' +
    'L 1200 350 L 0 350 Z';

  const wavePath2 =
    'M 0 75 C 100 45, 100 105, 200 75 C 300 45, 300 105, 400 75 ' +
    'C 500 45, 500 105, 600 75 C 700 45, 700 105, 800 75 ' +
    'C 900 45, 900 105, 1000 75 C 1100 45, 1100 105, 1200 75 ' +
    'L 1200 350 L 0 350 Z';

  return (
    <View pointerEvents="none" style={styles.container}>
      {/* Rotated angle container: slopes waves from top-left toward bottom-right */}
      <View style={styles.angleWrapper}>
        {/* Wave Layer 2 (Background Swell) */}
        <Animated.View style={[styles.waveRow, animatedWave2Style]}>
          <Svg width={1200} height={350} viewBox="0 0 1200 350">
            <Defs>
              <LinearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
                <Stop offset="35%" stopColor="#ff9f66" stopOpacity="0.18" />
                <Stop offset="100%" stopColor="#c73200" stopOpacity="0.08" />
              </LinearGradient>
            </Defs>
            <Path d={wavePath2} fill="url(#waveGrad2)" />
          </Svg>
        </Animated.View>

        {/* Wave Layer 1 (Foreground Rolling Wave) */}
        <Animated.View style={[styles.waveRow, animatedWave1Style]}>
          <Svg width={1200} height={350} viewBox="0 0 1200 350">
            <Defs>
              <LinearGradient id="waveGrad1" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
                <Stop offset="25%" stopColor="#ffd2ad" stopOpacity="0.22" />
                <Stop offset="80%" stopColor="#ff4500" stopOpacity="0.12" />
                <Stop offset="100%" stopColor="#b32900" stopOpacity="0.04" />
              </LinearGradient>
            </Defs>
            <Path d={wavePath1} fill="url(#waveGrad1)" />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 34,
    overflow: 'hidden',
    zIndex: 0,
  },
  angleWrapper: {
    position: 'absolute',
    top: -40,
    left: -60,
    right: -60,
    bottom: -60,
    // Angled orientation: flows from top-left corner to bottom-right corner
    transform: [{ rotate: '-7deg' }, { scale: 1.15 }],
  },
  waveRow: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: 1200,
    height: 350,
  },
});

export default TaskWaveEffect;
