import React, { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle, TouchableOpacity, Text, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import type { MonthPalette } from '@/components/MonthCreditCard';

const CARD_H = 270;
const VIEWPORT_H = 276;
const STATIC_TOP = (VIEWPORT_H - CARD_H) / 2;
const STACK_DEPTH = 26;
const STACK_DEPTH_X = 48;   // horizontal peek offset
const STACK_SCALE_STEP = 0.03;
const STACK_SCALE_STEP_X = 0.08;
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

  // ─── Horizontal Rolodex Mode (Stitch design) ───
  // Non-current cards appear ONLY as solid rounded color capsules on left and right.
  if (axis === 'horizontal') {
    if (Math.abs(diff) > 1) return null;

    if (!isFocused) {
      const isLeft = isArabic ? diff > 0 : diff < 0;
      const capsuleWidth = 30;
      const capsuleInset = Math.max(4, cardInset - capsuleWidth - 4);
      const capsuleBg = palette?.bg ?? '#10b981';

      return (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={{
            position: 'absolute',
            ...(isLeft ? { left: capsuleInset } : { right: capsuleInset }),
            top: STATIC_TOP + (CARD_H - 165) / 2,
            width: capsuleWidth,
            height: 165,
            borderRadius: 20,
            backgroundColor: capsuleBg,
            zIndex: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
            opacity: 0.95,
          }}
        >
          <TouchableOpacity
            onPress={onSelect}
            activeOpacity={0.85}
            style={{ width: '100%', height: '100%', borderRadius: 20 }}
            accessibilityLabel={label}
            accessibilityRole="button"
          />
        </Animated.View>
      );
    }

    return (
      <Animated.View
        entering={FadeIn.duration(220)}
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            left: cardInset,
            right: cardInset,
            top: STATIC_TOP,
            height: CARD_H,
            zIndex: 50,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  // ─── Vertical Swipe Deck Mode ───
  let targetOffset = 0;
  let targetScale = 1.0;
  let zIndex = 50;

  if (!isFocused) {
    const depth = Math.min(Math.abs(diff), MAX_VISIBLE_DEPTH);
    targetScale = 1 - depth * STACK_SCALE_STEP;
    const side = isUpcoming ? -1 : 1;
    targetOffset = side * depth * STACK_DEPTH;
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
        { translateY: animOffset.value },
        { scale: animScale.value },
      ],
      zIndex,
    };
  });

  if (Math.abs(diff) > MAX_VISIBLE_DEPTH) return null;

  const ink = isDarkMode ? (palette?.bg ?? '#181922') : (palette?.ink ?? '#181922');

  let labelStrip = null;
  if (!isFocused && label) {
    labelStrip = (
      <View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: CARD_PAD,
            right: CARD_PAD,
            height: CARD_PAD - 6,
            justifyContent: 'center',
            ...(isUpcoming ? { top: 4 } : { bottom: 4 }),
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={{
            fontSize: 9.5,
            fontWeight: '700',
            letterSpacing: 0.2,
            color: ink,
            opacity: 0.9,
            textAlign: isArabic ? 'right' : 'left',
          }}
        >
          {label}
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
      {labelStrip}
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
