import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

export interface CardParticleFieldProps {
  /**
   * Task progress from 0 to 1 (0% to 100%).
   */
  progress?: number;
  /**
   * Whether the active task is currently in progress.
   */
  isRunning?: boolean;
  /**
   * Whether the timer is counting down.
   */
  isCountDown?: boolean;
}

interface StardustParticle {
  id: number;
  xRatio: number; // 0 (left) to 1 (right)
  yRatio: number; // 0 (top) to 1 (bottom)
  size: number;
  shape: 'round' | 'square';
  color: string;
  baseOpacity: number;
  layer: 'back' | 'mid' | 'front';
}

// Seeded PRNG for stable, reproducible particle coordinates
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

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Generates 460 finely blended, well-distributed crystalline stardust particles.
 * Uses stratified jittered sampling across grid cells to prevent clustering or empty voids,
 * with a rich, balanced mix of contrasting purples, electric violets, lavender, neon lime sparks, and diamond specks.
 */
function generateStardust(count = 460): StardustParticle[] {
  const rand = seededRandom(1088);
  const list: StardustParticle[] = [];

  // Deep contrasted violets, royal purples, glowing lavender, neon lime, and white diamond sparks
  const colors = [
    '#4C1D95', // 0: Deep midnight violet (high contrast on lime)
    '#581C87', // 1: Royal purple
    '#6D28D9', // 2: Electric purple
    '#7C3AED', // 3: Vibrant violet
    '#9333EA', // 4: Core purple
    '#A855F7', // 5: Radiant amethyst
    '#C084FC', // 6: Luminous lavender
    '#E9D5FF', // 7: Pale violet spark
    '#AFE607', // 8: Neon lime highlight
    '#FFFFFF', // 9: Diamond glimmer
  ];

  // Grid for stratified jittered distribution
  const cols = 23;
  const rows = 20; // 23 * 20 = 460 cells
  const cellW = 0.96 / cols;
  const cellH = 0.96 / rows;

  let id = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Stratified jittered position inside cell with slight padding
      const xRatio = 0.02 + c * cellW + rand() * cellW;
      const yRatio = 0.02 + r * cellH + rand() * cellH;

      const q = rand();
      let colorIndex = 0;
      if (q < 0.16) colorIndex = 0;
      else if (q < 0.32) colorIndex = 1;
      else if (q < 0.48) colorIndex = 2;
      else if (q < 0.62) colorIndex = 3;
      else if (q < 0.74) colorIndex = 4;
      else if (q < 0.83) colorIndex = 5;
      else if (q < 0.90) colorIndex = 6;
      else if (q < 0.94) colorIndex = 7;
      else if (q < 0.97) colorIndex = 8;
      else colorIndex = 9;

      const isSpark = colorIndex >= 7;
      // Slightly condensed, crisp size: 1.1px to 2.2px for distinct individual particles
      const baseSize = isSpark ? 1.7 : rand() < 0.30 ? 2.1 : 1.25;
      const size = baseSize + rand() * 0.4;
      const shape: 'round' | 'square' = rand() < 0.38 ? 'square' : 'round';

      const baseOpacity = isSpark ? 0.92 : 0.60 + rand() * 0.32;
      const layer: 'back' | 'mid' | 'front' =
        id % 3 === 0 ? 'front' : id % 3 === 1 ? 'mid' : 'back';

      list.push({
        id,
        xRatio,
        yRatio,
        size,
        shape,
        color: colors[colorIndex],
        baseOpacity,
        layer,
      });
      id++;
    }
  }

  return list;
}

export const CardParticleField: React.FC<CardParticleFieldProps> = ({
  progress = 0,
  isRunning = false,
  isCountDown = true,
}) => {
  const [cardSize, setCardSize] = useState({ width: 340, height: 240 });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCardSize({ width, height });
    }
  };

  // Reanimated values for live shimmer, drift, and sway
  const swayFront = useSharedValue(0);
  const driftY = useSharedValue(0);
  const shimmer = useSharedValue(0.85);

  useEffect(() => {
    cancelAnimation(swayFront);
    cancelAnimation(driftY);
    cancelAnimation(shimmer);

    if (isRunning) {
      swayFront.value = withRepeat(
        withSequence(
          withTiming(4.5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(-4.5, { duration: 1600, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );

      driftY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(2, { duration: 1400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      shimmer.value = withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    } else {
      swayFront.value = withRepeat(
        withSequence(
          withTiming(1.8, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1.8, { duration: 3200, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );

      driftY.value = withRepeat(
        withSequence(
          withTiming(-1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 2600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      shimmer.value = withRepeat(
        withTiming(0.88, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    }
  }, [isRunning]);

  const animatedFrontStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: swayFront.value },
      { translateY: driftY.value },
    ],
    opacity: 0.85 + shimmer.value * 0.15,
  }));

  const animatedMidStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -swayFront.value * 0.6 },
      { translateY: -driftY.value * 0.5 },
    ],
  }));

  const animatedBackStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: swayFront.value * 0.3 },
      { translateY: driftY.value * 0.3 },
    ],
  }));

  const allParticles = useMemo(() => generateStardust(460), []);

  const validProgress = clamp(progress, 0, 1);

  // CASE 1: TIME-DOWN (COUNTDOWN)
  // Strictly fills from bottom to top as progress increases:
  // At progress = 0: cutoffY = 1.0 (empty until task starts running)
  // At progress = 0.5: cutoffY = 0.5 (bottom half filled)
  // At progress = 1.0: cutoffY = 0.0 (all 460 particles fill whole card)
  //
  // CASE 2: TIME-UP / NO-TIMER
  // Particles are distributed across the entire card with full ambient floating animation.
  const visibleParticles = useMemo(() => {
    if (isCountDown) {
      if (validProgress === 0 && !isRunning) {
        return [];
      }

      // Cutoff line rises from 1.0 (bottom) to 0.0 (top)
      const cutoffY = 1.0 - validProgress;

      return allParticles
        .filter((p) => p.yRatio >= cutoffY)
        .map((p) => ({
          ...p,
          opacity: p.baseOpacity,
        }));
    } else {
      return allParticles.map((p) => ({
        ...p,
        opacity: p.baseOpacity,
      }));
    }
  }, [allParticles, validProgress, isCountDown, isRunning]);

  const backParticles = visibleParticles.filter((p) => p.layer === 'back');
  const midParticles = visibleParticles.filter((p) => p.layer === 'mid');
  const frontParticles = visibleParticles.filter((p) => p.layer === 'front');

  const renderParticle = (p: StardustParticle & { opacity: number }) => {
    const px = p.xRatio * cardSize.width;
    const py = p.yRatio * cardSize.height;

    if (p.shape === 'square') {
      const half = p.size / 2;
      return (
        <Rect
          key={p.id}
          x={px - half}
          y={py - half}
          width={p.size}
          height={p.size}
          fill={p.color}
          opacity={p.opacity}
        />
      );
    }
    return (
      <Circle
        key={p.id}
        cx={px}
        cy={py}
        r={p.size / 2}
        fill={p.color}
        opacity={p.opacity}
      />
    );
  };

  if (visibleParticles.length === 0) {
    return (
      <View
        onLayout={handleLayout}
        style={[StyleSheet.absoluteFill, styles.container]}
        pointerEvents="none"
      />
    );
  }

  return (
    <View
      onLayout={handleLayout}
      style={[StyleSheet.absoluteFill, styles.container]}
      pointerEvents="none"
    >
      {/* Back Layer (Gentle Drift) */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedBackStyle]} pointerEvents="none">
        <Svg width={cardSize.width} height={cardSize.height}>
          {backParticles.map(renderParticle)}
        </Svg>
      </Animated.View>

      {/* Mid Layer (Parallax Sway) */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedMidStyle]} pointerEvents="none">
        <Svg width={cardSize.width} height={cardSize.height}>
          {midParticles.map(renderParticle)}
        </Svg>
      </Animated.View>

      {/* Front Layer (Bright Twinkle & Shimmer) */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedFrontStyle]} pointerEvents="none">
        <Svg width={cardSize.width} height={cardSize.height}>
          {frontParticles.map(renderParticle)}
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    zIndex: 1, // Behind cardInner (zIndex: 2)
  },
});

export default CardParticleField;
