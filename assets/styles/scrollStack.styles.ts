import { ColorScheme } from "@/hooks/useTheme";
import { Platform, StyleSheet, Dimensions } from "react-native";
import { MONTH_PALETTES, MonthPalette } from "@/components/MonthCreditCard";

export type { MonthPalette };

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Reuse the planner's month palettes so the homepage stack feels like the same
// visual system instead of introducing a second set of card colors.
export const STACK_CARD_PALETTES = {
  // Checklist: June's coral month card.
  checklist: MONTH_PALETTES[5],
  // Events: November's ice-cyan month card.
  upcoming: MONTH_PALETTES[10],
  // Monthly overview: October's amber month card.
  monthly: MONTH_PALETTES[9],
  // Productivity: March's mint month card.
  productivity: MONTH_PALETTES[2],
  // Insights: September's lavender month card.
  insights: MONTH_PALETTES[8],
} as const;

export const STACK_CARD_PALETTE_LIST: MonthPalette[] = [
  STACK_CARD_PALETTES.checklist,
  STACK_CARD_PALETTES.upcoming,
  STACK_CARD_PALETTES.monthly,
  STACK_CARD_PALETTES.productivity,
  STACK_CARD_PALETTES.insights,
];

/**
 * Creates full styling tokens for a Month-palette-filled ScrollStack card.
 * Mirrors the planner month-card treatment: the card fills with the month's
 * palette.bg, while text, subtext, chips, rows, borders and footers are
 * tonal overlays of the same palette.ink, and accent fills come from
 * palette.accent — no separate color system.
 */
export const createMonthCardFrame = (
  palette: MonthPalette,
  _isDarkMode?: boolean,
  _colors?: ColorScheme
) => {
  return {
    cardBg: palette.bg,
    cardBorder: `${palette.ink}20`,
    text: palette.ink,
    textMuted: `${palette.ink}A6`,
    badgeBg: `${palette.ink}18`,
    badgeFg: palette.ink,
    pillBg: `${palette.ink}18`,
    pillFg: palette.ink,
    rowBg: `${palette.ink}0E`,
    rowBorder: `${palette.ink}18`,
    accent: palette.accent,
    footerBorder: `${palette.ink}18`,
    footerText: `${palette.ink}CC`,
    ctaBg: palette.ink,
    ctaFg: '#FFFFFF',
  };
};

// Shared ScrollStack card accent system for legacy / fallback uses.
export interface CardAccent {
  pastel: string;
  ink: string;
}

export const CARD_ACCENTS = {
  rose: { pastel: '#F9A8D4', ink: '#9D174D' },
  lime: { pastel: '#e5f19d', ink: '#5E6D0F' },
  mint: { pastel: '#99F6E4', ink: '#115E59' },
  cream: { pastel: '#FCE2A8', ink: '#8A6A2F' },
  lavender: { pastel: '#C7B9FE', ink: '#5B5485' },
  sky: { pastel: '#BAE6FD', ink: '#075985' },
  amber: { pastel: '#FDE68A', ink: '#92400E' },
  urgent: { pastel: '#FCA5A5', ink: '#A11B1B' },
} as const satisfies Record<string, CardAccent>;

export type CardAccentName = keyof typeof CARD_ACCENTS;

export const createCardFrame = (accent: CardAccent, isDarkMode: boolean, solidInk: string) => ({
  fg: isDarkMode ? accent.pastel : accent.ink,
  badgeBg: accent.pastel,
  badgeFg: solidInk,
  pillBg: accent.pastel,
  pillFg: solidInk,
  washBg: isDarkMode ? `${accent.pastel}33` : `${accent.pastel}8C`,
  border: isDarkMode ? `${accent.pastel}4D` : `${accent.ink}59`,
  edge: isDarkMode ? `${accent.pastel}38` : `${accent.pastel}B3`,
});

export const createScrollStackStyles = (colors: ColorScheme, isArabic: boolean = false, isDarkMode: boolean = false) => {
  return StyleSheet.create({
    // Main Container
    container: {
      width: '100%',
      marginTop: 34,
      marginBottom: 10,
    },
    stackContainer: {
      width: '100%',
      height: 336,
      paddingHorizontal: 16,
      position: 'relative',
      justifyContent: 'center',
      overflow: 'visible',
    },
    stackCardWrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      top: 0,
    },
    
    // Card Base (260px)
    card: {
      borderRadius: 24,
      borderWidth: 1,
      padding: 18,
      height: 260,
      justifyContent: 'space-between',
      ...colors.shadows.md,
    },
    cardHeader: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    cardHeaderLeft: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
    },
    cardHeaderRight: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconBadge: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    cardSubtitle: {
      fontSize: 12,
      fontWeight: '500',
    },
    headerPill: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    headerPillText: {
      fontSize: 12,
      fontWeight: '600',
    },

    // Card 1: Checklist Specific Styles
    checklistScrollView: {
      flex: 1,
      marginVertical: 4,
    },
    checklistScrollContent: {
      gap: 6,
      paddingVertical: 2,
    },
    checklistItem: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    checklistItemLeft: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      minWidth: 0,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkItemText: {
      fontSize: 13,
      fontWeight: '600',
    },
    kindDot: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 6,
    },
    kindDotText: {
      fontSize: 10,
      fontWeight: '700',
    },
    checklistAddRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'dashed',
      marginTop: 4,
      marginBottom: 2,
    },
    checklistAddRowText: {
      fontSize: 12,
      fontWeight: '600',
    },
    priorityTag: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 6,
    },
    priorityTagText: {
      fontSize: 11,
      fontWeight: '700',
    },

    // Card 2: Upcoming Events Specific Styles
    eventScrollView: {
      flex: 1,
      marginVertical: 4,
    },
    eventScrollContent: {
      gap: 6,
      paddingVertical: 2,
    },
    eventRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      gap: 10,
    },
    eventTimeChip: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      flexShrink: 0,
    },
    eventTimeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    eventInfo: {
      flex: 1,
      gap: 2,
    },
    eventTitle: {
      fontSize: 13,
      fontWeight: '600',
    },
    eventMeta: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 1,
    },
    eventMetaText: {
      fontSize: 11,
      fontWeight: '500',
    },

    // Card 3: Monthly Overview Specific Styles
    monthlyStatsGrid: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      marginVertical: 10,
    },
    monthlyStatItem: {
      flex: 1,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: isArabic ? 'flex-end' : 'flex-start',
    },
    monthlyStatNumber: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    monthlyStatLabel: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
      marginBottom: 6,
    },
    monthlyProgressBarContainer: {
      width: '100%',
      height: 5,
      borderRadius: 3,
      overflow: 'hidden',
    },
    monthlyProgressBarFill: {
      height: '100%',
      borderRadius: 3,
    },

    // Card 4: Productivity & Focus Specific Styles
    productivityRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 10,
    },
    streakCard: {
      flex: 1,
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
    },
    streakIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    streakNumber: {
      fontSize: 20,
      fontWeight: '800',
    },
    streakLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    focusActionBtn: {
      flex: 1,
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 54,
      borderRadius: 14,
      paddingHorizontal: 12,
      ...colors.shadows.sm,
    },
    focusActionBtnText: {
      fontSize: 13,
      fontWeight: '700',
    },

    // Empty States inside Cards
    emptyCardContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    emptyCardTitle: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    emptyCardBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 4,
    },
    emptyCardBtnText: {
      fontSize: 12,
      fontWeight: '600',
    },

    // Card Common Footer
    cardFooter: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      paddingTop: 10,
      marginTop: 6,
    },
    footerActionBtn: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
    },
    footerActionText: {
      fontSize: 12,
      fontWeight: '600',
    },
    footerHintText: {
      fontSize: 12,
      fontWeight: '700',
    },

    // Pagination Dots & Indicators
    paginationRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 24,
    },
    paginationDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    paginationDotActive: {
      width: 22,
      borderRadius: 5,
    },

    // Event Management Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      borderTopWidth: 1,
      borderColor: colors.border,
      maxHeight: '90%',
    },
    modalDragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 16,
    },
    modalHeader: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.3,
    },
    modalForm: {
      gap: 14,
    },
    modalInputGroup: {
      gap: 6,
      alignItems: isArabic ? 'flex-end' : 'flex-start',
    },
    modalInputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    modalTextInput: {
      width: '100%',
      backgroundColor: isDarkMode ? '#1E202E' : '#F8FAFC',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      textAlign: isArabic ? 'right' : 'left',
    },
    modalTypeRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      gap: 8,
      width: '100%',
    },
    modalTypeChip: {
      flex: 1,
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDarkMode ? '#1E202E' : '#F8FAFC',
    },
    modalTypeChipActive: {
      borderColor: colors.secondary,
      backgroundColor: `${colors.secondary}1F`,
    },
    modalTypeChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    modalTypeChipTextActive: {
      color: colors.text,
    },
    modalNotesInput: {
      width: '100%',
      minHeight: 84,
      backgroundColor: isDarkMode ? '#1E202E' : '#F8FAFC',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      textAlign: isArabic ? 'right' : 'left',
      textAlignVertical: 'top',
    },
    modalTimeRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      gap: 12,
      width: '100%',
    },
    modalTimeBox: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1E202E' : '#F8FAFC',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTimeBoxText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    modalActionRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      gap: 12,
      marginTop: 20,
    },
    modalSaveBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      ...colors.shadows.sm,
    },
    modalSaveBtnText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primaryText,
    },
    modalDeleteBtn: {
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(194, 43, 60, 0.08)',
      borderRadius: 16,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(194, 43, 60, 0.30)',
    },

    // Checklist Item Modal
    itemKindBadge: {
      width: 30,
      height: 30,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    linkRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    linkRowText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      textAlign: isArabic ? 'right' : 'left',
    },
    taskPickerBox: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      gap: 10,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    },
    taskPickerHint: {
      fontSize: 11.5,
      fontWeight: '500',
      textAlign: isArabic ? 'right' : 'left',
    },
    taskSearchInput: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 13.5,
      backgroundColor: isDarkMode ? '#1E202E' : '#F8FAFC',
    },
    taskPickerRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 9,
    },
    linkedTaskRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    },
  });
};

export default createScrollStackStyles;
