import useTheme, { ColorScheme } from "@/hooks/useTheme";
import { Platform, StyleSheet } from "react-native";

export const createNotesStyles = (colors: ColorScheme, isArabic: boolean = false, isDarkMode: boolean = true) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.5,
    },

    // Section: outer double-bezel frame
    sectionOuter: {
      marginHorizontal: 16,
      marginBottom: 24,
      borderRadius: 24,
      backgroundColor: colors.surface + '40',
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    sectionInner: {
      paddingTop: 20,
      paddingBottom: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    sectionBadge: {
      backgroundColor: colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },

    // Cards row
    scrollContent: {
      paddingRight: 24,
      paddingLeft: 4,
    },
    cardsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingLeft: 16,
    },

    // Add card (dashed glass)
    addCardOuter: {
      marginRight: 16,
    },
    addCardInner: {
      width: 170,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      paddingVertical: 24,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
      ...colors.shadows.sm,
    },
    addCardIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + '14',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    addCardLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    addCardHint: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
    },

    // Note/reminder card (double-bezel)
    cardOuter: {
      marginRight: 16,
      borderRadius: 22,
      padding: 2,
      backgroundColor: colors.border + '60',
    },
    cardInner: {
      width: 170,
      borderRadius: 20,
      padding: 18,
      minHeight: 200,
      justifyContent: 'space-between',
    },
    cardReminderPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      marginBottom: 12,
    },
    cardReminderPillText: {
      fontSize: 11,
      fontWeight: '700',
    },
    cardTitleText: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      marginBottom: 12,
      lineHeight: 22,
    },
    cardTrailing: {
      alignSelf: 'flex-end',
      opacity: 0.5,
    },

    // Loading
    loadingPulse: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
    },

    // Kept for backward compat
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyState: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 8,
    },
    horizontalScroll: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    sectionContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
      marginTop: 8,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sectionHeaderCount: {
      fontSize: 13,
      color: colors.textMuted,
    },
    horizontalGridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    loneColumnCentered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    gridCard: {
      width: 160,
      borderRadius: 20,
      padding: 16,
      marginRight: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    card: {
      width: 180,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    cardPreview: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: 12,
    },
    cardDesc: {
      fontSize: 12,
      color: colors.textMuted,
    },
    cardDate: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    cardMeta: {
      fontSize: 11,
      color: colors.textMuted,
    },
    cardReminderBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.warningBg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginBottom: 8,
    },
    cardReminderText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.warning,
    },
    addCard: {
      width: 180,
      backgroundColor: 'transparent',
      borderRadius: 20,
      padding: 16,
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 140,
    },
    addCardText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '600',
      marginTop: 8,
    },
    detailSafeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    detailHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    detailHeaderBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    detailHeaderBtnIcon: {
      color: colors.text,
    },
    detailHeaderRight: {
      flexDirection: 'row',
      gap: 8,
    },
    inlineReminderHeader: {
      flexDirection: 'column',
      alignItems: 'stretch',
      paddingHorizontal: 0,
      marginBottom: 8,
    },
    inlineReminderTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    titleInput: {
      fontSize: 34,
      fontWeight: '800',
      color: colors.text,
      paddingVertical: 8,
      letterSpacing: -0.8,
    },
    dateSubtitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
      marginTop: 2,
      marginBottom: 16,
    },
    bodyInput: {
      flex: 1,
      fontSize: 17,
      color: colors.text,
      lineHeight: 26,
    },
    editorContainer: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 80,
      minHeight: 320,
    },
    mainBodyInput: {
      fontSize: 17,
      color: colors.text,
      lineHeight: 26,
      minHeight: 280,
      textAlignVertical: 'top',
      padding: 0,
      margin: 0,
    },
    interactiveChecklistStrip: {
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 12,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    checklistContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    calendarCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    calendarTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    weekDaysRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekDayText: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
    },
    dayCellActive: {
      backgroundColor: colors.primary,
    },
    dayText: {
      fontSize: 13,
      color: colors.text,
    },
    dayTextActive: {
      color: colors.primaryText,
    },
    timePresetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    timePresetBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timePresetMain: {},
    toolbarWrapper: {
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    toolbarIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 9,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    toolbarIconBtnActive: {
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary + '60',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surfaceHigh,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
  });

  return styles;
};
