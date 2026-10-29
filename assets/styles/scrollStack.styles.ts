import { ColorScheme } from "@/hooks/useTheme";
import { Platform, StyleSheet, Dimensions } from "react-native";
import { MONTH_PALETTES, MonthPalette } from "@/components/MonthCreditCard";

export type { MonthPalette };

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Reuse the planner's month palettes so the homepage stack feels like the same
// visual system instead of introducing a second set of card colors.
export const STACK_CARD_PALETTES = {
  // Checklist: Vibrant Electric Orange card matching Stitch design (#ff5c16)
  checklist: {
    bg: '#ff5c16',
    ink: '#101116',
    accent: '#ff5c16',
    accentSecondary: '#e04705',
    graphicType: 'dualDiscs',
  } satisfies MonthPalette,
  // Upcoming Events: Emerald Green (#10b981) - left peeking card
  upcoming: {
    bg: '#10b981',
    ink: '#064e3b',
    accent: '#059669',
    accentSecondary: '#047857',
    graphicType: 'dualDiscs',
  } satisfies MonthPalette,
  // Monthly Overview: Deep Purple (#8e3eff) - right peeking card
  monthly: {
    bg: '#8e3eff',
    ink: '#2e1065',
    accent: '#7c3aed',
    accentSecondary: '#6d28d9',
    graphicType: 'dualDiscs',
  } satisfies MonthPalette,
  // Productivity & Focus: Neon Lime (#d4ff32)
  productivity: {
    bg: '#d4ff32',
    ink: '#1c1c1e',
    accent: '#a3e635',
    accentSecondary: '#84cc16',
    graphicType: 'dualDiscs',
  } satisfies MonthPalette,
  // AI Insights: Vibrant Sky Blue / Lavender
  insights: {
    bg: '#38bdf8',
    ink: '#0c4a6e',
    accent: '#0284c7',
    accentSecondary: '#0369a1',
    graphicType: 'dualDiscs',
  } satisfies MonthPalette,
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
  _palette?: MonthPalette,
  _isDarkMode: boolean = false,
  _colors?: ColorScheme
) => {
  // All homepage cards inside FeatureSheet use the page's two signature colors:
  // Royal purple (#1C0A2A / #8E2CAC) and coral peach (#FF9470).
  return {
    cardBg: '#1C0A2A',
    gradTop: '#290E3D',
    gradBottom: '#170623',
    cardBorder: '#8E2CAC', // upper widget signature purple
    text: '#FFFFFF',
    textMuted: 'rgba(255, 255, 255, 0.70)',
    badgeBg: 'rgba(142, 44, 172, 0.30)', // purple badge bg
    badgeFg: '#FF9470', // coral peach foreground
    pillBg: 'rgba(255, 148, 112, 0.16)', // coral peach tint pill
    pillFg: '#FF9470',
    rowBg: 'rgba(142, 44, 172, 0.14)', // purple tint row background
    rowBorder: 'rgba(142, 44, 172, 0.30)', // purple tint row border
    accent: '#FF9470', // signature coral peach accent
    accentSecondary: '#8E2CAC', // signature purple
    footerBorder: 'rgba(142, 44, 172, 0.25)',
    footerText: 'rgba(255, 255, 255, 0.88)',
    ctaBg: '#FF9470',
    ctaFg: '#14081E',
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
      marginTop: 4,
      marginBottom: 5,
    },
    stackContainer: {
      width: '100%',
      height: 276,
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
    categoryTagsRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 6,
      marginBottom: 3,
    },
    categoryTagLeft: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: isDarkMode ? '#a1a1aa' : '#71717a',
      textTransform: 'uppercase',
    },
    categoryTagDot: {
      fontSize: 10,
      fontWeight: '900',
      color: isDarkMode ? '#71717a' : '#a1a1aa',
    },
    categoryTagRight: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: '#10b981',
      textTransform: 'uppercase',
    },
    
    // Card Base (270px, Stitch rounded-[32px])
    card: {
      borderRadius: 32,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 14,
      // The card fills the box it is placed in, so the same card can sit in
      // the home page stack (a fixed 270pt box) and keep its own size
      // anywhere else.
      height: '100%',
      minHeight: 270,
      justifyContent: 'space-between',
      // Tight, directional shadow tinted to royal purple
      shadowColor: '#8E2CAC',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDarkMode ? 0.28 : 0.18,
      shadowRadius: 10,
      elevation: 6,
    },
    cardHeader: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 8,
      width: '100%',
    },
    cardHeaderLeft: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    cardHeaderRight: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    cardSubtitle: {
      fontSize: 11.5,
      fontWeight: '600',
    },
    headerPill: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 16,
      flexShrink: 0,
    },
    headerPillText: {
      fontSize: 11.5,
      fontWeight: '800',
      lineHeight: 14,
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

    // Card 2: Upcoming Reminders Specific Styles
    upcomingScrollView: {
      flex: 1,
      marginVertical: 4,
    },
    upcomingScrollContent: {
      gap: 6,
      paddingVertical: 2,
    },
    upcomingItem: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    upcomingItemLeft: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      minWidth: 0,
    },
    upcomingIconBadge: {
      width: 24,
      height: 24,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    upcomingDetails: {
      flex: 1,
      minWidth: 0,
    },
    upcomingTitle: {
      fontSize: 13,
      fontWeight: '600',
    },
    upcomingTime: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
    },
    upcomingTypeTag: {
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 6,
      marginLeft: 6,
    },
    upcomingTypeTagText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'capitalize',
    },

    // UpcomingEventsCard dynamic rows
    eventScrollView: {
      flex: 1,
      marginVertical: 4,
    },
    eventScrollContent: {
      gap: 8,
      paddingVertical: 2,
    },
    eventRow: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 10,
      gap: 6,
      marginVertical: 2,
    },
    eventRowHeader: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    eventRowHeaderLeft: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    eventRowHeaderRight: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
    },
    eventTimeChip: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    eventTimeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    eventTypeBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    },
    eventTypeBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    eventCheckCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventBody: {
      gap: 4,
    },
    eventTitle: {
      fontSize: 13.5,
      fontWeight: '700',
    },
    eventMeta: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
    },
    eventMetaText: {
      fontSize: 11.5,
      fontWeight: '500',
    },
    eventFooterMeta: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 2,
    },
    eventMetaTag: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 6,
    },
    eventMetaTagText: {
      fontSize: 10.5,
      fontWeight: '600',
    },

    // Card 3: Monthly Overview Specific Styles
    monthlyOverviewGrid: {
      flex: 1,
      justifyContent: 'center',
      gap: 10,
      marginVertical: 4,
    },
    monthlyStatsGrid: {
      flex: 1,
      justifyContent: 'center',
      gap: 10,
      marginVertical: 4,
    },
    monthlyStatRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      gap: 8,
    },
    monthlyStatItem: {
      flex: 1,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'space-between',
    },
    monthlyStatNumber: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    monthlyStatLabel: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
    monthlyProgressBarContainer: {
      height: 4,
      borderRadius: 2,
      marginTop: 8,
      overflow: 'hidden',
    },
    monthlyProgressBarFill: {
      height: '100%',
      borderRadius: 2,
    },

    // Card 4: Focus & Streak Specific Styles
    productivityRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      marginVertical: 4,
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
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    focusCenterContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 4,
    },
    focusStatsRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      width: '100%',
    },
    focusStreakBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
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

    // Event Management Modal & Feature Modals (Unified purple & #FF9470 styling)
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#1C0A2A',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      borderTopWidth: 2,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: '#8E2CAC',
      maxHeight: '90%',
    },
    modalDragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#FF9470',
      opacity: 0.85,
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
      color: '#FFFFFF',
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
      color: 'rgba(255, 255, 255, 0.70)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    modalTextInput: {
      width: '100%',
      backgroundColor: 'rgba(142, 44, 172, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(142, 44, 172, 0.35)',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: '#FFFFFF',
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
      borderColor: 'rgba(142, 44, 172, 0.35)',
      backgroundColor: 'rgba(142, 44, 172, 0.12)',
    },
    modalTypeChipActive: {
      borderColor: '#FF9470',
      backgroundColor: 'rgba(255, 148, 112, 0.22)',
    },
    modalTypeChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.65)',
    },
    modalTypeChipTextActive: {
      color: '#FF9470',
      fontWeight: '800',
    },
    modalNotesInput: {
      width: '100%',
      minHeight: 84,
      backgroundColor: 'rgba(142, 44, 172, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(142, 44, 172, 0.35)',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: '#FFFFFF',
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
      backgroundColor: 'rgba(142, 44, 172, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(142, 44, 172, 0.35)',
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
      color: '#FFFFFF',
    },
    modalActionRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      gap: 12,
      marginTop: 20,
    },
    modalSaveBtn: {
      flex: 1,
      backgroundColor: '#FF9470',
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#FF9470',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    modalSaveBtnText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#14081E',
    },
    modalDeleteBtn: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderRadius: 16,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.35)',
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
      borderColor: 'rgba(142, 44, 172, 0.35)',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: 'rgba(142, 44, 172, 0.12)',
    },
    linkRowText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: isArabic ? 'right' : 'left',
    },
    taskPickerBox: {
      borderWidth: 1,
      borderColor: 'rgba(142, 44, 172, 0.35)',
      borderRadius: 14,
      padding: 12,
      gap: 10,
      backgroundColor: 'rgba(142, 44, 172, 0.08)',
    },
    taskPickerHint: {
      fontSize: 11.5,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.65)',
      textAlign: isArabic ? 'right' : 'left',
    },
    taskSearchInput: {
      borderWidth: 1,
      borderColor: 'rgba(142, 44, 172, 0.35)',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 13.5,
      color: '#FFFFFF',
      backgroundColor: 'rgba(142, 44, 172, 0.12)',
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
      borderColor: 'rgba(142, 44, 172, 0.35)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: 'rgba(142, 44, 172, 0.12)',
    },
  });
};

export default createScrollStackStyles;
