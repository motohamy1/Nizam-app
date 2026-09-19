import React, { useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import useTheme from '@/hooks/useTheme';

const GRAIN = require('../assets/images/grain.png');

/* Grain tile: source is 512px; displayed at ~171dp so on @3x screens one
   texture grain ≈ one device pixel (crisp, not an upscaled blur). The grid
   covers the measured area on both platforms because <Image> 'repeat'
   resize-mode is iOS-only. */
const GRAIN_TILE_DP = 171;

interface ScreenBackgroundProps {
  children?: React.ReactNode;
  style?: any;
}

// Dark-mode backdrop recipe distilled from the reference design:
// deep olive glow bleeding down from the top center, fading into a
// near-black forest floor, darkened corners (vignette), and fine film grain.
// ─── LIGHT MODE ambient recipe ─────────────────────────────────────────────
// The light background is NOT a flat ivory fill: it is a warm ivory base
// (#F3EBDD) brought alive by large, very soft ambient light fields — warm
// peach (top-center-right + lower-left reflection), pale sage (top-left +
// faint lower-right counterbalance), a cream field bridging warm and cool
// regions, and a whisper of warm edge depth. All glow positions are
// normalized (viewBox 0-100, preserveAspectRatio="none") so the composition
// scales with any device dimensions. Tune strengths/positions here.
const LIGHT_AMBIENT = {
  peachTop: { cx: 62, cy: 16, r: 95, stops: [
    { offset: 0, color: '#F0D8B8', opacity: 0.8 },
    { offset: 0.34, color: '#F3DDC3', opacity: 0.5 },
    { offset: 0.66, color: '#F5E4CF', opacity: 0.24 },
    { offset: 1, color: '#F5E4CF', opacity: 0 },
  ] },
  peachBottom: { cx: 10, cy: 86, r: 66, stops: [
    { offset: 0, color: '#F3DDC3', opacity: 0.5 },
    { offset: 0.5, color: '#F5E4CF', opacity: 0.26 },
    { offset: 1, color: '#F5E4CF', opacity: 0 },
  ] },
  sageTop: { cx: 14, cy: 8, r: 64, stops: [
    { offset: 0, color: '#E7EFD5', opacity: 0.9 },
    { offset: 0.4, color: '#EAF0DC', opacity: 0.48 },
    { offset: 0.72, color: '#EDF2E2', opacity: 0.22 },
    { offset: 1, color: '#EDF2E2', opacity: 0 },
  ] },
  sageBottom: { cx: 88, cy: 90, r: 58, stops: [
    { offset: 0, color: '#EAF0DC', opacity: 0.5 },
    { offset: 0.55, color: '#EDF2E2', opacity: 0.24 },
    { offset: 1, color: '#EDF2E2', opacity: 0 },
  ] },
  cream: { cx: 50, cy: 55, r: 80, stops: [
    { offset: 0, color: '#F6EBD8', opacity: 0.55 },
    { offset: 0.5, color: '#F7EEDF', opacity: 0.3 },
    { offset: 1, color: '#F7EEDF', opacity: 0 },
  ] },
  edge: { cx: 50, cy: 46, r: 88, stops: [
    { offset: 0, color: '#D8C5A3', opacity: 0 },
    { offset: 0.62, color: '#D8C5A3', opacity: 0 },
    { offset: 0.85, color: '#D8C5A3', opacity: 0.08 },
    { offset: 1, color: '#D8C5A3', opacity: 0.16 },
  ] },
} as const;

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({ children, style }) => {
  const { colors, isDarkMode } = useTheme();
  const [bgDims, setBgDims] = useState({ w: 0, h: 0 });

  if (!isDarkMode) {
    // LIGHT MODE — warm ivory environment with layered ambient light.
    // The base stays almost-white ivory; warmth comes from the glow layers,
    // never from a saturated beige fill.
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }, style]}>
        {/* Peach + sage ambient fields */}
        <View style={styles.ambientLayer} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              {(['sageTop', 'peachTop', 'sageBottom', 'peachBottom'] as const).map((key) => (
                <RadialGradient
                  key={key}
                  id={`light_${key}`}
                  cx={LIGHT_AMBIENT[key].cx}
                  cy={LIGHT_AMBIENT[key].cy}
                  r={LIGHT_AMBIENT[key].r}
                  gradientUnits="userSpaceOnUse"
                >
                  {LIGHT_AMBIENT[key].stops.map((s, i) => (
                    <Stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
                  ))}
                </RadialGradient>
              ))}
            </Defs>
            {/* Paint order: sage top → peach top → sage bottom → peach bottom,
                so peach dominates the warm poles and sage stays a whisper. */}
            <Rect x="0" y="0" width="100" height="100" fill="url(#light_sageTop)" />
            <Rect x="0" y="0" width="100" height="100" fill="url(#light_peachTop)" />
            <Rect x="0" y="0" width="100" height="100" fill="url(#light_sageBottom)" />
            <Rect x="0" y="0" width="100" height="100" fill="url(#light_peachBottom)" />
          </Svg>
        </View>

        {/* Cream balancing field bridges the warm and cool regions. */}
        <View style={styles.ambientLayer} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <RadialGradient
                id="light_cream"
                cx={LIGHT_AMBIENT.cream.cx}
                cy={LIGHT_AMBIENT.cream.cy}
                r={LIGHT_AMBIENT.cream.r}
                gradientUnits="userSpaceOnUse"
              >
                {LIGHT_AMBIENT.cream.stops.map((s, i) => (
                  <Stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
                ))}
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#light_cream)" />
          </Svg>
        </View>

        {/* Very subtle warm edge depth — no visible rectangle, no vignette ring. */}
        <View style={styles.ambientLayer} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <RadialGradient
                id="light_edge"
                cx={LIGHT_AMBIENT.edge.cx}
                cy={LIGHT_AMBIENT.edge.cy}
                r={LIGHT_AMBIENT.edge.r}
                gradientUnits="userSpaceOnUse"
              >
                {LIGHT_AMBIENT.edge.stops.map((s, i) => (
                  <Stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
                ))}
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#light_edge)" />
          </Svg>
        </View>

        {children}
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: '#0A0B0A' }, style]}
      onLayout={(e) => setBgDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {/* Near-black base with restrained ambient light, never a green wash. */}
      <View style={styles.ambientLayer} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="topGlow" cx="50" cy="18" r="118" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#5D7317" stopOpacity="0.23" />
              <Stop offset="0.32" stopColor="#465B12" stopOpacity="0.14" />
              <Stop offset="0.68" stopColor="#27330E" stopOpacity="0.065" />
              <Stop offset="1" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="secondaryGlow" cx="78" cy="54" r="108" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#465B12" stopOpacity="0.075" />
              <Stop offset="0.58" stopColor="#27330E" stopOpacity="0.035" />
              <Stop offset="1" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill="url(#topGlow)" />
          <Rect x="0" y="0" width="100" height="100" fill="url(#secondaryGlow)" />
        </Svg>
      </View>

      {/* Edge vignette keeps the atmospheric light behind the UI. */}
      <View style={styles.ambientLayer} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="vignette" cx="50" cy="42" r="85" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#000000" stopOpacity="0" />
              <Stop offset="0.55" stopColor="#000000" stopOpacity="0" />
              <Stop offset="0.82" stopColor="#000000" stopOpacity="0.28" />
              <Stop offset="1" stopColor="#000000" stopOpacity="0.55" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill="url(#vignette)" />
        </Svg>
      </View>

      {/* Granulated film grain: a grid of 1:1-scaled tiles covering the whole
          measured viewport (repeat resize-mode is iOS-only, and even there it
          tiles in dp which upscales the grains). */}
      {Platform.OS !== 'web' && bgDims.w > 0 && bgDims.h > 0 && (
        <View pointerEvents="none" style={styles.grainLayer}>
          {(() => {
            const cols = Math.ceil(bgDims.w / GRAIN_TILE_DP);
            const rows = Math.ceil(bgDims.h / GRAIN_TILE_DP);
            const tiles: React.ReactNode[] = [];
            for (let c = 0; c < cols; c++) {
              for (let r = 0; r < rows; r++) {
                tiles.push(
                  <Image
                    key={`${c}x${r}`}
                    source={GRAIN}
                    resizeMode="stretch"
                    style={{
                      position: 'absolute',
                      left: c * GRAIN_TILE_DP,
                      top: r * GRAIN_TILE_DP,
                      width: GRAIN_TILE_DP,
                      height: GRAIN_TILE_DP,
                    }}
                  />
                );
              }
            }
            return tiles;
          })()}
        </View>
      )}

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientLayer: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  grainLayer: {
    ...StyleSheet.absoluteFill,
    opacity: 0.5,
  },
});

export default ScreenBackground;
