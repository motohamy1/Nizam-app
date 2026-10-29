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
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { BALL_PRESETS } from './presets';
import type { CrystalizedBallProps, CrystalizedBallPreset } from './presets';

// Particle definition for cosmic stardust
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
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (isRunning) {
      // Smooth continuous orbit for the plasma layers
      rotationOuter.value = withRepeat(
        withTiming(360, {
          duration: 12000,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      rotationInner.value = withRepeat(
        withTiming(-360, {
          duration: 8500,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      // Organic energy pulse
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.97, { duration: 1800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );

      // Shimmer sweep
      shimmer.value = withRepeat(
        withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    } else {
      // Gentle breathing idle state
      rotationOuter.value = withTiming(rotationOuter.value);
      rotationInner.value = withTiming(rotationInner.value);
      pulse.value = withTiming(1, { duration: 600 });
      shimmer.value = withTiming(0, { duration: 600 });
    }
  }, [isRunning]);

  // Stardust points deterministic generation
  const dustParticles: DustParticle[] = useMemo(() => {
    const particles: DustParticle[] = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const radiusRatio = 0.25 + ((i * 17) % 55) / 100;
      const baseAngle = ((i * 360) / count) * (Math.PI / 180);
      const pSize = 1.2 + ((i * 7) % 20) / 10;
      const color =
        i % 3 === 0
          ? '#FFFFFF'
          : i % 3 === 1
          ? filamentColor1
          : filamentColor2;
      particles.push({ id: i, radiusRatio, baseAngle, size: pSize, color });
    }
    return particles;
  }, [filamentColor1, filamentColor2]);

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
      {/* Ambient Pulsing Aura Glow Behind the Orb */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.glowLayer,
          {
            backgroundColor: auraGlow,
            borderRadius: size / 2,
            transform: [{ scale: 1.15 }],
          },
        ]}
      />

      {/* SVG Canvas for Photorealistic Crystal Orb */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Radial depth sphere gradient */}
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

          {/* Diagonal Glass Sheen */}
          <LinearGradient
            id={`glassSheen-${uniqueId}`}
            x1="15%"
            y1="10%"
            x2="85%"
            y2="90%"
          >
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
            <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.12" />
            <Stop offset="70%" stopColor="transparent" stopOpacity="0" />
            <Stop offset="100%" stopColor={rimLightColor} stopOpacity="0.45" />
          </LinearGradient>

          {/* Plasma Filament Arc 1 Gradient */}
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

          {/* Plasma Filament Arc 2 Gradient */}
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

        {/* 1. Main Crystallized Orb Base */}
        <Circle
          cx={center}
          cy={center}
          r={sphereRadius}
          fill={`url(#sphereCore-${uniqueId})`}
        />

        {/* 2. Swirling Inner Plasma Filaments (Filament 1) */}
        <Path
          d={`M ${center - sphereRadius * 0.65} ${center - sphereRadius * 0.1} 
              Q ${center} ${center - sphereRadius * 0.75} ${center + sphereRadius * 0.65} ${center - sphereRadius * 0.25}
              Q ${center + sphereRadius * 0.2} ${center + sphereRadius * 0.6} ${center - sphereRadius * 0.55} ${center + sphereRadius * 0.45} Z`}
          fill={`url(#filament1-${uniqueId})`}
          opacity={0.65}
        />

        {/* 3. Swirling Counter-Current Plasma (Filament 2) */}
        <Path
          d={`M ${center - sphereRadius * 0.4} ${center + sphereRadius * 0.55} 
              Q ${center + sphereRadius * 0.7} ${center + sphereRadius * 0.1} ${center + sphereRadius * 0.3} ${center - sphereRadius * 0.6}
              Q ${center - sphereRadius * 0.35} ${center - sphereRadius * 0.2} ${center - sphereRadius * 0.4} ${center + sphereRadius * 0.55} Z`}
          fill={`url(#filament2-${uniqueId})`}
          opacity={0.55}
        />

        {/* 4. Cosmic Stardust Particles Inside Orb */}
        {dustParticles.map((particle) => {
          const px = center + Math.cos(particle.baseAngle) * (sphereRadius * particle.radiusRatio);
          const py = center + Math.sin(particle.baseAngle) * (sphereRadius * particle.radiusRatio);
          return (
            <Circle
              key={particle.id}
              cx={px}
              cy={py}
              r={particle.size}
              fill={particle.color}
              opacity={0.8}
            />
          );
        })}

        {/* 5. Glass Reflection & Crystallization Facet Sheen */}
        <Circle
          cx={center}
          cy={center}
          r={sphereRadius - 0.5}
          fill={`url(#glassSheen-${uniqueId})`}
        />

        {/* 6. Sharp Specular Horizon Crescent (Glass crystallization reflection) */}
        <Path
          d={`M ${center - sphereRadius * 0.72} ${center - sphereRadius * 0.25}
              A ${sphereRadius} ${sphereRadius} 0 0 1 ${center + sphereRadius * 0.25} ${center - sphereRadius * 0.72}`}
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
        />

        {/* Outer Ring Border */}
        <Circle
          cx={center}
          cy={center}
          r={sphereRadius}
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth={0.8}
          fill="none"
        />
      </Svg>

      {/* Timer Value & Play/Pause State Overlay (High-Contrast Frosted Badge for Dark Text) */}
      <View style={styles.overlayContent} pointerEvents="none">
        <View style={styles.frostedPill}>
          {Boolean(timerLabel) && (
            <Text numberOfLines={1} style={styles.timerText}>
              {timerLabel}
            </Text>
          )}
          <View style={styles.iconBadge}>
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={9.5}
              color="#050505"
            />
          </View>
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
  frostedPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 4,
  },
  timerText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#050505',
    letterSpacing: -0.4,
  },
  iconBadge: {
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CrystalizedBallNative;
