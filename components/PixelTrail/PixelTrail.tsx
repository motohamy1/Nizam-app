import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';

export type PixelShape = 'square' | 'circle' | 'diamond';
export type PixelDecay = 'fade' | 'shrink' | 'dither';

export interface PixelTrailProps {
  /** Number of pixel columns across the card (default 24) */
  gridSize?: number;
  /** Primary pixel color */
  color?: string;
  /** Secondary trail color */
  trailColor?: string;
  /** Shape of each pixel */
  shape?: PixelShape;
  /** Task running status: 'in_progress' | 'paused' | 'ready' | 'idle' | 'done' */
  status?: string;
  /** Timer mode: 'count_down' builds diagonally, 'count_up' whole-background wavy columns */
  mode?: 'count_down' | 'count_up';
  /** Progression fraction (0.0 to 1.0) for countdown timer */
  progress?: number;
  /** Support for Arabic interface (right-to-left wave / progression) */
  isArabic?: boolean;
  /** Optional container style */
  style?: StyleProp<ViewStyle>;
  // Backwards compatibility props
  trailSize?: number;
  maxAge?: number;
  gap?: number;
  decay?: PixelDecay;
  gravity?: number;
  sparkle?: number;
  shine?: number;
  glow?: number;
}

const TOTAL_ROWS = 16;
const TOTAL_COLUMNS = 24;

// ─────────────────────────────────────────────────────────────
// COUNT-DOWN MODE: DIAGONAL & IRREGULAR PROGRESSION
// Origin: Bottom-Left Corner → Destination: Top-Right Corner
// Organic, non-linear edge with colors matching the background gradient
// ─────────────────────────────────────────────────────────────

interface CountdownCell {
  row: number;
  col: number;
  priority: number;
  color: string;
}

const CountdownDiagonalGrid: React.FC<{
  totalColumns: number;
  totalRows: number;
  isArabic: boolean;
  progress: number;
  shapeStyle: any;
}> = ({ totalColumns, totalRows, isArabic, progress, shapeStyle }) => {
  const cellsMatrix = useMemo(() => {
    const matrix: CountdownCell[][] = [];

    for (let r = 0; r < totalRows; r++) {
      const rowCells: CountdownCell[] = [];
      const rFrac = r / Math.max(1, totalRows - 1);
      const yProgress = (totalRows - 1 - r) / Math.max(1, totalRows - 1); // 0 at bottom, 1 at top

      for (let c = 0; c < totalColumns; c++) {
        const cFrac = c / Math.max(1, totalColumns - 1);
        const visualCol = isArabic ? totalColumns - 1 - c : c;
        const xProgress = visualCol / Math.max(1, totalColumns - 1); // 0 at bottom-start, 1 at top-end

        // Base diagonal progression metric from bottom-start (0,0) to top-end (1,1)
        const diagDist = xProgress * 0.52 + yProgress * 0.48;

        // Organic deterministic jitter (-0.075 to +0.075) so the progression moves
        // irregularly and diagonally rather than in rigid lines
        const hash = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
        const jitter = ((hash - Math.floor(hash)) - 0.5) * 0.15;

        const priority = Math.max(0, Math.min(1, diagDist + jitter));

        // Solid dark orange tone matching the card's #e63e00 background without any gradient
        const color = '#e63e00';

        rowCells.push({ row: r, col: c, priority, color });
      }
      matrix.push(rowCells);
    }
    return matrix;
  }, [totalColumns, totalRows, isArabic]);

  const clampedProgress = Math.max(0, Math.min(1, progress || 0));

  return (
    <View pointerEvents="none" style={styles.gridContainer}>
      {cellsMatrix.map((rowCells, rIdx) => (
        <View key={rIdx} style={[styles.gridRow, isArabic && styles.rowRtl]}>
          {rowCells.map((cell) => {
            const isFilled = clampedProgress > 0 && cell.priority <= clampedProgress;
            return (
              <View key={cell.col} style={styles.cellSlot}>
                {isFilled ? (
                  <View
                    style={[
                      styles.filledBrick,
                      shapeStyle,
                      {
                        backgroundColor: cell.color,
                      },
                    ]}
                  />
                ) : (
                  <View style={styles.emptyBrick} />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// COUNT-UP / NON-TIMER MODE: FULL BACKGROUND WAVY MOVEMENT
// Edge-to-edge wave that undulates and disappears across columns
// ─────────────────────────────────────────────────────────────

const BackgroundWaveColumn: React.FC<{
  colIndex: number;
  totalColumns: number;
  totalRows: number;
  isArabic: boolean;
  status: string;
  shapeStyle: any;
  wavePhase: SharedValue<number>;
}> = ({
  colIndex,
  totalColumns,
  totalRows,
  isArabic,
  status,
  shapeStyle,
  wavePhase,
}) => {
  const isRunning = status === 'in_progress';
  const isPaused = status === 'paused';

  const visualIndex = isArabic ? totalColumns - 1 - colIndex : colIndex;
  const colFraction = visualIndex / totalColumns;

  const columnAnimatedStyle = useAnimatedStyle(() => {
    // Traveling wave phase across the columns
    const diff = (wavePhase.value - colFraction + 1) % 1;
    const waveWidth = 0.42;

    let intensity = 0;
    if (diff < waveWidth) {
      intensity = Math.sin((diff / waveWidth) * Math.PI);
    }

    // Smooth emerging and true disappearing effect
    const opacity = (isRunning || isPaused) ? intensity * 0.88 : 0;
    const scale = interpolate(intensity, [0, 1], [0.85, 1.1]);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[styles.bgColumn, columnAnimatedStyle]}>
      {Array.from({ length: totalRows }).map((_, rIdx) => {
        // Solid dark orange matching #e63e00 theme without any gradient
        const brickColor = '#e63e00';

        return (
          <View
            key={rIdx}
            style={[
              styles.bgPixel,
              shapeStyle,
              {
                backgroundColor: brickColor,
                borderColor: 'rgba(255, 255, 255, 0.22)',
                borderWidth: 0.6,
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
};

const BackgroundWaveView: React.FC<{
  totalColumns: number;
  totalRows: number;
  isArabic: boolean;
  status: string;
  shapeStyle: any;
}> = ({ totalColumns, totalRows, isArabic, status, shapeStyle }) => {
  const isRunning = status === 'in_progress';
  const isPaused = status === 'paused';

  const wavePhase = useSharedValue(0);

  useEffect(() => {
    if (isRunning) {
      wavePhase.value = withRepeat(
        withTiming(1, {
          duration: 3800,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else if (isPaused) {
      cancelAnimation(wavePhase);
    } else {
      cancelAnimation(wavePhase);
      wavePhase.value = 0;
    }

    return () => {
      cancelAnimation(wavePhase);
    };
  }, [isRunning, isPaused, wavePhase]);

  return (
    <View pointerEvents="none" style={styles.bgContainer}>
      <View style={[styles.bgRow, isArabic && styles.rowRtl]}>
        {Array.from({ length: totalColumns }).map((_, idx) => (
          <BackgroundWaveColumn
            key={idx}
            colIndex={idx}
            totalColumns={totalColumns}
            totalRows={totalRows}
            isArabic={isArabic}
            status={status}
            shapeStyle={shapeStyle}
            wavePhase={wavePhase}
          />
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN PIXEL TRAIL COMPONENT
// ─────────────────────────────────────────────────────────────

export const PixelTrail: React.FC<PixelTrailProps> = ({
  gridSize = TOTAL_COLUMNS,
  shape = 'square',
  status = 'idle',
  mode = 'count_down',
  progress = 0,
  isArabic = false,
  style,
}) => {
  const shapeStyle = useMemo(() => {
    switch (shape) {
      case 'circle':
        return { borderRadius: 999 };
      case 'diamond':
        return { transform: [{ rotate: '45deg' }] };
      case 'square':
      default:
        return { borderRadius: 2.5 };
    }
  }, [shape]);

  const numColumns = useMemo(() => {
    return Math.max(18, Math.min(28, Math.round(gridSize || TOTAL_COLUMNS)));
  }, [gridSize]);

  // Count-up or non-timer task:
  // Render edge-to-edge rhythmic wavy movement
  if (mode === 'count_up') {
    return (
      <View style={[styles.fill, style]}>
        <BackgroundWaveView
          totalColumns={numColumns}
          totalRows={TOTAL_ROWS}
          isArabic={isArabic}
          status={status}
          shapeStyle={shapeStyle}
        />
      </View>
    );
  }

  // Count-down mode:
  // Render diagonal, irregular bottom-left to top-right progressive brick building
  return (
    <View style={[styles.fill, style]}>
      <CountdownDiagonalGrid
        totalColumns={numColumns}
        totalRows={TOTAL_ROWS}
        isArabic={isArabic}
        progress={progress}
        shapeStyle={shapeStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    padding: 0,
    margin: 0,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },

  // ── Edge-to-Edge Grid Container (Countdown Mode: Zero Outer Spacing) ──
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 0,
    margin: 0,
    justifyContent: 'space-between',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    width: '100%',
    padding: 0,
    margin: 0,
  },
  cellSlot: {
    flex: 1,
    padding: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledBrick: {
    width: '100%',
    height: '100%',
    borderRadius: 2.5,
    borderWidth: 0.6,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  emptyBrick: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },

  // ── Edge-to-Edge Wavy Matrix Container (Count-up / Non-Timer Mode) ──
  bgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 0,
    margin: 0,
  },
  bgRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    padding: 0,
    margin: 0,
  },
  bgColumn: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 1.2,
  },
  bgPixel: {
    flex: 1,
    marginVertical: 1.2,
    borderRadius: 2.5,
  },
});

export default PixelTrail;
