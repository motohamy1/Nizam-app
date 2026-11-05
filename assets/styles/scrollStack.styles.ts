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
 * Background matches the tasks card background color (#FF9470) completely.
 * Action buttons, items, and icon colors are set to violet/purple only.
 */
export const createMonthCardFrame = (
  _palette?: MonthPalette,
  _isDarkMode: boolean = false,
  _colors?: ColorScheme
) => {
  const surfaceDark = '#1C0A2A'; // deep royal obsidian violet
  const surfaceBorder = 'rgba(201, 166, 242, 0.25)';
  const violetPrimary = '#A855F7'; // vibrant violet/purple
  const violetActive = '#C084FC';
  const violetLight = 'rgba(168, 85, 247, 0.18)';
  const violetBorder = 'rgba(168, 85, 247, 0.35)';

  return {
    cardBg: surfaceDark,
    gradTop: '#240E36',
    gradBottom: surfaceDark,
    cardBorder: surfaceBorder,
    text: '#FFFFFF',
    textMuted: 'rgba(255, 255, 255, 0.70)',
    badgeBg: violetLight,
    badgeFg: '#E9D5FF',
    pillBg: violetLight,
    pillFg: '#E9D5FF',
    rowBg: 'rgba(255, 255, 255, 0.07)', // clean frosted layer over deep violet
    rowBorder: 'rgba(255, 255, 255, 0.12)',
    accent: violetPrimary,
    accentSecondary: violetActive,
    footerBorder: surfaceBorder,
    footerText: '#E9D5FF',
    ctaBg: violetPrimary,
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
    
    // Card Base
    card: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: 'rgba(201, 166, 242, 0.25)',
      paddingHorizontal: 12,
      paddingVertical: 12,
      justifyContent: 'flex-start',
      backgroundColor: '#1C0A2A',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
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
    checklistScroll: {
      maxHeight: 180,
      marginVertical: 4,
    },
    checklistItem: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checklistText: {
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    checklistStats: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingTop: 8,
      marginTop: 4,
    },
    checklistStatsText: {
      fontSize: 11,
      fontWeight: '700',
    },

    // Card 2: Upcoming Events Specific Styles
    eventScrollView: {
      maxHeight: 200,
    },
    eventScrollContent: {
      gap: 8,
    },
    eventRow: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 10,
      gap: 6,
    },
    eventRowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    eventRowHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    eventRowHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    eventTimeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    eventTimeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    eventTypeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    eventTypeBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    eventCheckCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventBody: {
      gap: 4,
    },
    eventTitle: {
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 18,
    },
    eventMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    eventMetaText: {
      fontSize: 11,
      fontWeight: '500',
    },
    eventFooterMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 2,
    },
    eventMetaTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    eventMetaTagText: {
      fontSize: 10.5,
      fontWeight: '500',
    },
    emptyCardContent: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      gap: 8,
    },
    emptyCardTitle: {
      fontSize: 13,
      fontWeight: '700',
    },
    emptyCardBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      marginTop: 4,
    },
    emptyCardBtnText: {
      fontSize: 12,
      fontWeight: '700',
    },

    // Card 3: Monthly Overview Specific Styles
    monthlyStatsGrid: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      gap: 8,
      marginVertical: 4,
    },
    monthlyStatItem: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 14,
      padding: 10,
      gap: 4,
    },
    monthlyStatNumber: {
      fontSize: 20,
      fontWeight: '900',
    },
    monthlyStatLabel: {
      fontSize: 10.5,
      fontWeight: '600',
    },
    monthlyProgressBarContainer: {
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 4,
    },
    monthlyProgressBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    monthlyFooter: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingTop: 8,
      marginTop: 4,
    },
    monthlyFooterText: {
      fontSize: 11,
      fontWeight: '700',
    },

    // Card 4: AI Insights Specific Styles
    metricsRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      gap: 6,
      marginVertical: 4,
    },
    metricPill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 12,
      gap: 2,
    },
    miniDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      marginBottom: 2,
    },
    metricVal: {
      fontSize: 13,
      fontWeight: '800',
    },
    metricLbl: {
      fontSize: 9.5,
      fontWeight: '600',
      textAlign: 'center',
    },
    quoteRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 10,
      marginVertical: 2,
    },
    quoteText: {
      fontSize: 11,
      fontWeight: '600',
      flex: 1,
    },
    insightsFooter: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingTop: 8,
      marginTop: 4,
    },
    insightsFooterText: {
      fontSize: 11,
      fontWeight: '700',
    },

    // Feature Modals & Form Sheets (Matching task card #FF9470 with violet accents and NO dark overlay)
    modalOverlay: {
      flex: 1,
      backgroundColor: 'transparent', // No dark layer covering upper screen
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#1C0A2A', // Deep royal obsidian violet contrasting against task cards
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      borderTopWidth: 1.5,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: 'rgba(201, 166, 242, 0.25)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 20,
      maxHeight: '90%',
    },
    modalDragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
      alignSelf: 'center',
      marginBottom: 16,
    },
    modalHeader: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 19,
      fontWeight: '800',
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
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.85)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    modalTextInput: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.16)',
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
      borderColor: 'rgba(168, 85, 247, 0.30)',
      backgroundColor: 'rgba(168, 85, 247, 0.15)',
    },
    modalTypeChipActive: {
      borderColor: '#A855F7',
      backgroundColor: '#A855F7',
    },
    modalTypeChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#E9D5FF',
    },
    modalTypeChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    modalNotesInput: {
      width: '100%',
      minHeight: 84,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.16)',
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
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.16)',
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
      backgroundColor: '#6D28D9', // Violet/purple action button
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    modalSaveBtnText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
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
      borderColor: 'rgba(109, 40, 217, 0.22)',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
    },
    linkRowText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: '#4C1D95',
      textAlign: isArabic ? 'right' : 'left',
    },
    taskPickerBox: {
      borderWidth: 1,
      borderColor: 'rgba(109, 40, 217, 0.22)',
      borderRadius: 14,
      padding: 12,
      gap: 10,
      backgroundColor: 'rgba(109, 40, 217, 0.08)',
    },
    taskPickerHint: {
      fontSize: 11.5,
      fontWeight: '500',
      color: 'rgba(76, 29, 149, 0.75)',
      textAlign: isArabic ? 'right' : 'left',
    },
    taskSearchInput: {
      borderWidth: 1,
      borderColor: 'rgba(109, 40, 217, 0.22)',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 13.5,
      color: '#4C1D95',
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
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
      borderColor: 'rgba(109, 40, 217, 0.22)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
    },
  });
};

export default createScrollStackStyles;
