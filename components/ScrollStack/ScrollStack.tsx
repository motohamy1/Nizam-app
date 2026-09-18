import React, { Children, useState, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleProp, 
  ViewStyle, 
  PanResponder,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { createScrollStackStyles, STACK_CARD_PALETTE_LIST } from '@/assets/styles/scrollStack.styles';
import ScrollStackItem from './ScrollStackItem';

interface ScrollStackProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onCardChange?: (index: number) => void;
  isArabic?: boolean;
  /** Title shown on each peeking card's tab, in children order. */
  labels?: string[];
}

const SWIPE_THRESHOLD = 15;

export const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  style,
  onCardChange,
  isArabic = false,
  labels = [],
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);

  const cardArray = Children.toArray(children);
  const totalCards = cardArray.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const goToCard = useCallback((targetIndex: number) => {
    const nextIdx = ((targetIndex % totalCards) + totalCards) % totalCards;
    if (nextIdx !== activeIndexRef.current) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveIndex(nextIdx);
      onCardChange?.(nextIdx);
    }
  }, [totalCards, onCardChange]);

  // Vertical swipe deck (same gesture model as the planner month cards):
  // swipe UP -> next card, swipe DOWN -> previous card.
  // Taps are never stolen (no start-grab) so card content stays interactive.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dy) > 12 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.4;
        },
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          // Capture vertical swipes before the parent ScrollView intercepts them
          return Math.abs(gestureState.dy) > 12 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.4;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, gestureState) => {
          const current = activeIndexRef.current;
          if (gestureState.dy < -SWIPE_THRESHOLD) {
            goToCard(current + 1);
          } else if (gestureState.dy > SWIPE_THRESHOLD) {
            goToCard(current - 1);
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (totalCards === 0) return null;

  return (
    <View style={[styles.container, style]}>
      {/* Stacked Cards Container */}
      <View style={styles.stackContainer} {...panResponder.panHandlers}>
        {cardArray.map((child, idx) => {
          const palette = STACK_CARD_PALETTE_LIST[idx % STACK_CARD_PALETTE_LIST.length];
          return (
            <ScrollStackItem
              key={idx}
              index={idx}
              activeIndex={activeIndex}
              totalCards={totalCards}
              label={labels[idx]}
              palette={palette}
              onSelect={() => goToCard(idx)}
              isArabic={isArabic}
            >
              {child}
            </ScrollStackItem>
          );
        })}
      </View>

      {/* Pagination Dots */}
      {totalCards > 1 && (
        <View style={styles.paginationRow}>
          {cardArray.map((_, dotIdx) => {
            const isActive = dotIdx === activeIndex;
            const dotPalette = STACK_CARD_PALETTE_LIST[dotIdx % STACK_CARD_PALETTE_LIST.length];
            return (
              <TouchableOpacity
                key={dotIdx}
                onPress={() => goToCard(dotIdx)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                style={[
                  styles.paginationDot,
                  isActive && styles.paginationDotActive,
                  isActive && !isDarkMode && { backgroundColor: dotPalette.accent },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

export default ScrollStack;
