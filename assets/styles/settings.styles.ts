import { ColorScheme } from "@/hooks/useTheme";
import { StyleSheet } from "react-native";

export const createSettingsStyles = (colors: ColorScheme, isArabic: boolean = false) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.5,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 48,
    },

    // Profile hero (double-bezel)
    profileOuter: {
      marginBottom: 32,
      borderRadius: 24,
      backgroundColor: colors.surface + '40',
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    profileInner: {
      padding: 20,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.text + '10',
    },
    avatarEditButton: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.bg,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    profileEmail: {
      fontSize: 14,
      color: colors.textMuted,
    },
    profileEditBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },

    // Section groups
    sectionGroup: {
      marginBottom: 24,
    },
    sectionGroupLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 18,
      backgroundColor: colors.surface,
      gap: 14,
    },
    settingRowFirst: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    settingRowLast: {
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    settingRowSingle: {
      borderRadius: 16,
    },
    settingRowDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 18,
    },
    settingIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    settingValue: {
      fontSize: 14,
      color: colors.textMuted,
    },
    settingChevron: {
      opacity: 0.4,
    },
    settingDanger: {
      color: colors.danger,
    },
    settingRowDanger: {
      backgroundColor: colors.dangerBg,
      borderWidth: 1,
      borderColor: colors.danger + '25',
    },

    // Stats grid
    statsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 32,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      letterSpacing: 0.2,
    },

    // Logout
    logoutButton: {
      backgroundColor: colors.dangerBg,
      borderRadius: 16,
      padding: 18,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.danger + '25',
      marginTop: 8,
    },
    logoutText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.danger,
    },

    // Modals
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    modalContent: {
      backgroundColor: colors.surfaceHigh,
      borderRadius: 24,
      padding: 24,
      ...colors.shadows.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    modalBody: {
      gap: 16,
    },
    inputGroup: {
      gap: 6,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
    textInput: {
      backgroundColor: colors.bg,
      borderRadius: 14,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
    },
    cancelButton: {
      padding: 14,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textMuted,
    },

    // Sound selection modal
    soundOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: colors.bg,
      marginBottom: 8,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    soundOptionActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '12',
    },
    soundOptionLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    soundOptionCheck: {},

    // Backward compat aliases
    profileSection: {
      marginBottom: 32,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      ...colors.shadows.sm,
    },
    profileHero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
      borderRadius: 16,
      marginBottom: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    dbInfoCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    dbRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    dbLabel: {
      fontSize: 13,
      color: colors.textMuted,
    },
    dbValue: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '600',
    },
    statusBadge: {
      backgroundColor: colors.success + '18',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.success,
    },
    versionText: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 32,
      marginBottom: 16,
    },
    appVersion: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 32,
      marginBottom: 16,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
  });

  return styles;
};
