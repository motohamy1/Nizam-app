import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import useTheme from '@/hooks/useTheme';

interface WavyBorderProps {
  height?: number;
  fillColor?: string;
  waveColor?: string;
  accentColor?: string;
  style?: ViewStyle;
}

/**
 * Generates an asymmetric, fluid static wave path matching the reference image.
 * Fills from the top (y=0) down to the bottom wavy curve.
 */
function buildStaticWavePath(
  width: number,
  height: number,
  cp1XRatio: number,
  cp1YRatio: number,
  cp2XRatio: number,
  cp2YRatio: number,
  endYRatio: number,
  startYRatio: number = 0.3
): string {
  if (width <= 0 || height <= 0) return '';

  const startY = height * startYRatio;
  const cp1X = width * cp1XRatio;
  const cp1Y = height * cp1YRatio;
  const cp2X = width * cp2XRatio;
  const cp2Y = height * cp2YRatio;
  const endY = height * endYRatio;

  // Single or multi-bezier smooth fluid wave from (0, startY) to (width, endY)
  return `M 0 0 L 0 ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${width} ${endY} L ${width} 0 Z`;
}

/**
 * Double-bezier wave for rich S-curve fluid contours.
 */
function buildComplexStaticWavePath(
  width: number,
  height: number,
  startY: number,
  midX: number,
  midY: number,
  endY: number,
  crestHeight1: number,
  crestHeight2: number
): string {
  if (width <= 0 || height <= 0) return '';

  const cp1X = midX * 0.45;
  const cp1Y = crestHeight1;
  const cp2X = midX * 0.85;
  const cp2Y = midY;

  const cp3X = midX + (width - midX) * 0.35;
  const cp3Y = midY;
  const cp4X = midX + (width - midX) * 0.75;
  const cp4Y = crestHeight2;

  return [
    `M 0 0`,
    `L 0 ${startY}`,
    `C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${midX} ${midY}`,
    `C ${cp3X} ${cp3Y}, ${cp4X} ${cp4Y}, ${width} ${endY}`,
    `L ${width} 0`,
    `Z`,
  ].join(' ');
}

/**
 * WavyBorder renders a static, multi-layered fluid wave bottom border.
 */
export const WavyBorder = ({
  height = 14,
  fillColor,
  waveColor,
  accentColor,
  style,
}: WavyBorderProps) => {
  const { colors, isDarkMode } = useTheme();
  const [layoutWidth, setLayoutWidth] = useState(0);

  if (isDarkMode || height <= 0) return null;

  const baseFill = fillColor || colors.surface;
  if (baseFill === 'transparent') return null;

  // No accent tint on the layered waves; the border line is removed
  const primaryWave = waveColor || 'transparent';
  const secondaryWave = accentColor || 'transparent';

  const w = layoutWidth;
  const h = height;

  // Layer 1 (Underlying ambient glow wave - deeper swoop)
  const pathLayer1 = w > 0
    ? buildComplexStaticWavePath(
        w,
        h,
        h * 0.4,
        w * 0.48,
        h * 0.75,
        h * 0.35,
        h * 0.98,
        h * 0.55
      )
    : '';

  // Layer 2 (Middle accent translucent wave - offset crest)
  const pathLayer2 = w > 0
    ? buildComplexStaticWavePath(
        w,
        h,
        h * 0.25,
        w * 0.52,
        h * 0.65,
        h * 0.2,
        h * 0.88,
        h * 0.42
      )
    : '';

  // Layer 3 (Foreground main header wave - clean crest attached to header)
  const pathLayer3 = w > 0
    ? buildComplexStaticWavePath(
        w,
        h,
        h * 0.15,
        w * 0.5,
        h * 0.55,
        h * 0.1,
        h * 0.78,
        h * 0.32
      )
    : '';

  return (
    <View
      style={[styles.waveContainer, { height }, style]}
      onLayout={(e) => {
        const measuredWidth = Math.round(e.nativeEvent.layout.width);
        if (measuredWidth > 0 && measuredWidth !== layoutWidth) {
          setLayoutWidth(measuredWidth);
        }
      }}
      pointerEvents="none"
    >
      {layoutWidth > 0 && (
        <Svg width={layoutWidth} height={height} viewBox={`0 0 ${layoutWidth} ${height}`} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="ambientWaveGradStatic" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={secondaryWave} />
              <Stop offset="50%" stopColor={primaryWave} />
              <Stop offset="100%" stopColor={secondaryWave} />
            </LinearGradient>
            <LinearGradient id="midWaveGradStatic" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={primaryWave} />
              <Stop offset="100%" stopColor={secondaryWave} />
            </LinearGradient>
          </Defs>

          {/* Layer 1: Ambient Background Tint Wave */}
          <Path d={pathLayer1} fill="url(#ambientWaveGradStatic)" />

          {/* Layer 2: Middle Translucent Tint Wave */}
          <Path d={pathLayer2} fill="url(#midWaveGradStatic)" />

          {/* Layer 3: Foreground Main Header Base Wave */}
          <Path d={pathLayer3} fill={baseFill} />
        </Svg>
      )}
    </View>
  );
};

// Backward-compatible alias
export const AnimatedWavyBorder = WavyBorder;

interface WavyHeaderProps {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  waveHeight?: number;
  backgroundColor?: string;
  waveColor?: string;
  accentColor?: string;
  speed?: number; // unused in static mode
}

/**
 * WavyHeader wraps header content and attaches the static layered wavy bottom border.
 */
export const WavyHeader = ({
  children,
  containerStyle,
  contentStyle,
  waveHeight = 12,
  backgroundColor,
  waveColor,
  accentColor,
}: WavyHeaderProps) => {
  const { colors, isDarkMode } = useTheme();
  // In dark mode, ensure header is transparent so background atmospheric gradient flows through seamlessly
  const headerBg = isDarkMode
    ? (backgroundColor === colors.bg ? 'transparent' : (backgroundColor || 'transparent'))
    : (backgroundColor || colors.surface);

  return (
    <View style={[styles.headerWrapper, containerStyle]}>
      {/* Header Content Container */}
      <View style={[{ backgroundColor: headerBg }, contentStyle]}>
        {children}
      </View>

      {/* Static Layered Wavy Bottom Edge (shown in light mode only) */}
      {!isDarkMode && (
        <WavyBorder
          height={waveHeight}
          fillColor={headerBg}
          waveColor={waveColor}
          accentColor={accentColor}
        />
      )}
    </View>
  );
};

// Backward-compatible alias
export const AnimatedWavyHeader = WavyHeader;

const styles = StyleSheet.create({
  headerWrapper: {
    width: '100%',
    overflow: 'hidden',
    zIndex: 10,
  },
  waveContainer: {
    width: '100%',
    overflow: 'hidden',
  },
});

export default WavyHeader;
