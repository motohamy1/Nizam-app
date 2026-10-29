import { ColorScheme } from "@/hooks/useTheme";
import { Platform, StyleSheet } from "react-native";

export const createHomeStyles = (colors: ColorScheme, isArabic: boolean = false) => {
  // Accent comes from the home page upper widget's purple shimmer gradient.
  const isDark = colors.statusBarStyle === 'light-content';
  const accentFill = '#8E2CAC';
  const accentMark = '#FFFFFF';
  const accentTintBg = 'rgba(142, 44, 172, 0.16)';
  const accentTintBorder = 'rgba(142, 44, 172, 0.34)';
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
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerLeft: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
    },
    headerDate: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      letterSpacing: 0.3,
    },
    headerGreeting: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.5,
    },
    headerRight: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    scrollContent: {
      paddingTop: 4,
      paddingBottom: 110,
    },

    // Today's Plan Banner
    todaysPlanCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.md,
      padding: 20,
      marginHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    todaysPlanTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    todaysPlanSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '600',
    },

    // Date Bar
    dateBarContainer: {
      marginBottom: 5,
    },
    dateBarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    dateBarMonthWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateBarMonth: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
    },
    dateBarChevron: {
      marginStart: 2,
    },
    dateBarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dateBarResetBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateBarResetText: {
      fontSize: 12,
      fontWeight: '700',
      color: accentFill,
    },
    dateBarPlannerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: accentTintBg,
      borderWidth: 1,
      borderColor: accentTintBorder,
    },
    dateBarPlannerBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: accentFill,
    },
    dateBarStrip: {
      paddingHorizontal: 16,
      gap: 8,
    },
    dateBarDay: {
      width: 48,
      height: 68,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: colors.statusBarStyle === 'light-content' ? '#20222B' : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.statusBarStyle === 'light-content' ? 'rgba(255, 255, 255, 0.08)' : colors.border,
      gap: 4,
      overflow: 'hidden',
    },
    dateBarDayActive: {
      backgroundColor: '#FF9470',
      borderColor: 'rgba(255, 255, 255, 0.50)',
      shadowColor: '#FF9470',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    dateBarWeekday: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textMuted,
    },
    dateBarWeekdayActive: {
      color: '#141311',
      fontWeight: '800',
    },
    dateBarDayNum: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    dateBarDayNumActive: {
      color: '#141311',
      fontWeight: '900',
    },
    dateBarDot: {
      position: 'absolute',
      bottom: 6,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#141311',
    },

    // Kanban Board
    kanbanContainer: {
      marginTop: 4,
    },
    kanbanColumn: {
      width: 252,
      marginEnd: 12,
    },
    kanbanColumnHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 4,
      marginBottom: 12,
    },
    kanbanColumnDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    kanbanColumnTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.2,
    },
    kanbanColumnCount: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      backgroundColor: colors.surfaceHigh,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      overflow: 'hidden',
    },
    kanbanEmpty: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      borderRadius: 16,
      paddingVertical: 24,
      alignItems: 'center',
    },
    kanbanEmptyText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },

    // Filter Pills
    pillsContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      backgroundColor: 'transparent',
      padding: 0,
      gap: 8,
      marginBottom: 20,
    },
    pill: {
      flex: 1,
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    pillActive: {
      backgroundColor: colors.secondary,
      borderWidth: 0,
      ...colors.shadows.sm,
    },
    pillInactive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillText: {
      fontSize: 13,
      fontWeight: '700',
    },
    pillSubText: {
      fontSize: 12,
      fontWeight: '700',
    },

    // Section
    sectionTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    sectionTitleText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.3,
    },

    // Card container
    cardContainer: {
      marginStart: 16,
      marginEnd: 16,
      marginBottom: 12,
      flexDirection: 'row',
    },
    timelineColumn: {
      width: 52,
      alignItems: 'center',
      paddingEnd: 4,
    },
    timelineTimeTop: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textAlign: 'center',
      flexWrap: 'wrap',
    },
    timelineTimeBottom: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textAlign: 'center',
      flexWrap: 'wrap',
    },
    timelineTime: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
    },
    card: {
      flex: 1,
      borderRadius: 20,
      padding: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    cardNotDone: {
      borderLeftWidth: 3.5,
      borderLeftColor: colors.danger,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      flex: 1,
      writingDirection: 'auto',
      letterSpacing: -0.2,
    },

    statusAndActionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      gap: 6,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: '700',
    },
    iconBtn: {
      width: 38,
      height: 38,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceHigh,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dividerDashed: {
      height: 1,
      borderStyle: "dashed",
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 8,
    },
    projectRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 6,
    },
    projectText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '500',
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    footerStats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 12,
      color: colors.text + '99',
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    emptyTitle: {
      marginTop: 14,
      fontSize: 16,
      color: colors.text,
      fontWeight: "700",
      textAlign: "center",
    },
    emptyText: {
      marginTop: 6,
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: "500",
      textAlign: "center",
      lineHeight: 20,
    },
    emptyAction: {
      marginTop: 16,
      backgroundColor: accentFill,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: colors.radii.md,
      shadowColor: accentFill,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    emptyActionText: {
      color: accentMark,
      fontSize: 14,
      fontWeight: "800",
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      padding: 16,
      borderRadius: colors.radii.lg,
      gap: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    addButtonText: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '600',
    },

    addInputContainer: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      padding: 16,
      borderRadius: colors.radii.lg,
      marginBottom: 0,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    addInput: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    fab: {
      height: 44,
      paddingHorizontal: 10,
      borderRadius: colors.radii.lg,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
  });

  return styles;
};
