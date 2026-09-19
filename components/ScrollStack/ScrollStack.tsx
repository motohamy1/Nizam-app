import React, { Children, useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
import type { MonthPalette } from '@/components/MonthCreditCard';
import ScrollStackItem from './ScrollStackItem';
import WheelPicker from './WheelPicker';

interface ScrollStackProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onCardChange?: (index: number) => void;
  isArabic?: boolean;
  /** Title shown on each peeking card's tab, in children order. */
  labels?: string[];
  /** Card index focused when the stack mounts. */
  initialIndex?: number;
  /** Per-card palettes (used for peek label tint). Defaults to the homepage stack palettes. */
  palettes?: MonthPalette[];
  /** 'vertical' = homepage swipe deck (default), 'horizontal' = rolodex deck. */
  axis?: 'vertical' | 'horizontal';
  /** Show the 3D month wheel instead of pagination dots (horizontal only). */
  showWheel?: boolean;
  /** Horizontal inset of cards from the container edges (deck width control). */
  cardInset?: number;
  /** Card index the deck snaps back to after an idle period (e.g. the current
   *  month card). Pass null/undefined to disable. */
  autoReturnIndex?: number | null;
  /** Idle delay before the auto-return snap, in ms (default 5000). */
  autoReturnDelay?: number;
}

const SWIPE_THRESHOLD = 15;

export const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  style,
  onCardChange,
  isArabic = false,
  labels = [],
  initialIndex = 0,
  palettes,
  axis = 'vertical',
  showWheel = false,
  cardInset = 16,
  autoReturnIndex = null,
  autoReturnDelay = 5000,
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);

  const cardArray = Children.toArray(children);
  const totalCards = cardArray.length;
  const paletteList = palettes ?? STACK_CARD_PALETTE_LIST;

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeIndexRef = useRef(initialIndex);
  activeIndexRef.current = activeIndex;

  const goToCard = useCallback((targetIndex: number, fromAutoReturn = false) => {
    const nextIdx = ((targetIndex % totalCards) + totalCards) % totalCards;
    if (nextIdx !== activeIndexRef.current) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveIndex(nextIdx);
      onCardChange?.(nextIdx);
      // Any user-driven card change (swipe, tap, wheel detent) restarts the
      // idle countdown. The auto-return's own move must not re-arm it, or it
      // would keep cycling forever.
      if (!fromAutoReturn) {
        scheduleAutoReturnRef.current();
      }
    }
  }, [totalCards, onCardChange]);

  // ─── Idle auto-return to the active card (same model as the home DateBar) ───
  // Every interaction path converges on goToCard, so scheduling there plus on
  // pan release covers swipes, card taps and month-wheel drags.
  const autoReturnIndexRef = useRef(autoReturnIndex);
  autoReturnIndexRef.current = autoReturnIndex;
  const autoReturnDelayRef = useRef(autoReturnDelay);
  autoReturnDelayRef.current = autoReturnDelay;
  const goToCardRef = useRef(goToCard);
  goToCardRef.current = goToCard;
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
      if (targetIdx !== null && targetIdx !== undefined) {
        goToCardRef.current(targetIdx, true);
      }
    }, autoReturnDelayRef.current);
  }, [clearAutoReturnTimer]);
  const scheduleAutoReturnRef = useRef(scheduleAutoReturn);
  scheduleAutoReturnRef.current = scheduleAutoReturn;

  useEffect(() => clearAutoReturnTimer, [clearAutoReturnTimer]);

  const isArabicRef = useRef(isArabic);
  isArabicRef.current = isArabic;

  // Swipe deck gestures (same model on both axes):
  // vertical:   swipe UP -> next card, DOWN -> previous.
  // horizontal: swipe LEFT -> next card, RIGHT -> previous (RTL mirrored).
  // Claiming the touch on start (bubble phase) keeps the parent ScrollView from
  // stealing swipes, while deeper touchables still win taps so card content
  // stays interactive.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return axis === 'vertical'
            ? Math.abs(gestureState.dy) > 12 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.4
            : Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.4;
        },
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          // Capture dominant-axis swipes before the parent ScrollView intercepts them
          return axis === 'vertical'
            ? Math.abs(gestureState.dy) > 12 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.4
            : Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.4;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          // User is interacting — pause the idle auto-return.
          clearAutoReturnTimer();
        },
        onPanResponderRelease: (_, gestureState) => {
          // The gesture is over — restart the idle countdown even when the
          // swipe didn't cross the threshold (deck may still drift on release).
          scheduleAutoReturnRef.current();
          const current = activeIndexRef.current;
          if (axis === 'vertical') {
            if (gestureState.dy < -SWIPE_THRESHOLD) goToCard(current + 1);
            else if (gestureState.dy > SWIPE_THRESHOLD) goToCard(current - 1);
          } else {
            const forward = isArabicRef.current
              ? gestureState.dx > SWIPE_THRESHOLD
              : gestureState.dx < -SWIPE_THRESHOLD;
            const backward = isArabicRef.current
              ? gestureState.dx < -SWIPE_THRESHOLD
              : gestureState.dx > SWIPE_THRESHOLD;
            if (forward) goToCard(current + 1);
            else if (backward) goToCard(current - 1);
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [axis]
  );

  if (totalCards === 0) return null;

  return (
    <View style={[styles.container, style]}>
      {/* Stacked Cards Container */}
      <View style={styles.stackContainer} {...panResponder.panHandlers}>
        {cardArray.map((child, idx) => {
          const palette = paletteList[idx % paletteList.length];
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
              axis={axis}
              cardInset={cardInset}
            >
              {child}
            </ScrollStackItem>
          );
        })}
      </View>

      {/* 3D watch-bezel wheel (horizontal decks) or pagination dots */}
      {showWheel && axis === 'horizontal' ? (
        <WheelPicker
          labels={labels.length > 0 ? labels : cardArray.map((_, i) => `${i + 1}`)}
          activeIndex={activeIndex}
          onChange={goToCard}
          palettes={paletteList}
          accentColor={paletteList[activeIndex % paletteList.length]?.accent}
          isArabic={isArabic}
          style={{ marginTop: -36 }}
        />
      ) : totalCards > 1 && (
        <View style={styles.paginationRow}>
          {cardArray.map((_, dotIdx) => {
            const isActive = dotIdx === activeIndex;
            const dotPalette = paletteList[dotIdx % paletteList.length];
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
