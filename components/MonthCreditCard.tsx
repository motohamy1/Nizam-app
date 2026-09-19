import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import LivePress from '@/components/LivePress';

export const CARD_H = 260;

export interface MonthPalette {
  bg: string;
  ink: string;
  accent: string;
  accentSecondary?: string;
  graphicType: 'halfCircles' | 'sunRays' | 'stripes' | 'rings' | 'waves' | 'dualDiscs' | 'curves' | 'bauhaus';
}

// 12 curated vibrant & pastel card palettes with unique geometric art
export const MONTH_PALETTES: MonthPalette[] = [
  // 0: Jan - Cream & Warm Coral
  { bg: '#EDE8DB', ink: '#1E1B18', accent: '#EA580C', accentSecondary: '#C2410C', graphicType: 'halfCircles' },
  // 1: Feb - Lemon Yellow & Cobalt
  { bg: '#FDE047', ink: '#1C1917', accent: '#2563EB', accentSecondary: '#EAB308', graphicType: 'sunRays' },
  // 2: Mar - Sage Mint & Forest Green
  { bg: '#86EFAC', ink: '#052E16', accent: '#15803D', accentSecondary: '#166534', graphicType: 'stripes' },
  // 3: Apr - Lavender & Indigo Rings
  { bg: '#C7D2FE', ink: '#1E1B4B', accent: '#4F46E5', accentSecondary: '#4338CA', graphicType: 'rings' },
  // 4: May - Platinum Grey & Slate
  { bg: '#E2E8F0', ink: '#0F172A', accent: '#334155', accentSecondary: '#64748B', graphicType: 'bauhaus' },
  // 5: Jun - Coral Red & Rose Discs
  { bg: '#FDA4AF', ink: '#4C0519', accent: '#E11D48', accentSecondary: '#BE123C', graphicType: 'dualDiscs' },
  // 6: Jul - Slate Charcoal & Cyan Neon
  { bg: '#334155', ink: '#F8FAFC', accent: '#38BDF8', accentSecondary: '#0284C7', graphicType: 'curves' },
  // 7: Aug - Vibrant Emerald & Jade Waves
  { bg: '#6EE7B7', ink: '#022C22', accent: '#059669', accentSecondary: '#047857', graphicType: 'waves' },
  // 8: Sep - Electric Purple & Orchid
  { bg: '#DDD6FE', ink: '#2E1065', accent: '#7C3AED', accentSecondary: '#9333EA', graphicType: 'dualDiscs' },
  // 9: Oct - Sunset Amber & Terracotta
  { bg: '#FED7AA', ink: '#451A03', accent: '#D97706', accentSecondary: '#B45309', graphicType: 'sunRays' },
  // 10: Nov - Ice Cyan & Deep Ocean
  { bg: '#BAE6FD', ink: '#082F49', accent: '#0284C7', accentSecondary: '#0369A1', graphicType: 'halfCircles' },
  // 11: Dec - Hot Berry & Crimson
  { bg: '#FBCFE8', ink: '#500724', accent: '#DB2777', accentSecondary: '#BE185D', graphicType: 'bauhaus' },
];

export const getMonthPalette = (index: number): MonthPalette =>
  MONTH_PALETTES[index % MONTH_PALETTES.length];

/**
 * Shared Bauhaus-style artwork renderer for any palette (month or year cards).
 * Drawn centered inside the card, purely decorative (pointerEvents none).
 */
export const renderPaletteArtwork = (palette: MonthPalette) => {
  const { graphicType, accent, accentSecondary, ink, bg } = palette;
  const secColor = accentSecondary || accent;

  switch (graphicType) {
    case 'halfCircles':
      return (
        <Svg width={230} height={140} viewBox="0 0 230 140" fill="none">
          <Path d="M 50 15 A 55 55 0 0 0 50 125 Z" fill={accent} opacity={0.9} />
          <Path d="M 115 15 A 55 55 0 0 0 115 125 Z" fill={accent} opacity={0.9} />
          <Circle cx={175} cy={70} r={52} fill={secColor} opacity={0.95} />
          <Circle cx={175} cy={70} r={20} fill={bg} opacity={0.9} />
        </Svg>
      );

    case 'sunRays':
      return (
        <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
          <Circle cx={110} cy={65} r={46} fill={accent} opacity={0.3} />
          <Circle cx={110} cy={65} r={28} fill={accent} opacity={0.85} />
          <Path
            d="M 110 5 L 110 20 M 110 110 L 110 125 M 50 65 L 65 65 M 155 65 L 170 65 M 68 23 L 78 33 M 142 97 L 152 107 M 68 107 L 78 97 M 142 33 L 152 23"
            stroke={ink}
            strokeWidth={3.5}
            strokeLinecap="round"
            opacity={0.4}
          />
        </Svg>
      );

    case 'stripes':
      return (
        <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
          <G opacity={0.45}>
            <Path d="M 30 20 Q 80 5 130 20 T 210 20" stroke={accent} strokeWidth={5} strokeLinecap="round" />
            <Path d="M 30 40 Q 80 25 130 40 T 210 40" stroke={accent} strokeWidth={5} strokeLinecap="round" />
            <Path d="M 30 60 Q 80 45 130 60 T 210 60" stroke={accent} strokeWidth={5} strokeLinecap="round" />
            <Path d="M 30 80 Q 80 65 130 80 T 210 80" stroke={accent} strokeWidth={5} strokeLinecap="round" />
            <Path d="M 30 100 Q 80 85 130 100 T 210 100" stroke={accent} strokeWidth={5} strokeLinecap="round" />
          </G>
          <Circle cx={175} cy={65} r={32} fill={secColor} opacity={0.7} />
        </Svg>
      );

    case 'rings':
      return (
        <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
          <Circle cx={110} cy={65} r={58} stroke={accent} strokeWidth={3} opacity={0.25} />
          <Circle cx={110} cy={65} r={42} stroke={accent} strokeWidth={5} opacity={0.45} />
          <Circle cx={110} cy={65} r={24} fill={accent} opacity={0.88} />
          <Circle cx={110} cy={65} r={10} fill={bg} />
        </Svg>
      );

    case 'dualDiscs':
      return (
        <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
          <Circle cx={85} cy={65} r={48} fill={accent} opacity={0.85} />
          <Circle cx={135} cy={65} r={48} fill={secColor} opacity={0.75} />
        </Svg>
      );

    case 'curves':
    case 'waves':
      return (
        <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
          <Path
            d="M 10 95 Q 60 20 110 65 T 210 35"
            stroke={accent}
            strokeWidth={18}
            strokeLinecap="round"
            opacity={0.85}
          />
          <Circle cx={165} cy={85} r={24} fill={secColor} opacity={0.65} />
        </Svg>
      );

    case 'bauhaus':
    default:
      return (
        <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
          <Rect x={40} y={25} width={65} height={65} rx={14} fill={accent} opacity={0.85} />
          <Circle cx={150} cy={60} r={34} fill={secColor} opacity={0.75} />
          <Path d="M 95 70 L 165 70" stroke={ink} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
        </Svg>
      );
  }
};

interface MonthCreditCardProps {
  month: string;
  monthIndex: number;
  year: number;
  taskCount: number;
  completionRate?: number; // 0 to 100
  isFocused?: boolean;
  isCurrent: boolean;
  isPrevious?: boolean;
  isArabic?: boolean;
  palette: MonthPalette;
  currentLabel?: string;
  tasksLabel: string;
  emptyLabel: string;
  onPress: () => void;
}

const MonthCreditCard: React.FC<MonthCreditCardProps> = ({
  month,
  monthIndex,
  year,
  taskCount,
  completionRate = 0,
  isFocused = false,
  isCurrent,
  isPrevious = false,
  isArabic = false,
  palette,
  currentLabel,
  tasksLabel,
  emptyLabel,
  onPress,
}) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return (
    <View style={styles.cardContainer}>
      <LivePress
        style={[
          styles.cardBody,
          { backgroundColor: palette.bg },
          isFocused ? styles.cardFocusedShadow : styles.cardStackedShadow,
        ]}
        activeOpacity={0.92}
        onPress={onPress}
      >
        {/* ─── Abstract Center Artwork ─────────────────────────────── */}
        <View style={styles.artworkContainer} pointerEvents="none">
          {renderPaletteArtwork(palette)}
        </View>

        {/* ─── Top Row ────────────────────────────────────────────── */}
        {isPrevious ? (
          <View style={[styles.topHeaderRow, isArabic && styles.rowReverse]}>
            <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={[styles.largeStatNumber, { color: palette.ink, fontSize: 18, lineHeight: 20 }]}>
                {taskCount > 0 ? String(taskCount) : '0'}
              </Text>
              <Text style={[styles.largeStatUnit, { color: palette.ink, fontSize: 11 }]}>
                {taskCount === 1 ? (isArabic ? 'مهمة' : 'Task') : (isArabic ? 'مهام' : 'Tasks')}
              </Text>
            </View>
            <View style={[styles.yearMiniPill, { backgroundColor: palette.ink + '18' }]}>
              <Text style={[styles.yearMiniPillText, { color: palette.ink }]}>{year}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.topHeaderRow, isArabic && styles.rowReverse]}>
            <View style={styles.monthHeaderLeft}>
              <Text style={[styles.monthTitleText, { color: palette.ink }]} numberOfLines={1}>
                {month}
              </Text>
              {isCurrent && currentLabel ? (
                <View style={[styles.currentIndicatorPill, { backgroundColor: palette.ink + '20' }]}>
                  <View style={[styles.currentDot, { backgroundColor: palette.accent }]} />
                  <Text style={[styles.currentIndicatorText, { color: palette.ink }]}>
                    {currentLabel}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Planner Days Badge on Top Right */}
            <View style={[styles.plannerBadge, { backgroundColor: palette.ink + '18' }, isArabic && styles.rowReverse]}>
              <Ionicons name="calendar-outline" size={13} color={palette.ink} style={{ opacity: 0.9 }} />
              <Text style={[styles.plannerBadgeText, { color: palette.ink }]}>
                {daysInMonth} {isArabic ? 'يوم' : 'Days'}
              </Text>
            </View>
          </View>
        )}

        {/* ─── Bottom Row ─────────────────────────────────────────── */}
        {isPrevious ? (
          <View style={[styles.bottomTitleRow, isArabic && styles.rowReverse]}>
            <View style={styles.monthHeaderLeft}>
              <Text style={[styles.monthTitleText, { color: palette.ink }]} numberOfLines={1}>
                {month}
              </Text>
              {isCurrent && currentLabel ? (
                <View style={[styles.currentIndicatorPill, { backgroundColor: palette.ink + '20' }]}>
                  <View style={[styles.currentDot, { backgroundColor: palette.accent }]} />
                  <Text style={[styles.currentIndicatorText, { color: palette.ink }]}>
                    {currentLabel}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Planner Days Badge on Bottom Right */}
            <View style={[styles.plannerBadge, { backgroundColor: palette.ink + '18' }, isArabic && styles.rowReverse]}>
              <Ionicons name="calendar-outline" size={13} color={palette.ink} style={{ opacity: 0.9 }} />
              <Text style={[styles.plannerBadgeText, { color: palette.ink }]}>
                {daysInMonth} {isArabic ? 'يوم' : 'Days'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.bottomStatRow, isArabic && styles.rowReverse]}>
            <View>
              <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={[styles.largeStatNumber, { color: palette.ink }]}>
                  {taskCount > 0 ? String(taskCount) : '0'}
                </Text>
                <Text style={[styles.largeStatUnit, { color: palette.ink }]}>
                  {taskCount === 1 ? (isArabic ? 'مهمة' : 'Task') : (isArabic ? 'مهام' : 'Tasks')}
                </Text>
              </View>
              <Text style={[styles.statSubtitleText, { color: palette.ink }]} numberOfLines={1}>
                {taskCount > 0 ? (completionRate > 0 ? `${completionRate}% ${isArabic ? 'مكتمل' : 'completed'}` : tasksLabel) : emptyLabel}
              </Text>
            </View>

            {/* Year Badge on Bottom Right */}
            <View style={[styles.yearMiniPill, { backgroundColor: palette.ink + '18' }]}>
              <Text style={[styles.yearMiniPillText, { color: palette.ink }]}>{year}</Text>
            </View>
          </View>
        )}
      </LivePress>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: CARD_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    width: '100%',
    height: CARD_H,
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardFocusedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.32,
        shadowRadius: 18,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cardStackedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  artworkContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    height: 38,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  monthHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitleText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  currentIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  currentIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  plannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  plannerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bottomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    height: 38,
  },
  bottomStatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  largeStatNumber: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 32,
  },
  largeStatUnit: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.85,
  },
  statSubtitleText: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.8,
    marginTop: 2,
    maxWidth: 170,
  },
  yearMiniPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 2,
  },
  yearMiniPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    opacity: 0.9,
  },
});

export default MonthCreditCard;
