import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { playWheelTick } from '@/utils/wheelTick';
import type { MonthPalette } from '@/components/MonthCreditCard';

/**
 * WheelPicker — a 3D cylindrical selector styled like a watch bezel.
 *
 * Labels are mounted on the rim of a drum that rotates around its Y axis:
 * the focused label faces the user dead-center, neighbors curve away with
 * rotateY perspective, shrink, and fade toward the bezel edges (gradient
 * masks complete the fade). Dragging the rim spins the drum; every detent
 * crossed fires a haptic + mechanical tick, like winding a crown.
 */

const STEP_ANGLE = 32;                       // degrees between adjacent labels
const RADIUS = 175;                          // drum radius in dp
const PERSPECTIVE = 900;
const SPRING = { damping: 22, stiffness: 190, mass: 0.7 };
// dp of drag that equals one label detent
const PX_PER_DETENT = RADIUS * Math.sin((STEP_ANGLE * Math.PI) / 180) * 1.15;

interface WheelPickerProps {
  labels: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  palettes?: MonthPalette[];
  isArabic?: boolean;
  /** Color of the center detent tick (defaults to theme primary). */
  accentColor?: string;
  /** Index the wheel snaps back to after an idle period (e.g. the current
   *  year). Pass null/undefined to disable. */
  autoReturnIndex?: number | null;
  /** Idle delay before the auto-return snap, in ms (default 5000). */
  autoReturnDelay?: number;
  style?: any;
}

const wrap = (i: number, n: number) => ((i % n) + n) % n;

export const WheelPicker: React.FC<WheelPickerProps> = ({
  labels,
  activeIndex,
  onChange,
  palettes,
  isArabic = false,
  accentColor,
  autoReturnIndex = null,
  autoReturnDelay = 5000,
  style,
}) => {
  const { colors, isDarkMode } = useTheme();
  const n = labels.length;

  // Continuous, unbounded fractional index; geometry wraps by ring distance.
  const pos = useSharedValue(activeIndex);
  // Measured half-width so rim labels can fade out before the bezel edge
  // (background-matched gradient masks can't work over a radial glow).
  const halfWidthSV = useSharedValue(0);
  // Mirror of the focused detent for cheap JS-side styling decisions.
  const [focusIdx, setFocusIdx] = useState(activeIndex);
  const dragStartPos = useRef(activeIndex);
  const tapX = useRef(0);
  const widthRef = useRef(0);
  const isArabicRef = useRef(isArabic);
  isArabicRef.current = isArabic;

  // ─── Idle auto-return to the active detent (same model as the home DateBar) ─
  const autoReturnIndexRef = useRef(autoReturnIndex);
  autoReturnIndexRef.current = autoReturnIndex;
  const autoReturnDelayRef = useRef(autoReturnDelay);
  autoReturnDelayRef.current = autoReturnDelay;
  const autoReturnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoReturnTimer = useCallback(() => {
    if (autoReturnTimer.current) {
      clearTimeout(autoReturnTimer.current);
      autoReturnTimer.current = null;
    }
  }, []);

  const scheduleAutoReturn = useCallback(() => {
    const target = autoReturnIndexRef.current;
    if (target === null || target === undefined) return;
    clearAutoReturnTimer();
    autoReturnTimer.current = setTimeout(() => {
      autoReturnTimer.current = null;
      const targetIdx = autoReturnIndexRef.current;
      if (targetIdx === null || targetIdx === undefined) return;
      // Shortest ring path from wherever the drum currently rests.
      const current = wrap(Math.round(pos.value), n);
      let d = targetIdx - current;
      if (d > n / 2) d -= n;
      else if (d < -n / 2) d += n;
      if (d !== 0) {
        // Land exactly on the integer detent — a fractional rest position
        // disagrees with the parent's index on the next sync and ping-pongs.
        const next = Math.round(pos.value) + d;
        springFlightRef.current = { active: true, target: wrap(next, n) };
        pos.value = withSpring(next, SPRING);
      }
      // onChange fires once for the final detent via commitDetent.
    }, autoReturnDelayRef.current);
  }, [clearAutoReturnTimer, n, pos]);

  const scheduleAutoReturnRef = useRef(scheduleAutoReturn);
  scheduleAutoReturnRef.current = scheduleAutoReturn;

  useEffect(() => clearAutoReturnTimer, [clearAutoReturnTimer]);

  // Tracks a programmatic flight (auto-return snap or external sync): while
  // one is in flight the drum is owned by the animation. Without this, the
  // detents the spring crosses mid-flight echoed back to the parent deck,
  // which jumped back to an intermediate card and re-targeted the spring
  // against its live position (d=0) — freezing it short of the target and
  // looping the auto-return forever.
  const springFlightRef = useRef<{ active: boolean; target: number }>({
    active: false,
    target: -1,
  });

  const commitDetent = useCallback((detent: number) => {
    const idx = wrap(detent, n);
    setFocusIdx(idx);
    const flight = springFlightRef.current;
    if (flight.active) {
      // Programmatic flight: the parent already knows the destination.
      // Echoing every crossed detent would drag the deck back through
      // intermediate cards (ping-pong). Only the final detent notifies.
      if (idx !== wrap(flight.target, n)) return;
      springFlightRef.current = { active: false, target: -1 };
    }
    onChange(idx);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    playWheelTick();
  }, [n, onChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        dragStartPos.current = pos.value;
        tapX.current = evt.nativeEvent.locationX;
        // The finger owns the drum now — cancel any programmatic flight and
        // pause the idle auto-return.
        springFlightRef.current = { active: false, target: -1 };
        clearAutoReturnTimer();
      },
      onPanResponderMove: (_, g) => {
        // Dragging the rim left advances the drum (RTL: mirrored).
        const dir = isArabicRef.current ? 1 : -1;
        pos.value = dragStartPos.current + (dir * g.dx) / PX_PER_DETENT;
      },
      onPanResponderRelease: (_, g) => {
        const dir = isArabicRef.current ? 1 : -1;
        // Treat as a tap: nudge one detent toward the tapped side of the bezel.
        if (Math.abs(g.dx) < 10 && Math.abs(g.dy) < 10 && widthRef.current > 0) {
          const side = tapX.current > widthRef.current / 2 ? 1 : -1;
          pos.value = withSpring(Math.round(pos.value) + side, SPRING);
          scheduleAutoReturnRef.current();
          return;
        }
        const flick = (dir * g.vx) / 2600; // projected extra detents
        const target = Math.round(pos.value + flick);
        pos.value = withSpring(target, SPRING);
        scheduleAutoReturnRef.current();
      },
      onPanResponderTerminate: () => {
        springFlightRef.current = { active: false, target: -1 };
        pos.value = withSpring(Math.round(pos.value), SPRING);
        scheduleAutoReturnRef.current();
      },
    })
  ).current;

  // External focus changes (deck swipes, peek taps) drive the drum,
  // always along the shortest ring path.
  const lastExternal = useRef(activeIndex);
  useEffect(() => {
    if (activeIndex === lastExternal.current) return;
    lastExternal.current = activeIndex;
    // A programmatic flight owns the drum: while one is heading to its
    // target, intermediate echoes from the parent (deck adopting a crossed
    // detent) must not re-target the spring mid-flight. An echo that matches
    // the flight's destination is just the final confirmation — let the
    // spring finish on its own.
    if (springFlightRef.current.active) {
      if (wrap(activeIndex, n) === wrap(springFlightRef.current.target, n)) {
        springFlightRef.current = { active: false, target: -1 };
      }
      return;
    }
    const current = wrap(Math.round(pos.value), n);
    let d = activeIndex - current;
    if (d > n / 2) d -= n;
    else if (d < -n / 2) d += n;
    if (d === 0) return;
    // Land exactly on the integer detent, never on a fractional position.
    const next = Math.round(pos.value) + d;
    springFlightRef.current = { active: true, target: wrap(next, n) };
    pos.value = withSpring(next, SPRING);
    setFocusIdx(wrap(next, n));
  }, [activeIndex, n]);

  // Fires once per detent crossed — while dragging and while springing —
  // haptic + tick + parent notification, like clicking through a crown.
  useAnimatedReaction(
    () => Math.round(pos.value),
    (detent, prev) => {
      if (prev !== null && detent !== prev) {
        runOnJS(commitDetent)(detent);
      }
    }
  );

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        halfWidthSV.value = e.nativeEvent.layout.width / 2;
      }}
      {...panResponder.panHandlers}
    >
      {/* Rim labels on the drum */}
      {labels.map((label, i) => (
        <WheelLabel
          key={i}
          label={label}
          index={i}
          total={n}
          pos={pos}
          focused={i === focusIdx}
          palette={palettes?.[i % (palettes?.length || 1)]}
          isDarkMode={isDarkMode}
          colors={colors}
          halfWidthSV={halfWidthSV}
        />
      ))}

      {/* Crown tick under the focused label */}
      <View style={[styles.tickMark, { backgroundColor: accentColor ?? colors.primary }]} />
    </View>
  );
};

// ---------- one rim label ----------

const DEG2RAD = Math.PI / 180;

interface WheelLabelProps {
  label: string;
  index: number;
  total: number;
  pos: SharedValue<number>;
  focused: boolean;
  palette?: MonthPalette;
  isDarkMode: boolean;
  colors: any;
  halfWidthSV: SharedValue<number>;
}

const WheelLabel: React.FC<WheelLabelProps> = ({
  label, index, total, pos, focused, palette, isDarkMode, colors, halfWidthSV,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    let d = index - pos.value;
    const half = Math.floor(total / 2);
    d = ((d % total) + total) % total;
    if (d > half + 0.5) d -= total;

    const angleDeg = d * STEP_ANGLE;
    const angle = angleDeg * DEG2RAD;
    const x = RADIUS * Math.sin(angle);
    const depth = Math.cos(angle); // 1 front, 0 side, -1 back
    let opacity = interpolate(depth, [1, 0.5, 0.12], [1, 0.9, 0]);

    // Fade the label itself before it can hit the screen edge — no opaque
    // background-colored mask needed over the ambient glow.
    const hw = halfWidthSV.value;
    if (hw > 0) {
      const edgeFade = interpolate(
        Math.abs(x) + 58, // 58 ≈ half label box
        [hw - 66, hw - 10],
        [1, 0],
        Extrapolation.CLAMP
      );
      opacity *= edgeFade;
    }
    const scale = interpolate(depth, [1, 0.4, 0.0], [1, 0.86, 0.74]);

    return {
      opacity: depth > 0 ? opacity : 0,
      transform: [
        { translateX: x },
        { perspective: PERSPECTIVE },
        { rotateY: `${-angleDeg}deg` },
        { scale },
      ],
      zIndex: Math.round(depth * 100),
    };
  });

  const ink = isDarkMode ? '#E4E6DC' : (palette?.ink ?? '#181922');
  const accent = palette?.accent ?? colors.primary;

  return (
    <Animated.View style={[styles.labelWrap, animatedStyle]} pointerEvents="none">
      <Text
        numberOfLines={1}
        style={{
          fontSize: focused ? 17 : 15,
          fontWeight: focused ? '800' : '700',
          letterSpacing: focused ? -0.2 : 0.3,
          color: focused ? accent : ink,
          opacity: focused ? 1 : 0.92,
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  labelWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 128,
  },
  tickMark: {
    position: 'absolute',
    bottom: 10,
    width: 22,
    height: 3.5,
    borderRadius: 2,
    opacity: 0.9,
  },
});

export default WheelPicker;
