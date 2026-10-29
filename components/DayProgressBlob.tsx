import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { getEffectiveTaskDay } from '@/utils/taskDateUtils';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Reduced by 30% from 195 to 135
export const CIRCLE_SPACE = 135;

export interface PillLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
}

export interface DayProgressBlobProps {
  pillLayout: PillLayout | null;
  selectedDate: number;
  todos: any[] | undefined;
  todayStart: number;
  isArabic?: boolean;
}

/**
 * Computes the continuous SVG blob neck and ball path that begins
 * right at the bottom border of the active day pill and extends down
 * into the circular progress ball, reduced in length by 30%.
 */
function computeBlobPath(
  cx: number,
  pillBottom: number,
  s: number
): string {
  'worklet';
  // hw: connection half-width flush with the 48px rounded day pill bottom
  const hw = 16 * s;
  // Tucks 2px under the bottom border of the active day pill for a gapless connection
  const yStart = pillBottom - 2;

  // Neck and circle geometry (30% shorter)
  const neckHw = 7.5 * s;
  const flareCpX = 22 * s;
  const circleMeetX = 33 * s;
  const circleR = 40 * s;

  // Vertical offsets from yStart (reduced by 30%)
  const c1Cp1Y = yStart + 8 * s;
  const c1Cp2Y = yStart + 12 * s;
  const neckY = yStart + 22 * s;
  const c2Cp1Y = yStart + 32 * s;
  const c2Cp2Y = yStart + 35 * s;
  const circleMeetY = yStart + 44 * s;

  const rightStart = (cx + hw).toFixed(2);
  const leftStart = (cx - hw).toFixed(2);
  const rightNeckX = (cx + neckHw).toFixed(2);
  const leftNeckX = (cx - neckHw).toFixed(2);
  const rightFlareCpX = (cx + flareCpX).toFixed(2);
  const leftFlareCpX = (cx - flareCpX).toFixed(2);
  const rightMeetX = (cx + circleMeetX).toFixed(2);
  const leftMeetX = (cx - circleMeetX).toFixed(2);
  const circleRStr = circleR.toFixed(2);

  return (
    `M ${rightStart} ${yStart.toFixed(2)} ` +
    `C ${rightStart} ${c1Cp1Y.toFixed(2)} ${rightNeckX} ${c1Cp2Y.toFixed(2)} ${rightNeckX} ${neckY.toFixed(2)} ` +
    `C ${rightNeckX} ${c2Cp1Y.toFixed(2)} ${rightFlareCpX} ${c2Cp2Y.toFixed(2)} ${rightMeetX} ${circleMeetY.toFixed(2)} ` +
    `A ${circleRStr} ${circleRStr} 0 1 1 ${leftMeetX} ${circleMeetY.toFixed(2)} ` +
    `C ${leftFlareCpX} ${c2Cp2Y.toFixed(2)} ${leftNeckX} ${c2Cp1Y.toFixed(2)} ${leftNeckX} ${neckY.toFixed(2)} ` +
    `C ${leftNeckX} ${c1Cp2Y.toFixed(2)} ${leftStart} ${c1Cp1Y.toFixed(2)} ${leftStart} ${yStart.toFixed(2)} ` +
    `Z`
  );
}

export const DayProgressBlob: React.FC<DayProgressBlobProps> = ({
  pillLayout,
  selectedDate,
  todos,
  todayStart,
  isArabic = false,
}) => {
  const windowWidth = Dimensions.get('window').width;

  const realWidth = pillLayout?.width ?? 48;
  const realHeight = pillLayout?.height ?? 68;
  const initialCx = pillLayout?.cx ?? windowWidth / 2;
  const initialPillTop = pillLayout?.y ?? (Platform.OS === 'android' ? 60 : 70);
  const initialPillBottom = initialPillTop + realHeight;

  const scaleFactor = Math.max(1, Math.min(1.45, realWidth / 34));

  // Circle & ring geometry (scaled & 30% shorter)
  const circleRadius = 40 * scaleFactor;
  const circleCenterYOffset = 66.6 * scaleFactor; // from pillBottom
  const ringRadius = 30 * scaleFactor;
  const strokeWidth = 5.5 * scaleFactor;
  const ringCircumference = 2 * Math.PI * ringRadius;

  // Animated values for 60fps native transitions
  const animatedCx = useSharedValue(initialCx);
  const animatedPillBottom = useSharedValue(initialPillBottom);
  const animatedScale = useSharedValue(scaleFactor);

  // Derive completed / total for the selected date
  const { completedCount, totalCount } = useMemo(() => {
    if (!todos || todos.length === 0) return { completedCount: 0, totalCount: 0 };
    const dayTasks = todos.filter((t) => {
      if (t.parentId) return false;
      if (t.type && t.type !== 'task') return false;
      return getEffectiveTaskDay(t, todayStart) === selectedDate;
    });
    const done = dayTasks.filter((t) => t.status === 'done' || t.isCompleted).length;
    return {
      completedCount: done,
      totalCount: dayTasks.length,
    };
  }, [todos, selectedDate, todayStart]);

  const targetProgress = totalCount > 0 ? completedCount / totalCount : 0;
  const animatedProgress = useSharedValue(targetProgress);

  // Animate progress when task completion changes (400ms duration)
  useEffect(() => {
    animatedProgress.value = withTiming(targetProgress, {
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [targetProgress, animatedProgress]);

  // Keep blob, tunnel and ball fixed and locked to the active day border with 0 delay
  useEffect(() => {
    const targetCx = pillLayout?.cx ?? windowWidth / 2;
    const targetPillBottom = (pillLayout?.y ?? initialPillTop) + (pillLayout?.height ?? realHeight);

    animatedPillBottom.value = targetPillBottom;
    animatedScale.value = scaleFactor;
    animatedCx.value = targetCx;
  }, [pillLayout, scaleFactor, windowWidth, initialPillTop, realHeight, animatedCx, animatedPillBottom, animatedScale]);

  // Reanimated props for SVG Path
  const animatedPathProps = useAnimatedProps(() => {
    'worklet';
    return {
      d: computeBlobPath(
        animatedCx.value,
        animatedPillBottom.value,
        animatedScale.value
      ),
    };
  });

  // Reanimated props for circular progress indicator strokeDashoffset
  const animatedRingProps = useAnimatedProps(() => {
    'worklet';
    const offset = ringCircumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset: offset,
    };
  });

  // Circle container animated transform (tracks animatedCx and animatedPillBottom)
  const animatedCircleContainerStyle = useAnimatedStyle(() => {
    const centerY = animatedPillBottom.value + circleCenterYOffset;
    return {
      transform: [
        { translateX: animatedCx.value - circleRadius },
        { translateY: centerY - circleRadius },
      ],
    };
  });

  const initialD = useMemo(() => {
    return computeBlobPath(initialCx, initialPillBottom, scaleFactor);
  }, [initialCx, initialPillBottom, scaleFactor]);

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* 1. Peach SVG Canvas rendering the continuous fluid neck & ball beginning at the day border */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <AnimatedPath
          d={initialD}
          animatedProps={animatedPathProps}
          fill="#FF9470"
        />
      </Svg>

      {/* 2. Progress Circle Content: Ring & Center Text */}
      <Animated.View
        style={[
          styles.circleContainer,
          {
            width: circleRadius * 2,
            height: circleRadius * 2,
          },
          animatedCircleContainerStyle,
        ]}
      >
        {/* SVG Progress Ring */}
        <Svg
          width={circleRadius * 2}
          height={circleRadius * 2}
          viewBox={`0 0 ${circleRadius * 2} ${circleRadius * 2}`}
        >
          {/* Background Track (18% opacity #3A1A5E) */}
          <Circle
            cx={circleRadius}
            cy={circleRadius}
            r={ringRadius}
            stroke="#3A1A5E"
            strokeWidth={strokeWidth}
            strokeOpacity={0.18}
            fill="none"
          />
          {/* Animated Progress Ring (12 o'clock start via rotation -90) */}
          <AnimatedCircle
            cx={circleRadius}
            cy={circleRadius}
            r={ringRadius}
            stroke="#3A1A5E"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${ringCircumference} ${ringCircumference}`}
            animatedProps={animatedRingProps}
            fill="none"
            originX={circleRadius}
            originY={circleRadius}
            rotation={-90}
          />
        </Svg>

        {/* Center Text: "completed/total" and "done" */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.centerTextOverlay}>
            <Text
              style={[
                styles.ratioText,
                { fontSize: Math.round(18 * scaleFactor) },
              ]}
            >
              {totalCount > 0 ? `${completedCount}/${totalCount}` : '0/0'}
            </Text>
            <Text
              style={[
                styles.doneText,
                { fontSize: Math.round(10 * scaleFactor) },
              ]}
            >
              {isArabic ? 'مكتملة' : 'done'}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -CIRCLE_SPACE,
    zIndex: 10,
  },
  circleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 1,
  },
  ratioText: {
    fontWeight: '900',
    color: '#2C1204',
    letterSpacing: -0.5,
    includeFontPadding: false,
    lineHeight: 22,
  },
  doneText: {
    fontWeight: '800',
    color: '#2C1204',
    opacity: 0.72,
    letterSpacing: 0.3,
    textTransform: 'lowercase',
    includeFontPadding: false,
    marginTop: -1,
  },
});

export default DayProgressBlob;
