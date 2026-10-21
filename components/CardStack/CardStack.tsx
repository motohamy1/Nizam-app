import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useFocusEffect } from 'expo-router';

export type StackLayout = 'fan' | 'cascade' | 'deck' | 'pile';

export interface CardStackProps {
  /** The cards in the stack, top first. */
  cards: React.ReactNode[];
  /** How the cards behind sit. 'fan' tilts them out, 'deck' stacks them upward, 'cascade' diagonally, 'pile' scatters. */
  layout?: StackLayout;
  /** How many cards show, counting the top one. */
  visible?: number;
  /** How far the cards behind fan, offset or scatter, from 0 to 1. */
  spread?: number;
  /** How much smaller and darker each card behind gets, from 0 to 1. */
  depth?: number;
  /** Corner radius of the cards. */
  radius?: number;
  /** Width of a frame/border around each card. */
  frame?: number;
  frameColor?: string;
  /** Extra drop shadow on the cards. */
  shadow?: boolean;
  /** How far the top card leans in 3D while it is dragged, in degrees. */
  tilt?: number;
  /** How far the top card has to be dragged before it goes to the back. */
  threshold?: number;
  /** Speed multiplier of animations. */
  speed?: number;
  /** Clicking / tapping the top card also sends it to the back. */
  sendToBackOnClick?: boolean;
  /** Cycles through the cards on its own. */
  autoplay?: boolean;
  autoplayDelay?: number;
  /** Automatically return to the primary card (active task card at index 0) after an inactivity period. */
  autoResetToTop?: boolean;
  /** Inactivity timeout before automatically returning to the primary card (in ms). Defaults to 16000. */
  autoResetDelay?: number;
  /** Called with the index of the new top card whenever the stack moves. */
  onChange?: (index: number) => void;
  /** Height of a single card. */
  cardHeight?: number;
  /** Width of a single card. Defaults to container width minus horizontal margins. */
  cardWidth?: number | string;
  /** Extra vertical room above/below the card so the fanned/decked under-cards peek out cleanly. */
  peek?: number;
  /** Force RTL layout for Arabic. */
  isRTL?: boolean;
  style?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
}

interface Settings {
  layout: StackLayout;
  visible: number;
  spread: number;
  depth: number;
  radius: number;
  frame: number;
  frameColor: string;
  shadow: boolean;
  tilt: number;
  threshold: number;
  speed: number;
  count: number;
  isRTL: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Exact React Bits Spring physics [stiffness, damping]
const SPRINGS = {
  place: [260, 24],
  settle: [320, 34],
  tuck: [240, 28],
  face: [240, 30],
  lean: [240, 28],
  press: [420, 34],
  fling: [650, 42],
};

const LEAN_SPEED = 1300;
const LEAN_REACH = 260;
const FLICK_SPEED = 650;
const PRESS_SCALE = 1.035;
const CLICK_SLOP = 8;

/**
 * Pure worklet spring config generator.
 * Marked with 'worklet' so it runs safely on the UI thread without throwing errors.
 */
const getSpring = (stiffness: number, damping: number, speed: number = 1) => {
  'worklet';
  return {
    stiffness: stiffness * speed * speed,
    damping: damping * speed,
    mass: 1,
  };
};

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(max, Math.max(min, value));
};

const mix = (a: number, b: number, t: number) => {
  'worklet';
  return a + (b - a) * t;
};

/**
 * Exact React Bits placement formula for all four layouts (fan, cascade, deck, pile).
 */
const placement = (
  layout: StackLayout,
  position: number,
  card: number,
  spread: number,
  depth: number,
  isRTL: boolean = false
) => {
  'worklet';
  if (layout === 'cascade') {
    const dir = isRTL ? 1 : -1;
    return {
      x: dir * position * spread * 28,
      y: -position * spread * 28,
      rotate: 0,
      scale: 1 - position * depth * 0.07,
    };
  }
  if (layout === 'deck') {
    return {
      x: 0,
      y: -position * spread * 34,
      rotate: 0,
      scale: 1 - position * depth * 0.08,
    };
  }
  if (layout === 'pile') {
    const v1 = Math.sin((card + 1) * 127.1 + 311.7) * 43758.5453;
    const v2 = Math.sin((card + 2) * 127.1 + 311.7) * 43758.5453;
    const v3 = Math.sin((card + 3) * 127.1 + 311.7) * 43758.5453;
    const n1 = v1 - Math.floor(v1);
    const n2 = v2 - Math.floor(v2);
    const n3 = v3 - Math.floor(v3);
    return {
      x: (n1 - 0.5) * spread * 56,
      y: (n2 - 0.5) * spread * 44,
      rotate: (n3 - 0.5) * spread * 40,
      scale: 1 - position * depth * 0.03,
    };
  }
  // Default 'fan'
  const dir = isRTL ? -1 : 1;
  return {
    x: 0,
    y: 0,
    rotate: dir * position * spread * 8,
    scale: 1 - position * depth * 0.12,
  };
};

/**
 * Calculates translation correction so rotation anchors exactly around
 * the React Bits pivot point (fan: bottom-right [0.9, 0.9], deck: top-center [0.5, 0]).
 */
const getOriginDelta = (
  layout: StackLayout,
  width: number,
  height: number,
  rotateDeg: number,
  isRTL: boolean
) => {
  'worklet';
  if (rotateDeg === 0 || width <= 0 || height <= 0) {
    return { deltaX: 0, deltaY: 0 };
  }

  let oxNorm = 0.5;
  let oyNorm = 0.5;

  if (layout === 'fan') {
    oxNorm = isRTL ? 0.1 : 0.9;
    oyNorm = 0.9;
  } else if (layout === 'deck') {
    oxNorm = 0.5;
    oyNorm = 0.0;
  }

  const ox = oxNorm * width;
  const oy = oyNorm * height;
  const cx = width * 0.5;
  const cy = height * 0.5;

  const rad = (rotateDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const deltaX = (ox - cx) * (1 - cos) + (oy - cy) * sin;
  const deltaY = -(ox - cx) * sin + (oy - cy) * (1 - cos);

  return { deltaX, deltaY };
};

interface StackCardItemProps {
  cardId: number;
  position: number;
  settings: Settings;
  isTop: boolean;
  onSendToBack: () => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  sendToBackOnClick: boolean;
  cardWidth: number;
  cardHeight: number;
  dragLiftProgress: SharedValue<number>;
  children: React.ReactNode;
}

const StackCardItem: React.FC<StackCardItemProps> = ({
  cardId,
  position,
  settings,
  isTop,
  onSendToBack,
  onInteractionStart,
  onInteractionEnd,
  sendToBackOnClick,
  cardWidth,
  cardHeight,
  dragLiftProgress,
  children,
}) => {
  // Top-card interactive gestures
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const spin = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const isFlinging = useSharedValue(0);

  // Position spring animation
  const animPosition = useSharedValue(position);

  // When card position in stack changes, smoothly spring to new position
  useEffect(() => {
    animPosition.value = withSpring(
      position,
      getSpring(SPRINGS.place[0], SPRINGS.place[1], settings.speed)
    );
  }, [position, animPosition, settings.speed]);

  // Pan Gesture on top card
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-18, 18])
      .onBegin(() => {
        'worklet';
        if (onInteractionStart) {
          runOnJS(onInteractionStart)();
        }
        pressScale.value = withSpring(
          PRESS_SCALE,
          getSpring(SPRINGS.press[0], SPRINGS.press[1], settings.speed)
        );
      })
      .onUpdate((event) => {
        'worklet';
        dragX.value = event.translationX;
        dragY.value = event.translationY;

        // Lean physics in 3D
        const sideways =
          clamp(event.velocityX / LEAN_SPEED, -1, 1) * 0.7 +
          clamp(event.translationX / LEAN_REACH, -1, 1) * 0.3;
        const upward =
          clamp(-event.velocityY / LEAN_SPEED, -1, 1) * 0.7 +
          clamp(-event.translationY / LEAN_REACH, -1, 1) * 0.3;

        tiltY.value = sideways * settings.tilt;
        tiltX.value = upward * settings.tilt;
        spin.value = clamp(event.translationX / LEAN_REACH, -1, 1) * 6;

        // Drive lift of cards underneath
        const dist = Math.hypot(event.translationX, event.translationY);
        dragLiftProgress.value = clamp(dist / Math.max(settings.threshold, 1), 0, 1);
      })
      .onEnd((event) => {
        'worklet';
        pressScale.value = withSpring(
          1,
          getSpring(SPRINGS.settle[0], SPRINGS.settle[1], settings.speed)
        );

        const distance = Math.hypot(event.translationX, event.translationY);
        const pace = Math.hypot(event.velocityX, event.velocityY);
        const flick =
          pace > FLICK_SPEED &&
          (Math.abs(event.velocityX) > Math.abs(event.velocityY) ||
            Math.abs(event.velocityY) > 80);

        const clicked =
          sendToBackOnClick &&
          distance < CLICK_SLOP &&
          Math.abs(event.velocityX) < 80 &&
          Math.abs(event.velocityY) < 80;

        if (distance > settings.threshold || flick || clicked) {
          isFlinging.value = 1;
          const targetX =
            event.translationX !== 0
              ? Math.sign(event.translationX) * (cardWidth * 1.35)
              : cardWidth * 1.35;
          const targetY = event.translationY * 0.4;

          dragX.value = withSpring(
            targetX,
            getSpring(SPRINGS.fling[0], SPRINGS.fling[1], settings.speed),
            () => {
              'worklet';
              dragX.value = 0;
              dragY.value = 0;
              tiltX.value = 0;
              tiltY.value = 0;
              spin.value = 0;
              dragLiftProgress.value = 0;
              isFlinging.value = 0;
            }
          );
          dragY.value = withSpring(
            targetY,
            getSpring(SPRINGS.fling[0], SPRINGS.fling[1], settings.speed)
          );

          runOnJS(onSendToBack)();
        } else {
          dragX.value = withSpring(
            0,
            getSpring(SPRINGS.settle[0], SPRINGS.settle[1], settings.speed)
          );
          dragY.value = withSpring(
            0,
            getSpring(SPRINGS.settle[0], SPRINGS.settle[1], settings.speed)
          );
          tiltX.value = withSpring(
            0,
            getSpring(SPRINGS.face[0], SPRINGS.face[1], settings.speed)
          );
          tiltY.value = withSpring(
            0,
            getSpring(SPRINGS.face[0], SPRINGS.face[1], settings.speed)
          );
          spin.value = withSpring(
            0,
            getSpring(SPRINGS.face[0], SPRINGS.face[1], settings.speed)
          );
          dragLiftProgress.value = withSpring(
            0,
            getSpring(SPRINGS.settle[0], SPRINGS.settle[1], settings.speed)
          );
        }
      })
      .onFinalize(() => {
        'worklet';
        if (onInteractionEnd) {
          runOnJS(onInteractionEnd)();
        }
        pressScale.value = withSpring(
          1,
          getSpring(SPRINGS.settle[0], SPRINGS.settle[1], settings.speed)
        );
      });
  }, [
    settings.speed,
    settings.tilt,
    settings.threshold,
    settings.isRTL,
    sendToBackOnClick,
    cardWidth,
    dragLiftProgress,
    dragX,
    dragY,
    tiltX,
    tiltY,
    spin,
    pressScale,
    isFlinging,
    onSendToBack,
    onInteractionStart,
    onInteractionEnd,
  ]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const p = animPosition.value;
    const shown = Math.min(p, settings.visible - 1);

    const base = placement(
      settings.layout,
      shown,
      cardId,
      settings.spread,
      settings.depth,
      settings.isRTL
    );
    const ahead = placement(
      settings.layout,
      Math.max(shown - 1, 0),
      cardId,
      settings.spread,
      settings.depth,
      settings.isRTL
    );

    // Lift effect: when top card is pulled away, under cards step forward
    const lift = p > 0.4 ? dragLiftProgress.value * 0.4 : 0;
    let x = mix(base.x, ahead.x, lift);
    let y = mix(base.y, ahead.y, lift);
    let rot = mix(base.rotate, ahead.rotate, lift);
    let scl = mix(base.scale, ahead.scale, lift);

    // Origin correction for smooth rotational pivot
    const { deltaX, deltaY } = getOriginDelta(
      settings.layout,
      cardWidth,
      cardHeight,
      rot,
      settings.isRTL
    );
    x += deltaX;
    y += deltaY;

    if (isTop || isFlinging.value > 0) {
      x += dragX.value;
      y += dragY.value;
      scl *= pressScale.value;
    }

    const tX = isTop || isFlinging.value > 0 ? tiltX.value : 0;
    const tY = isTop || isFlinging.value > 0 ? tiltY.value : 0;
    const sp = isTop || isFlinging.value > 0 ? spin.value : 0;

    const isInteracting = isTop || isFlinging.value > 0;
    const zIndexVal = isFlinging.value > 0 ? 1000 : isTop ? 900 : settings.count - Math.round(p);

    return {
      transform: [
        { perspective: 900 },
        { translateX: x },
        { translateY: y },
        { rotate: `${rot + sp}deg` },
        { rotateX: `${tX}deg` },
        { rotateY: `${tY}deg` },
        { scale: scl },
      ],
      opacity: interpolate(
        p,
        [settings.visible - 0.7, settings.visible],
        [1, 0],
        Extrapolation.CLAMP
      ),
      zIndex: zIndexVal,
      elevation: isInteracting ? 50 : Math.max(1, 10 - Math.round(p)),
    };
  });

  const shadeAnimatedStyle = useAnimatedStyle(() => {
    const p = animPosition.value;
    const shown = Math.min(p, settings.visible - 1);
    const lift = p > 0.4 ? dragLiftProgress.value * 0.4 : 0;
    const shadeOpacity = Math.min(
      0.6,
      shown * settings.depth * 0.14 * (1 - lift)
    );

    return {
      opacity: isTop || isFlinging.value > 0 ? 0 : Math.max(0, shadeOpacity),
    };
  });

  const frameWidth = settings.frame > 0 ? settings.frame : 0;

  const cardFace = (
    <View
      style={[
        styles.face,
        {
          width: cardWidth,
          height: cardHeight,
          borderRadius: settings.radius,
        },
        frameWidth > 0 && {
          borderWidth: frameWidth,
          borderColor: settings.frameColor,
        },
        settings.shadow && styles.faceShadow,
      ]}
    >
      <View
        style={[
          styles.faceInner,
          {
            borderRadius: settings.radius,
            overflow: 'hidden',
          },
        ]}
      >
        {children}

        {/* Realistic darkness shade overlay for cards underneath */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.shadeOverlay,
            { borderRadius: settings.radius },
            shadeAnimatedStyle,
          ]}
        />
      </View>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          width: cardWidth,
          height: cardHeight,
        },
        cardAnimatedStyle,
      ]}
      pointerEvents={isTop ? 'auto' : 'none'}
    >
      {isTop ? (
        <GestureDetector gesture={panGesture}>{cardFace}</GestureDetector>
      ) : (
        cardFace
      )}
    </Animated.View>
  );
};

/**
 * React Bits `<Stack />` component ported to React Native / Expo.
 * Supports all 4 layouts ('fan', 'cascade', 'deck', 'pile'), 3D lean,
 * physical under-card depth shading, lift-on-drag, fling-out & tuck-in cycle,
 * plus auto-return to primary active card after inactivity / navigation.
 */
export const CardStack: React.FC<CardStackProps> = ({
  cards,
  layout = 'fan',
  visible = 4,
  spread = 0.5,
  depth = 0.5,
  radius = 28,
  frame = 0,
  frameColor = '#ffffff',
  shadow = true,
  tilt = 30,
  threshold = 85,
  speed = 1,
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  autoResetToTop = true,
  autoResetDelay = 16000,
  onChange,
  cardHeight = 275,
  cardWidth,
  peek = 44,
  isRTL = false,
  style,
  cardStyle,
}) => {
  const count = cards.length;
  const [order, setOrder] = useState<number[]>(() =>
    cards.map((_, index) => index)
  );

  const dragLiftProgress = useSharedValue(0);
  const isInteractingRef = useRef(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize order if cards array length changes
  const stackOrder = useMemo(() => {
    const next = order.filter((index) => index < count);
    for (let index = 0; index < count; index++) {
      if (!next.includes(index)) next.push(index);
    }
    return next;
  }, [order, count]);

  const computedCardWidth = useMemo(() => {
    if (typeof cardWidth === 'number') return cardWidth;
    return Math.min(SCREEN_WIDTH - 40, 360);
  }, [cardWidth]);

  const settings = useMemo<Settings>(
    () => ({
      layout,
      visible: Math.max(1, Math.min(Math.round(visible), Math.max(count, 1))),
      spread: Math.max(0, Math.min(spread, 2)),
      depth: Math.max(0, Math.min(depth, 1)),
      radius,
      frame,
      frameColor,
      shadow,
      tilt: Math.max(0, Math.min(tilt, 89)),
      threshold: Math.max(threshold, 0),
      speed: Math.max(0.2, Math.min(speed, 4)),
      count,
      isRTL,
    }),
    [
      layout,
      visible,
      spread,
      depth,
      radius,
      frame,
      frameColor,
      shadow,
      tilt,
      threshold,
      speed,
      count,
      isRTL,
    ]
  );

  // Reset smoothly back to primary card (Active Task card at index 0)
  const resetToMainCard = useCallback(() => {
    setOrder((prev) => {
      if (prev.length === 0 || prev[0] === 0) return prev;
      return Array.from({ length: count }, (_, i) => i);
    });
  }, [count]);

  // Schedule auto-return to primary card after autoResetDelay ms
  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    if (!autoResetToTop || stackOrder[0] === 0) return;

    resetTimerRef.current = setTimeout(() => {
      if (!isInteractingRef.current) {
        resetToMainCard();
      }
    }, autoResetDelay);
  }, [autoResetToTop, stackOrder, autoResetDelay, resetToMainCard]);

  const handleInteractionStart = useCallback(() => {
    isInteractingRef.current = true;
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const handleInteractionEnd = useCallback(() => {
    isInteractingRef.current = false;
    scheduleReset();
  }, [scheduleReset]);

  // Screen focus handling via Expo Router: if user navigates away, immediately reset to primary card
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (resetTimerRef.current) {
          clearTimeout(resetTimerRef.current);
          resetTimerRef.current = null;
        }
        resetToMainCard();
      };
    }, [resetToMainCard])
  );

  // When top card changes, arm the reset countdown if not on primary card
  useEffect(() => {
    if (autoResetToTop && stackOrder[0] !== 0) {
      scheduleReset();
    } else if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [stackOrder, autoResetToTop, scheduleReset]);

  // Fling-to-back sequence: updates stack order array and schedules reset
  const handleSendToBack = useCallback(() => {
    setOrder((prev) => {
      const next = prev.filter((id) => id < count);
      for (let i = 0; i < count; i++) {
        if (!next.includes(i)) next.push(i);
      }
      if (next.length < 2) return next;
      return [...next.slice(1), next[0]];
    });
  }, [count]);

  // Notify onChange of new top card
  const prevTopRef = useRef<number | null>(null);
  useEffect(() => {
    const currentTop = stackOrder[0];
    if (currentTop !== undefined) {
      if (prevTopRef.current !== null && prevTopRef.current !== currentTop) {
        onChange?.(currentTop);
      }
      prevTopRef.current = currentTop;
    }
  }, [stackOrder, onChange]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || count < 2) return undefined;
    const timer = setInterval(() => {
      handleSendToBack();
    }, Math.max(800, autoplayDelay));
    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, count, handleSendToBack]);

  const containerHeight = cardHeight + peek;

  return (
    <View
      onTouchStart={() => {
        if (stackOrder[0] !== 0) {
          scheduleReset();
        }
      }}
      style={[
        styles.container,
        {
          height: containerHeight,
          paddingTop: peek * 0.7,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.stackBounds,
          {
            width: computedCardWidth,
            height: cardHeight,
          },
        ]}
      >
        {stackOrder.map((cardId, position) => (
          <StackCardItem
            key={cardId}
            cardId={cardId}
            position={position}
            settings={settings}
            isTop={position === 0}
            onSendToBack={handleSendToBack}
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
            sendToBackOnClick={sendToBackOnClick}
            cardWidth={computedCardWidth}
            cardHeight={cardHeight}
            dragLiftProgress={dragLiftProgress}
          >
            {cards[cardId]}
          </StackCardItem>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 999,
  },
  stackBounds: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 999,
  },
  cardContainer: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
    overflow: 'visible',
  },
  face: {
    overflow: 'visible',
  },
  faceShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  faceInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  shadeOverlay: {
    backgroundColor: '#000000',
  },
});

export const Stack = CardStack;
export default CardStack;
