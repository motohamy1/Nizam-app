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
  LinearGradient,
  Stop,
  Circle,
  Path,
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

// Particle definition for cosmic stardust inside orb
interface DustParticle {
  id: number;
  radiusRatio: number;
  baseAngle: number;
  size: number;
  color: string;
}

export const CrystalizedBallNative: React.FC<CrystalizedBallProps> = ({
  preset = 'ember',
  color: customColor,
  size = 54,
  style,
  isRunning = true,
  isCountDown = true,
  timerLabel,
  onPress,
}) => {
  const presetConfig = BALL_PRESETS[preset as CrystalizedBallPreset] || BALL_PRESETS.ember;

  const primaryColor = customColor || presetConfig.color || '#FF6B35';
  const coreColor = '#FFE8D6';
  const deepSpaceColor = '#1A0B05';
  const rimLightColor = primaryColor;
  const filamentColor1 = primaryColor;
  const filamentColor2 = '#FFA07A';
  const auraGlow = primaryColor;

  // Geometry
  const sphereRadius = (size / 2) * 0.88;
  const center = size / 2;

  // Reanimated Shared Values for dynamic crystal motion
  const rotationOuter = useSharedValue(0);
  const rotationInner = useSharedValue(0);
  const pulse = useSharedValue(1);
  const shimmer = useSharedValue(0.7);

  useEffect(() => {
    cancelAnimation(rotationOuter);
    cancelAnimation(rotationInner);
    cancelAnimation(pulse);
    cancelAnimation(shimmer);

    if (isRunning) {
      // Dynamic continuous orbit for the plasma layers
      rotationOuter.value = withRepeat(
        withTiming(360, {
          duration: 6000,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      rotationInner.value = withRepeat(
        withTiming(-360, {
          duration: 4200,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      // Organic energy pulse
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.10, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 1100, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      shimmer.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    } else {
      // Ambient idle drift so the ball is ALWAYS ALIVE and RUNNING
      rotationOuter.value = withRepeat(
        withTiming(360, {
          duration: 22000,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      rotationInner.value = withRepeat(
        withTiming(-360, {
          duration: 17000,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.98, { duration: 2200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      shimmer.value = withRepeat(
        withTiming(0.9, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    }
  }, [isRunning]);

  const animatedOuterStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationOuter.value}deg` }],
  }));

  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationInner.value}deg` }],
  }));

  const animatedAuraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value * 1.15 }],
    opacity: 0.38 * pulse.value,
  }));

  const animatedShimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.65 + shimmer.value * 0.35,
  }));

  // Deterministic dust particles split across the 2 counter-rotating orbits
  const dustGroup1: DustParticle[] = useMemo(() => {
    const particles: DustParticle[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const radiusRatio = 0.28 + ((i * 19) % 50) / 100;
      const baseAngle = ((i * 360) / count) * (Math.PI / 180);
      const pSize = 1.2 + ((i * 5) % 15) / 10;
      const color = i % 2 === 0 ? '#FFFFFF' : filamentColor1;
      particles.push({ id: i, radiusRatio, baseAngle, size: pSize, color });
    }
    return particles;
  }, [filamentColor1]);

  const dustGroup2: DustParticle[] = useMemo(() => {
    const particles: DustParticle[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const radiusRatio = 0.22 + ((i * 23) % 55) / 100;
      const baseAngle = ((i * 360) / count + 45) * (Math.PI / 180);
      const pSize = 1.1 + ((i * 7) % 16) / 10;
      const color = i % 2 === 0 ? '#FFF2E6' : filamentColor2;
      particles.push({ id: i + 100, radiusRatio, baseAngle, size: pSize, color });
    }
    return particles;
  }, [filamentColor2]);

  const uniqueId = useMemo(() => Math.random().toString(36).substring(2, 9), []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {/* 1. Ambient Pulsing Aura Glow Behind the Orb */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.glowLayer,
          {
            backgroundColor: auraGlow,
            borderRadius: size / 2,
          },
          animatedAuraStyle,
        ]}
      />

      {/* 2. Base Sphere Depth SVG */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient
              id={`sphereCore-${uniqueId}`}
              cx="38%"
              cy="32%"
              r="65%"
              fx="38%"
              fy="32%"
            >
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <Stop offset="25%" stopColor={coreColor} stopOpacity="0.85" />
              <Stop offset="65%" stopColor={primaryColor} stopOpacity="0.95" />
              <Stop offset="90%" stopColor={deepSpaceColor} stopOpacity="1" />
              <Stop offset="100%" stopColor="#05060A" stopOpacity="1" />
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

      {/* 3. Rotating Plasma Layer 1 (Clockwise) */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedOuterStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient
              id={`filament1-${uniqueId}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <Stop offset="40%" stopColor={filamentColor1} stopOpacity="0.85" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path
            d={`M ${center - sphereRadius * 0.65} ${center - sphereRadius * 0.1}
                Q ${center} ${center - sphereRadius * 0.75} ${center + sphereRadius * 0.65} ${center - sphereRadius * 0.25}
                Q ${center + sphereRadius * 0.2} ${center + sphereRadius * 0.6} ${center - sphereRadius * 0.55} ${center + sphereRadius * 0.45} Z`}
            fill={`url(#filament1-${uniqueId})`}
            opacity={0.75}
          />
          {dustGroup1.map((p) => {
            const px = center + Math.cos(p.baseAngle) * (sphereRadius * p.radiusRatio);
            const py = center + Math.sin(p.baseAngle) * (sphereRadius * p.radiusRatio);
            return (
              <Circle
                key={p.id}
                cx={px}
                cy={py}
                r={p.size}
                fill={p.color}
                opacity={0.85}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* 4. Counter-Rotating Plasma Layer 2 (Counter-Clockwise) */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedInnerStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient
              id={`filament2-${uniqueId}`}
              x1="100%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <Stop offset="50%" stopColor={filamentColor2} stopOpacity="0.85" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path
            d={`M ${center - sphereRadius * 0.4} ${center + sphereRadius * 0.55}
                Q ${center + sphereRadius * 0.7} ${center + sphereRadius * 0.1} ${center + sphereRadius * 0.3} ${center - sphereRadius * 0.6}
                Q ${center - sphereRadius * 0.35} ${center - sphereRadius * 0.2} ${center - sphereRadius * 0.4} ${center + sphereRadius * 0.55} Z`}
            fill={`url(#filament2-${uniqueId})`}
            opacity={0.65}
          />
          {dustGroup2.map((p) => {
            const px = center + Math.cos(p.baseAngle) * (sphereRadius * p.radiusRatio);
            const py = center + Math.sin(p.baseAngle) * (sphereRadius * p.radiusRatio);
            return (
              <Circle
                key={p.id}
                cx={px}
                cy={py}
                r={p.size}
                fill={p.color}
                opacity={0.85}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* 5. Glass Reflection, Specular Crescent & Shimmer Sheen */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedShimmerStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient
              id={`glassSheen-${uniqueId}`}
              x1="15%"
              y1="10%"
              x2="85%"
              y2="90%"
            >
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
              <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <Stop offset="70%" stopColor="transparent" stopOpacity="0" />
              <Stop offset="100%" stopColor={rimLightColor} stopOpacity="0.45" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={center}
            cy={center}
            r={sphereRadius - 0.5}
            fill={`url(#glassSheen-${uniqueId})`}
          />
          <Path
            d={`M ${center - sphereRadius * 0.72} ${center - sphereRadius * 0.25}
                A ${sphereRadius} ${sphereRadius} 0 0 1 ${center + sphereRadius * 0.25} ${center - sphereRadius * 0.72}`}
            stroke="rgba(255, 255, 255, 0.88)"
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={sphereRadius}
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth={0.8}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* 6. Foreground Time & Play/Pause (CLEAN: NO EXTRA BACKGROUND) */}
      <View style={styles.overlayContent} pointerEvents="none">
        <View style={styles.timeOverlayContainer}>
          {Boolean(timerLabel) && (
            <Text numberOfLines={1} style={styles.timerText}>
              {timerLabel}
            </Text>
          )}
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={Boolean(timerLabel) ? 8.5 : 12}
            color="#0B0F19"
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
    backgroundColor: 'transparent', // STRICTLY NO EXTRA BACKGROUND
  },
  timerText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#0B0F19',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(255, 255, 255, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2.5,
    marginBottom: 1,
  },
});

export default CrystalizedBallNative;
