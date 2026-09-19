import React, { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle, TouchableOpacity, Text, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import type { MonthPalette } from '@/components/MonthCreditCard';

const CARD_H = 260;
const VIEWPORT_H = 336;
const STATIC_TOP = (VIEWPORT_H - CARD_H) / 2;
const STACK_DEPTH = 26;
const STACK_DEPTH_X = 44;   // horizontal rolodex peek offset (roomy gap)
const STACK_SCALE_STEP = 0.03;
const STACK_SCALE_STEP_X = 0.06;  // stronger shrink for side peeks
const MAX_VISIBLE_DEPTH = 2;
const SPRING_CONFIG = { damping: 18, stiffness: 180 };
const CARD_PAD = 18;

interface ScrollStackItemProps {
  children: ReactNode;
  index: number;
  activeIndex: number;
  totalCards: number;
  label?: string;
  palette?: MonthPalette;
  onSelect: () => void;
  style?: StyleProp<ViewStyle>;
  isArabic?: boolean;
  /** 'vertical' = homepage deck, 'horizontal' = planner rolodex deck. */
  axis?: 'vertical' | 'horizontal';
  /** Horizontal inset of the focused card from the container edges. */
  cardInset?: number;
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({
  children,
  index,
  activeIndex,
  totalCards,
  label,
  palette,
  onSelect,
  style,
  isArabic = false,
  axis = 'vertical',
  cardInset = 16,
}) => {
  const { isDarkMode } = useTheme();
  // Ring position: 0 = focused (center), +1/+2 = upcoming above, -1/-2 = past below.
  let diff = index - activeIndex;
  const half = Math.floor(totalCards / 2);
  if (diff > half) diff -= totalCards;
  else if (diff < -half) diff += totalCards;

  const isFocused = diff === 0;
  const isUpcoming = diff > 0;

  // Deck offsets: exactly two cards peek on each side of the focused card.
  // Vertical (homepage): upcoming above, past below.
  // Horizontal (planner rolodex): upcoming to the trailing edge, past to the
  // leading edge — mirrored for RTL so "next" always peeks where reading flows.
  let targetOffset = 0;
  let targetScale = 1.0;
  let zIndex = 50;

  if (!isFocused) {
    const depth = Math.min(Math.abs(diff), MAX_VISIBLE_DEPTH);
    targetScale = 1 - depth * (axis === 'vertical' ? STACK_SCALE_STEP : STACK_SCALE_STEP_X);
    const side = axis === 'vertical'
      ? (isUpcoming ? -1 : 1)                       // upcoming above, past below
      : (isUpcoming ? (isArabic ? -1 : 1) : (isArabic ? 1 : -1)); // rolodex sides
    targetOffset = side * depth * (axis === 'vertical' ? STACK_DEPTH : STACK_DEPTH_X);
    zIndex = 50 - depth;
  }

  const animOffset = useSharedValue(targetOffset);
  const animScale = useSharedValue(targetScale);

  useEffect(() => {
    animOffset.value = withSpring(targetOffset, SPRING_CONFIG);
    animScale.value = withSpring(targetScale, SPRING_CONFIG);
  }, [targetOffset, targetScale]);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        axis === 'vertical'
          ? { translateY: animOffset.value }
          : { translateX: animOffset.value },
        { scale: animScale.value },
      ],
      zIndex,
    };
  });

  if (Math.abs(diff) > MAX_VISIBLE_DEPTH) return null;

  // Peek strip ink: on light pastel faces use the palette's dark ink; in
  // dark mode the card face is the deep gradient, so use its pastel instead.
  const ink = isDarkMode ? (palette?.bg ?? '#181922') : (palette?.ink ?? '#181922');

  // Card name printed INSIDE the peek strip (the card's own padding zone),
  // so the rounded border of the card is never crossed.
  let labelStrip = null;
  if (!isFocused && label) {
    const stripStyle = axis === 'vertical'
      ? {
          left: CARD_PAD,
          right: CARD_PAD,
          height: CARD_PAD - 6,
          justifyContent: 'center' as const,
          ...(isUpcoming ? { top: 4 } : { bottom: 4 }),
        }
      : {
          top: CARD_PAD,
          height: CARD_PAD - 6,
          width: STACK_DEPTH_X - 8,
          justifyContent: 'center' as const,
          ...(isUpcoming
            ? (isArabic ? { left: 4 } : { right: 4 })
            : (isArabic ? { right: 4 } : { left: 4 })),
        };
    labelStrip = (
      <View pointerEvents="none" style={[{ position: 'absolute' }, stripStyle]}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 9.5,
            fontWeight: '700',
            letterSpacing: 0.2,
            color: ink,
            opacity: 0.9,
            textAlign: axis === 'horizontal' ? 'center' : (isArabic ? 'right' : 'left'),
          }}
        >
          {axis === 'horizontal' && !isArabic ? label.slice(0, 3) : label}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          left: cardInset,
          right: cardInset,
          top: STATIC_TOP,
          height: CARD_H,
        },
        animatedCardStyle,
        style,
      ]}
    >
      {children}

      {/* Card name printed inside the peek strip (never crosses the border) */}
      {labelStrip}

      {/* Touch interceptor on peeking cards to bring them to focus when tapped */}
      {!isFocused && (
        <TouchableOpacity
          onPress={onSelect}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 999,
          }}
          activeOpacity={0.9}
        />
      )}
    </Animated.View>
  );
};

export default ScrollStackItem;
