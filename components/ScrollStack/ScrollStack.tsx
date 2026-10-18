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
  /** 'wireframe' = homepage outline cards with smooth color blooming, 'capsule' = planner solid rounded capsules. Defaults to 'capsule' if showWheel is true, 'wireframe' otherwise. */
  sideCardVariant?: 'wireframe' | 'capsule';
  /** Primary card indices (e.g. [0, 1]). When active card is not in this list,
   *  it relocates back to the last-viewed primary card after secondaryRelocateDelay. */
  primaryCardIndices?: number[];
  /** Idle duration (in ms) before relocating from secondary card back to primary card (default 12000). */
  secondaryRelocateDelay?: number;
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
  sideCardVariant,
  primaryCardIndices,
  secondaryRelocateDelay = 12000,
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);
  const effectiveVariant = sideCardVariant ?? (showWheel ? 'capsule' : 'wireframe');

  const cardArray = Children.toArray(children);
  const totalCards = cardArray.length;
  const paletteList = palettes ?? STACK_CARD_PALETTE_LIST;

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeIndexRef = useRef(initialIndex);
  activeIndexRef.current = activeIndex;

  // ─── Secondary Card Relocation to Primary Cards (Checklist / Reminders & Events) ───
  const primaryIndicesRef = useRef(primaryCardIndices);
  primaryIndicesRef.current = primaryCardIndices;
  const secondaryRelocateDelayRef = useRef(secondaryRelocateDelay);
  secondaryRelocateDelayRef.current = secondaryRelocateDelay;

  // Remembers the last-visited primary card (defaults to initialIndex or 0)
  const lastPrimaryIndexRef = useRef(
    primaryCardIndices && primaryCardIndices.includes(initialIndex) ? initialIndex : (primaryCardIndices?.[0] ?? 0)
  );
  const relocateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteractingRef = useRef(false);

  const clearRelocateTimer = useCallback(() => {
    if (relocateTimer.current) {
      clearTimeout(relocateTimer.current);
      relocateTimer.current = null;
    }
  }, []);

  const goToCardRef = useRef<(idx: number, fromAuto?: boolean) => void>(() => {});

  const scheduleRelocation = useCallback(() => {
    clearRelocateTimer();
    const primaryList = primaryIndicesRef.current;
    if (!primaryList || primaryList.length === 0 || totalCards <= 1) return;

    const currentIdx = activeIndexRef.current;
    // If user is currently on a primary card (e.g. Today's Checklist 0 or Reminders & Events 1),
    // record it as the last-viewed primary card and do NOT auto-relocate.
    if (primaryList.includes(currentIdx)) {
      lastPrimaryIndexRef.current = currentIdx;
      return;
    }

    // User is on another secondary card (Monthly Overview, Productivity, Insights, etc.)
    // After a longer period of idle time (secondaryRelocateDelay), relocate back.
    const delay = secondaryRelocateDelayRef.current;
    relocateTimer.current = setTimeout(() => {
      relocateTimer.current = null;
      if (!isInteractingRef.current) {
        const target = primaryList.includes(lastPrimaryIndexRef.current)
          ? lastPrimaryIndexRef.current
          : primaryList[0];
        goToCardRef.current(target, true);
      }
    }, delay);
  }, [clearRelocateTimer, totalCards]);

  useEffect(() => {
    scheduleRelocation();
    return clearRelocateTimer;
  }, [activeIndex, scheduleRelocation, clearRelocateTimer]);

  const scheduleAutoReturnRef = useRef<() => void>(() => {});

  const goToCard = useCallback((targetIndex: number, fromAuto = false) => {
    const nextIdx = ((targetIndex % totalCards) + totalCards) % totalCards;
    if (nextIdx !== activeIndexRef.current) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveIndex(nextIdx);
      onCardChange?.(nextIdx);
      if (!fromAuto) {
        scheduleAutoReturnRef.current();
      }
    }
  }, [totalCards, onCardChange]);
  goToCardRef.current = goToCard;

  // ─── Idle auto-return to the active card (same model as the home DateBar) ───
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
      if (targetIdx !== null && targetIdx !== undefined) {
        goToCard(targetIdx, true);
      }
    }, autoReturnDelayRef.current);
  }, [clearAutoReturnTimer, goToCard]);
  scheduleAutoReturnRef.current = scheduleAutoReturn;

  useEffect(() => clearAutoReturnTimer, [clearAutoReturnTimer]);

  const isArabicRef = useRef(isArabic);
  isArabicRef.current = isArabic;

  // Swipe deck gestures (same model on both axes):
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
          return axis === 'vertical'
            ? Math.abs(gestureState.dy) > 12 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.4
            : Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.4;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          isInteractingRef.current = true;
          clearAutoReturnTimer();
          clearRelocateTimer();
        },
        onPanResponderRelease: (_, gestureState) => {
          isInteractingRef.current = false;
          scheduleAutoReturnRef.current();
          scheduleRelocation();
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
        onPanResponderTerminate: () => {
          isInteractingRef.current = false;
          scheduleRelocation();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [axis, clearRelocateTimer, scheduleRelocation, clearAutoReturnTimer, goToCard]
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
              sideCardVariant={effectiveVariant}
            >
              {child}
            </ScrollStackItem>
          );
        })}
      </View>


      {/* 3D watch-bezel wheel (horizontal decks, only if requested) */}
      {showWheel && axis === 'horizontal' && (
        <WheelPicker
          labels={labels.length > 0 ? labels : cardArray.map((_, i) => `${i + 1}`)}
          activeIndex={activeIndex}
          onChange={goToCard}
          palettes={paletteList}
          accentColor={paletteList[activeIndex % paletteList.length]?.accent}
          isArabic={isArabic}
          style={{ marginTop: 10 }}
        />
      )}
    </View>
  );
};

export default ScrollStack;
