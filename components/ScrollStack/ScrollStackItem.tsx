import React, { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle, TouchableOpacity, Text, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import type { MonthPalette } from '@/components/MonthCreditCard';

const CARD_H = 260;
const VIEWPORT_H = 336;
const STATIC_TOP = (VIEWPORT_H - CARD_H) / 2;
const STACK_DEPTH = 26;
const STACK_SCALE_STEP = 0.03;
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
}) => {
  // Ring position: 0 = focused (center), +1/+2 = upcoming above, -1/-2 = past below.
  let diff = index - activeIndex;
  const half = Math.floor(totalCards / 2);
  if (diff > half) diff -= totalCards;
  else if (diff < -half) diff += totalCards;

  const isFocused = diff === 0;
  const isUpcoming = diff > 0;

  // Wallet deck offsets: exactly two cards peek above and two below the
  // focused card, mirroring the planner month deck.
  let targetTranslateY = 0;
  let targetScale = 1.0;
  let zIndex = 50;

  if (!isFocused) {
    const depth = Math.min(Math.abs(diff), MAX_VISIBLE_DEPTH);
    targetScale = 1 - depth * STACK_SCALE_STEP;
    targetTranslateY = isUpcoming ? -(depth * STACK_DEPTH) : depth * STACK_DEPTH;
    zIndex = 50 - depth;
  }

  const animTranslateY = useSharedValue(targetTranslateY);
  const animScale = useSharedValue(targetScale);

  useEffect(() => {
    animTranslateY.value = withSpring(targetTranslateY, SPRING_CONFIG);
    animScale.value = withSpring(targetScale, SPRING_CONFIG);
  }, [targetTranslateY, targetScale]);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: animTranslateY.value },
        { scale: animScale.value },
      ],
      zIndex,
    };
  });

  if (Math.abs(diff) > MAX_VISIBLE_DEPTH) return null;

  const ink = palette?.ink ?? '#181922';

  // Card name printed INSIDE the peek strip (the card's own padding zone),
  // so the rounded border of the card is never crossed.
  const labelStrip = !isFocused && label ? (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: CARD_PAD,
        right: CARD_PAD,
        height: CARD_PAD - 6,
        justifyContent: 'center',
        ...(isUpcoming ? { top: 4 } : { bottom: 4 }),
      }}
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
  ) : null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          left: 16,
          right: 16,
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
