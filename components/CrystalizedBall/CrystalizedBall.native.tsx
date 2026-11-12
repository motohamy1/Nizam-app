import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  Rect,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { BALL_PRESETS } from './presets';
import type { CrystalizedBallProps, CrystalizedBallPreset } from './presets';

// Seeded PRNG for stable internal particle distribution
function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface OrbParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
}

export const CrystalizedBallNative: React.FC<CrystalizedBallProps> = ({
  preset = 'plasma',
  color: customColor,
  size = 54,
  style,
  isRunning = false,
  isCompleted = false,
  timerLabel,
  onPress,
}) => {
  const presetConfig = BALL_PRESETS[preset as CrystalizedBallPreset] || BALL_PRESETS.plasma;
  const primaryViolet = customColor || presetConfig.color || '#C084FC';
  const neonLime = '#AFE607';

  const sphereRadius = (size / 2) * 0.90;
  const center = size / 2;

  // Reanimated rotations for internal plasma stardust
  const rotationOuter = useSharedValue(0);
  const rotationInner = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(rotationOuter);
    cancelAnimation(rotationInner);
    cancelAnimation(pulse);

    if (isRunning) {
      rotationOuter.value = withRepeat(
        withTiming(360, { duration: 6000, easing: Easing.linear }),
        -1,
        false
      );

      rotationInner.value = withRepeat(
        withTiming(-360, { duration: 4200, easing: Easing.linear }),
        -1,
        false
      );

      pulse.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.96, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      rotationOuter.value = withRepeat(
        withTiming(360, { duration: 22000, easing: Easing.linear }),
        -1,
        false
      );

      rotationInner.value = withRepeat(
        withTiming(-360, { duration: 17000, easing: Easing.linear }),
        -1,
        false
      );

      pulse.value = withTiming(1, { duration: 300 });
    }
  }, [isRunning]);

  const animatedOuterStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationOuter.value}deg` }],
  }));

  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationInner.value}deg` }],
  }));

  const animatedAuraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value * 1.08 }],
    opacity: (isRunning ? 0.42 : 0.22) * pulse.value,
  }));

  // Internal stardust particles
  const particles = useMemo(() => {
    const list: OrbParticle[] = [];
    const rand = seededRandom(77);
    const tones = ['#FFFFFF', '#E9D5FF', '#C084FC', '#9333EA', neonLime];

    for (let i = 0; i < 48; i++) {
      const angle = rand() * Math.PI * 2;
      const r = (0.2 + Math.sqrt(rand()) * 0.72) * sphereRadius;
      list.push({
        id: i,
        x: center + Math.cos(angle) * r,
        y: center + Math.sin(angle) * r,
        size: i % 4 === 0 ? 1.6 : 1.1,
        color: tones[i % tones.length],
        opacity: 0.65 + rand() * 0.35,
      });
    }
    return list;
  }, [sphereRadius, center, neonLime]);

  const group1 = useMemo(() => particles.slice(0, 24), [particles]);
  const group2 = useMemo(() => particles.slice(24), [particles]);

  const uniqueId = useMemo(() => Math.random().toString(36).substring(2, 9), []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {/* 1. Subtle Outer Glow */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.glowLayer,
          {
            backgroundColor: primaryViolet,
            borderRadius: size / 2,
          },
          animatedAuraStyle,
        ]}
      />

      {/* 2. Base Plasma Sphere Core */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient
              id={`sphereCore-${uniqueId}`}
              cx="40%"
              cy="35%"
              r="65%"
              fx="40%"
              fy="35%"
            >
              <Stop offset="0%" stopColor="#4A1D88" stopOpacity="0.95" />
              <Stop offset="55%" stopColor="#240D4A" stopOpacity="0.98" />
              <Stop offset="90%" stopColor="#0B0812" stopOpacity="1" />
              <Stop offset="100%" stopColor="#05030A" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={center}
            cy={center}
            r={sphereRadius}
            fill={`url(#sphereCore-${uniqueId})`}
          />
        </Svg>
      </View>

      {/* 3. Rotating Stardust Layer 1 (Clockwise) */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedOuterStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {group1.map((p) => (
            <Circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={p.size / 2}
              fill={p.color}
              opacity={p.opacity}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* 4. Counter-Rotating Stardust Layer 2 (Counter-Clockwise) */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedInnerStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {group2.map((p) => (
            <Rect
              key={p.id}
              x={p.x - p.size / 2}
              y={p.y - p.size / 2}
              width={p.size}
              height={p.size}
              fill={p.color}
              opacity={p.opacity}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* 5. Central Time Label & Play/Pause/Done Icon */}
      <View style={styles.overlayContent} pointerEvents="none">
        <View style={styles.timeOverlayContainer}>
          {Boolean(timerLabel) && (
            <Text numberOfLines={1} style={styles.timerText}>
              {timerLabel}
            </Text>
          )}
          <Ionicons
            name={isCompleted ? 'checkmark' : isRunning ? 'pause' : 'play'}
            size={Boolean(timerLabel) ? 9 : 13}
            color={neonLime}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowLayer: {
    opacity: 0.35,
  },
  overlayContent: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  timeOverlayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  timerText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(192, 132, 252, 0.90)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 0.5,
  },
});

export default CrystalizedBallNative;
