import { ColorScheme } from "@/hooks/useTheme";
import { Platform, StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Shared ScrollStack card accent system.
// Each accent is a pair: a VIVID light tint (bright, colorful, 8:1+ WCAG on
// the dark card surface #181922) and a deep INK of the same hue (for light
// surfaces). Tints are used as solid gem fills and as text/icons on dark;
// inks are used for text/icons and washes on light. Hues are spread ~60-90
// deg apart so sibling cards never collide.
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

// solidInk = near-black used for marks on solid pastel fills (badges, pills,
// checkboxes) — always high contrast in both modes.
export const createCardFrame = (accent: CardAccent, isDarkMode: boolean, solidInk: string) => ({
  // text/icons sitting directly on the card surface
  fg: isDarkMode ? accent.pastel : accent.ink,
  // solid gem chip: same treatment in both modes, it is the card's signature
  badgeBg: accent.pastel,
  badgeFg: solidInk,
  pillBg: accent.pastel,
  pillFg: solidInk,
  // translucent tint for chips/rows/banners
  washBg: isDarkMode ? `${accent.pastel}33` : `${accent.pastel}8C`,
  // hairline accents: chip borders and the card edge tint
  border: isDarkMode ? `${accent.pastel}4D` : `${accent.ink}59`,
  edge: isDarkMode ? `${accent.pastel}38` : `${accent.pastel}B3`,
});

export const createScrollStackStyles = (colors: ColorScheme, isArabic: boolean = false, isDarkMode: boolean = false) => {
  return StyleSheet.create({
    // Main Container
    container: {
      width: '100%',
      marginVertical: 10,
    },
    stackContainer: {
      width: '100%',
      height: 295,
      paddingHorizontal: 16,
      position: 'relative',
    },
    stackCardWrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      top: 0,
    },
    
    // Card Base (20% increase: 215 -> 260px)
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
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
      color: colors.text,
      letterSpacing: -0.3,
    },
    cardSubtitle: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textMuted,
    },
    headerPill: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    },
    headerPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },

    // Card 1: Checklist Card
    checklistScrollView: {
      flex: 1,
      maxHeight: 155,
      marginVertical: 4,
    },
    checklistScrollContent: {
      gap: 8,
      paddingBottom: 4,
    },
    checklistContent: {
      flex: 1,
      justifyContent: 'center',
      gap: 8,
      marginVertical: 4,
    },
    checklistItem: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    checklistItemLeft: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: colors.textMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    checkItemText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: isArabic ? 'right' : 'left',
    },
    checkItemTextDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
      fontWeight: '400',
    },
    priorityTag: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    },
    priorityTagText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    checklistAddRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 7,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.14)',
      marginBottom: 2,
    },
    checklistAddRowText: {
      fontSize: 12.5,
      fontWeight: '700',
    },
    kindDot: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 7,
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 3,
    },
    kindDotText: {
      fontSize: 10,
      fontWeight: '700',
    },
    cardFooter: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      marginTop: 'auto',
      height: 36,
    },
    footerActionBtn: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
    },
    footerActionText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },
    footerHintText: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.primary,
    },

    // Card 2: Upcoming Events
    eventScrollView: {
      flex: 1,
      maxHeight: 155,
      marginVertical: 4,
    },
    eventScrollContent: {
      gap: 8,
      paddingBottom: 4,
    },
    eventList: {
      flex: 1,
      gap: 8,
      marginVertical: 4,
    },
    eventRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderRadius: 14,
      padding: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    eventTimeChip: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDarkMode ? 'rgba(142, 167, 233, 0.15)' : 'rgba(92, 107, 192, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 10,
    },
    eventTimeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    eventInfo: {
      flex: 1,
      minWidth: 0,
      marginHorizontal: 8,
      justifyContent: 'center',
    },
    eventTitle: {
      fontSize: 13.5,
      fontWeight: '600',
      color: colors.text,
      textAlign: isArabic ? 'right' : 'left',
      flex: 1,
      flexShrink: 1,
    },
    eventMeta: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
      minWidth: 0,
    },
    eventMetaText: {
      fontSize: 11,
      color: colors.textMuted,
    },

    // Card 3: Monthly Overview
    monthlyStatsGrid: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      marginVertical: 6,
    },
    monthlyStatItem: {
      flex: 1,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      alignItems: isArabic ? 'flex-end' : 'flex-start',
    },
    monthlyStatNumber: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    monthlyStatLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      marginTop: 2,
    },
    monthlyProgressBarContainer: {
      width: '100%',
      height: 6,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      borderRadius: 3,
      marginTop: 8,
      overflow: 'hidden',
    },
    monthlyProgressBarFill: {
      height: '100%',
      borderRadius: 3,
    },

    // Card 4: Productivity Tracker
    productivityRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      marginVertical: 6,
    },
    streakCard: {
      flex: 1,
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: isDarkMode ? 'rgba(229, 241, 157, 0.10)' : 'rgba(84, 118, 0, 0.08)',
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(229, 241, 157, 0.30)' : 'rgba(84, 118, 0, 0.28)',
    },
    streakIconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: isDarkMode ? '#e5f19d' : colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    streakNumber: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    streakLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },
    focusActionBtn: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDarkMode ? '#dbd4fd' : '#C7C2FF',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 18,
      ...colors.shadows.sm,
    },
    focusActionBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#23173D',
    },

    // Empty State Inside Cards
    emptyCardContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 6,
    },
    emptyCardTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      textAlign: 'center',
    },
    emptyCardBtn: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(142, 167, 233, 0.15)' : 'rgba(92, 107, 192, 0.1)',
      marginTop: 4,
    },
    emptyCardBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },

    // Pagination Dots
    paginationRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    paginationDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    paginationDotActive: {
      width: 18,
      backgroundColor: colors.primary,
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
