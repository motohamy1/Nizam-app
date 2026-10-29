import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

export interface CardSwapItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
  accentColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  iconColor?: string;
  subtextColor?: string;
  gradientColors?: readonly string[];
  textColor?: string;
  textureSource?: any;
  wireframe?: boolean;
}

export interface CardSwapRef {
  next: () => void;
  prev: () => void;
}

// Warm terracotta to parchment paper palette with richer contrast at the top
const DEFAULT_PALETTE = ['#8C4934', '#B36D3F', '#DFB57E', '#E4BD88'];
const DEFAULT_GRADIENTS: readonly (readonly [string, string, ...string[]])[] = [
  ['#8C4934', '#BC7E52', '#E8C394', '#F6E9C2'],
  ['#87402C', '#B97447', '#E4BC87', '#F7EBC6'],
  ['#823A26', '#B36D3F', '#DFB57E', '#F5E5BE'],
  ['#7C3420', '#AC6637', '#DAAD74', '#F3E1B6'],
];

const UPPER_WIDGET_PURPLE = '#8E2CAC';

// Quick utility to detect if a hex is light or dark for optimal contrast
const isLightColor = (hex?: string): boolean => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
  const clean = hex.replace('#', '');
  if (clean.length < 6) return false;
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  // Perceived luminance formula (ITU-R BT.709)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.58;
};

// Physics spring config for high performance 60/120fps motion
const SPRING_CONFIG = {
  damping: 17,
  stiffness: 140,
  mass: 0.9,
};

// Minimum displacement to trigger card swap
const SWAP_THRESHOLD = 50;

interface CardSwapProps {
  items: CardSwapItem[];
  width?: number;
  height?: number;
  cardDistance?: number;
  verticalDistance?: number;
  depth?: number;
  skewAmount?: number;
  visibleCards?: number;
  autoSwap?: boolean;
  autoSwapInterval?: number;
  draggable?: boolean;
  wireframe?: boolean;
  isArabic?: boolean;
  onCardClick?: (item: CardSwapItem, index: number) => void;
  onSwapChange?: (frontIndex: number) => void;
}

export const CardSwap = React.forwardRef<CardSwapRef, CardSwapProps>(({
  items,
  width = 330,
  height = 110,
  cardDistance = 18,
  verticalDistance = 12,
  depth = 0.07,
  skewAmount = 2.5,
  visibleCards = 3,
  autoSwap = false,
  autoSwapInterval = 4000,
  draggable = true,
  wireframe = false,
  isArabic = false,
  onCardClick,
  onSwapChange,
}, ref) => {
  const [order, setOrder] = useState<number[]>(() =>
    items.map((_, i) => i)
  );

  // Sync order if item count changes
  useEffect(() => {
    setOrder(items.map((_, i) => i));
  }, [items.length]);

  const swapToNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOrder((prev) => {
      if (prev.length <= 1) return prev;
      const next = [...prev];
      const front = next.shift()!;
      next.push(front);
      onSwapChange?.(next[0]);
      return next;
    });
  }, [onSwapChange]);

  const swapToPrev = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOrder((prev) => {
      if (prev.length <= 1) return prev;
      const next = [...prev];
      const back = next.pop()!;
      next.unshift(back);
      onSwapChange?.(next[0]);
      return next;
    });
  }, [onSwapChange]);

  useImperativeHandle(ref, () => ({
    next: swapToNext,
    prev: swapToPrev,
  }), [swapToNext, swapToPrev]);

  // Auto swap timer if enabled
  useEffect(() => {
    if (!autoSwap || items.length <= 1) return;
    const timer = setInterval(swapToNext, autoSwapInterval);
    return () => clearInterval(timer);
  }, [autoSwap, autoSwapInterval, items.length, swapToNext]);

  // Stage dimensions to account for skew & perspective offsets
  const maxSlot = Math.min(visibleCards - 1, items.length - 1);
  const stageWidth = width + Math.abs(maxSlot * cardDistance) + 20;
  const stageHeight = height + Math.abs(maxSlot * verticalDistance) + 20;

  return (
    <View style={[styles.container, { width: stageWidth, height: stageHeight }]}>
      <View style={[styles.stackStage, { width, height }]}>
        {items.map((item, originalIndex) => {
          const slot = order.indexOf(originalIndex);
          if (slot < 0 || slot >= visibleCards) return null;

          return (
            <CardSwapItemView
              key={item.id}
              item={item}
              itemIndex={originalIndex}
              slot={slot}
              isFront={slot === 0}
              visibleCards={visibleCards}
              width={width}
              height={height}
              cardDistance={cardDistance}
              verticalDistance={verticalDistance}
              depth={depth}
              skewAmount={skewAmount}
              wireframe={wireframe}
              onPress={() => {
                if (slot === 0) {
                  onCardClick?.(item, originalIndex);
                } else {
                  // Tapping a background card swaps it to the front
                  swapToNext();
                }
              }}
              onFlingSwap={swapToNext}
              draggable={draggable}
              isArabic={isArabic}
            />
          );
        })}
      </View>
    </View>
  );
});

interface CardSwapItemViewProps {
  item: CardSwapItem;
  itemIndex: number;
  slot: number;
  isFront: boolean;
  visibleCards: number;
  width: number;
  height: number;
  cardDistance: number;
  verticalDistance: number;
  depth: number;
  skewAmount: number;
  wireframe?: boolean;
  onPress: () => void;
  onFlingSwap: () => void;
  draggable: boolean;
  isArabic: boolean;
}

const CardSwapItemView: React.FC<CardSwapItemViewProps> = ({
  item,
  itemIndex,
  slot,
  isFront,
  visibleCards,
  width,
  height,
  cardDistance,
  verticalDistance,
  depth,
  skewAmount,
  wireframe = true,
  onPress,
  onFlingSwap,
  draggable,
  isArabic,
}) => {
  // Target transforms for this slot
  const targetX = slot * cardDistance;
  const targetY = -slot * verticalDistance;
  const targetScale = Math.max(0.75, 1 - slot * depth);
  const targetSkew = slot === 0 ? 0 : skewAmount * (1 - slot * 0.15);
  const targetZIndex = (visibleCards - slot) * 10;
  const targetShade = slot === 0 ? 0 : Math.min(0.28, slot * 0.09);

  // Dedicated shared values per card for silky-smooth transforms
  const animX = useSharedValue(targetX);
  const animY = useSharedValue(targetY);
  const animScale = useSharedValue(targetScale);
  const animSkew = useSharedValue(targetSkew);
  const animRotate = useSharedValue(0);
  const animZIndex = useSharedValue(targetZIndex);
  const animShade = useSharedValue(targetShade);

  const prevSlotRef = useRef(slot);
  const isFlingingRef = useRef(false);

  // Wireframe / glassmorphic purple styling
  const isWireframe = item.wireframe ?? wireframe ?? false;

  const cardBg =
    item.backgroundColor !== undefined
      ? item.backgroundColor
      : isWireframe
      ? 'transparent'
      : (item.gradientColors ? item.gradientColors[0] : DEFAULT_PALETTE[itemIndex % DEFAULT_PALETTE.length]);

  const isTransparent = cardBg === 'transparent' || cardBg === 'rgba(0,0,0,0)';

  const gradient =
    !isTransparent && item.gradientColors
      ? item.gradientColors
      : null;

  const isLight = !isWireframe && !isTransparent && isLightColor(cardBg);

  const textColor =
    item.textColor || (isWireframe || isTransparent ? '#FFFFFF' : isLight ? '#20120A' : '#FFFFFF');

  const subtextColor =
    item.subtextColor ||
    (isWireframe || isTransparent
      ? 'rgba(255, 255, 255, 0.75)'
      : isLight
      ? 'rgba(32, 18, 10, 0.74)'
      : 'rgba(255, 255, 255, 0.90)');

  const cardBorder =
    item.borderColor ||
    (isWireframe || isTransparent
      ? UPPER_WIDGET_PURPLE
      : isLight
      ? 'rgba(255, 255, 255, 0.45)'
      : 'rgba(255, 255, 255, 0.25)');

  const iconColor =
    item.iconColor ||
    (isWireframe || isTransparent ? UPPER_WIDGET_PURPLE : textColor);

  const iconBg =
    isWireframe || isTransparent
      ? 'rgba(142, 44, 172, 0.12)'
      : isLight
      ? 'rgba(255, 255, 255, 0.45)'
      : 'rgba(255, 255, 255, 0.22)';

  const iconBorder =
    item.borderColor
      ? `${item.borderColor}55`
      : isWireframe || isTransparent
      ? 'rgba(142, 44, 172, 0.45)'
      : isLight
      ? 'rgba(255, 255, 255, 0.65)'
      : 'rgba(255, 255, 255, 0.32)';

  const badgeBg =
    isWireframe || isTransparent
      ? 'rgba(142, 44, 172, 0.22)'
      : isLight
      ? 'rgba(32, 18, 10, 0.12)'
      : 'rgba(255, 255, 255, 0.24)';

  const badgeText =
    isWireframe || isTransparent ? UPPER_WIDGET_PURPLE : textColor;

  const indicatorLineColor =
    isWireframe || isTransparent
      ? 'rgba(142, 44, 172, 0.45)'
      : isLight
      ? 'rgba(32, 18, 10, 0.30)'
      : 'rgba(255, 255, 255, 0.48)';

  // Handle slot transition changes smoothly with ZERO delay
  useEffect(() => {
    const prevSlot = prevSlotRef.current;
    prevSlotRef.current = slot;

    if (prevSlot === slot) return;

    const isFrontToBack = prevSlot === 0 && slot === visibleCards - 1;
    const isBackToFront = prevSlot === visibleCards - 1 && slot === 0;

    if (isFrontToBack) {
      if (isFlingingRef.current) {
        isFlingingRef.current = false;
        animZIndex.value = targetZIndex;
        animScale.value = withSpring(targetScale, SPRING_CONFIG);
        animSkew.value = withSpring(targetSkew, SPRING_CONFIG);
        animRotate.value = withSpring(0, SPRING_CONFIG);
        animX.value = withSpring(targetX, SPRING_CONFIG);
        animY.value = withSpring(targetY, SPRING_CONFIG);
        animShade.value = withTiming(targetShade, { duration: 160 });
      } else {
        animZIndex.value = 100;
        animY.value = withTiming(targetY - 50, { duration: 100 }, () => {
          animZIndex.value = targetZIndex;
          animScale.value = withSpring(targetScale, SPRING_CONFIG);
          animSkew.value = withSpring(targetSkew, SPRING_CONFIG);
          animRotate.value = withSpring(0, SPRING_CONFIG);
          animX.value = withSpring(targetX, SPRING_CONFIG);
          animY.value = withSpring(targetY, SPRING_CONFIG);
          animShade.value = withTiming(targetShade, { duration: 160 });
        });
      }
    } else if (isBackToFront) {
      animZIndex.value = targetZIndex;
      animScale.value = withSpring(targetScale, SPRING_CONFIG);
      animSkew.value = withSpring(targetSkew, SPRING_CONFIG);
      animRotate.value = withSpring(0, SPRING_CONFIG);
      animX.value = withSpring(targetX, SPRING_CONFIG);
      animY.value = withSpring(targetY, SPRING_CONFIG);
      animShade.value = withTiming(targetShade, { duration: 160 });
    } else {
      animZIndex.value = targetZIndex;
      animScale.value = withSpring(targetScale, SPRING_CONFIG);
      animSkew.value = withSpring(targetSkew, SPRING_CONFIG);
      animRotate.value = withSpring(0, SPRING_CONFIG);
      animX.value = withSpring(targetX, SPRING_CONFIG);
      animY.value = withSpring(targetY, SPRING_CONFIG);
      animShade.value = withTiming(targetShade, { duration: 160 });
    }
  }, [slot, targetX, targetY, targetScale, targetSkew, targetZIndex, targetShade, visibleCards]);

  // Gesture handling: Only the front card can be dragged / flicked
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const gesture = Gesture.Pan()
    .enabled(draggable && isFront)
    .onBegin(() => {
      'worklet';
      isDragging.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      dragX.value = e.translationX;
      dragY.value = e.translationY;
      animRotate.value = (e.translationX / width) * 14;
    })
    .onEnd((e) => {
      'worklet';
      isDragging.value = false;
      const throwDistance = Math.hypot(e.translationX, e.translationY);
      const velocity = Math.hypot(e.velocityX, e.velocityY);

      if (throwDistance > SWAP_THRESHOLD || velocity > 450) {
        isFlingingRef.current = true;
        const throwDirX = e.velocityX !== 0 ? Math.sign(e.velocityX) : Math.sign(e.translationX) || 1;
        const throwTargetX = e.translationX + throwDirX * 120;
        const throwTargetY = e.translationY - 40;

        animX.value = withTiming(throwTargetX, { duration: 110 });
        animY.value = withTiming(throwTargetY, { duration: 110 });
        animRotate.value = withTiming(throwDirX * 18, { duration: 110 }, () => {
          dragX.value = 0;
          dragY.value = 0;
          runOnJS(onFlingSwap)();
        });
      } else {
        dragX.value = withSpring(0, SPRING_CONFIG);
        dragY.value = withSpring(0, SPRING_CONFIG);
        animRotate.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const currentX = animX.value + dragX.value;
    const currentY = animY.value + dragY.value;
    const skewRad = (animSkew.value * Math.PI) / 180;

    return {
      zIndex: animZIndex.value,
      transform: [
        { translateX: currentX },
        { translateY: currentY },
        { scale: animScale.value },
        { rotateZ: `${animRotate.value}deg` },
        { skewY: `${animSkew.value}deg` },
      ],
    };
  });

  const shadeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: animShade.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.card,
          {
            width,
            height,
            backgroundColor: cardBg,
            borderColor: cardBorder,
          },
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          delayPressIn={0}
          onPress={onPress}
          style={[styles.cardInner, { backgroundColor: cardBg }]}
        >
          {gradient && (
            <LinearGradient
              colors={gradient as any}
              locations={gradient.length === 4 ? [0, 0.32, 0.68, 1] : undefined}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Paper texture only if explicitly provided, or when not wireframe/transparent */}
          {(!isWireframe && !isTransparent && item.textureSource) && (
            <Image
              source={item.textureSource}
              contentFit="cover"
              style={[StyleSheet.absoluteFill, { opacity: 0.58 }]}
            />
          )}

          {/* Top Row: Icon + Title + Badge */}
          <View style={[styles.cardHeader, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.iconCircle, { backgroundColor: iconBg, borderColor: iconBorder }]}>
              <Ionicons
                name={item.icon}
                size={22}
                color={iconColor}
              />
            </View>

            <View style={[styles.titleContainer, isArabic && { alignItems: 'flex-end' }]}>
              <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
                {item.title}
              </Text>
              {!!item.subtitle && (
                <Text style={[styles.cardSubtitle, { color: subtextColor }]} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              )}
            </View>

            {!!item.badge && (
              <View style={[styles.badgePill, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgeText, { color: badgeText }]}>{item.badge}</Text>
              </View>
            )}
          </View>

          {/* Bottom Row: Action prompt */}
          <View style={[styles.cardFooter, isArabic && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.tapActionText, { color: textColor }]}>
              {isArabic ? 'اضغط للعرض ↗' : 'Tap to open ↗'}
            </Text>
            <View style={[styles.cardIndicatorLine, { backgroundColor: indicatorLineColor }]} />
          </View>

          {/* Natural depth shading for cards underneath, smoothly animated (non-transparent only) */}
          {!isTransparent && (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isWireframe ? '#0E0716' : '#1E0E06',
                  borderRadius: 22,
                },
                shadeAnimatedStyle,
              ]}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  card: {
    position: 'absolute',
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#3B0E4C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  cardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  tapActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    opacity: 0.85,
    letterSpacing: 0.2,
  },
  cardIndicatorLine: {
    width: 32,
    height: 3,
    borderRadius: 2,
  },
});

export default CardSwap;
