import type { ColorScheme } from '@/hooks/useTheme';

/**
 * Shared palette bridge for the AI Goal Architect surfaces.
 *
 * The AI UI was authored against a blue-slate design (light only). To make it
 * sit inside the app's warm ivory (light) / forest-obsidian (dark) identity,
 * every AI component resolves its colors through this single map:
 * light mode keeps the original authored values untouched; dark mode swaps
 * slate neutrals for the forest theme and AI orange for the chartreuse
 * accent family the app uses at night.
 */
export interface AiTheme {
  page: string;
  card: string;
  cardHigh: string;
  input: string;
  border: string;
  borderStrong: string;
  text: string;
  textBody: string;
  textSecondary: string;
  textMuted: string;
  placeholder: string;
  /** AI accent for icons/text/spinners. */
  accent: string;
  /** AI accent as a CTA fill; use accentFillText on top. */
  accentFill: string;
  accentFillText: string;
  /** Soft tint behind accent icons/avatars. */
  accentWash: string;
  accentBorder: string;
  /** Deeper accent tint for pills sitting on card surfaces. */
  accentWashDeep: string;
  /** Full-strength accent border for selected/focused states. */
  accentBorderStrong: string;
  /** Secondary assistant bubble / alt surface. */
  bubbleAlt: string;
  danger: string;
  dangerFillText: string;
  dangerWash: string;
  success: string;
  successWash: string;
  warning: string;
  warningWash: string;
  info: string;
  infoWash: string;
  /** Special AI purple family, unified per mode. */
  special: string;
  specialWash: string;
}

export const getAiTheme = (colors: ColorScheme, isDarkMode: boolean): AiTheme => {
  if (isDarkMode) {
    return {
      page: colors.bg,
      card: colors.surface,
      cardHigh: colors.surfaceHigh,
      input: colors.surfaceHigh,
      border: colors.border,
      borderStrong: '#2A3425',
      text: colors.text,
      textBody: '#D7DED0',
      textSecondary: colors.textSecondary,
      textMuted: colors.textMuted,
      placeholder: '#5E6A57',
      accent: '#e5f19d',
      accentFill: colors.primary,
      accentFillText: colors.primaryText,
      accentWash: 'rgba(200, 241, 53, 0.10)',
      accentBorder: 'rgba(200, 241, 53, 0.28)',
      accentWashDeep: 'rgba(200, 241, 53, 0.16)',
      accentBorderStrong: 'rgba(200, 241, 53, 0.55)',
      bubbleAlt: colors.surfaceHigh,
      danger: colors.danger,
      dangerFillText: '#1C0A0E',
      dangerWash: colors.dangerBg,
      success: colors.success,
      successWash: colors.successBg,
      warning: colors.warning,
      warningWash: colors.warningBg,
      info: colors.info,
      infoWash: colors.infoBg,
      special: colors.special,
      specialWash: colors.specialBg,
    };
  }
  // Light: the original authored slate/warm values — unchanged.
  return {
    page: '#F8FAFC',
    card: '#FFFFFF',
    cardHigh: '#FFFFFF',
    input: '#F8FAFC',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    text: '#0F172A',
    textBody: '#334155',
    textSecondary: '#475569',
    textMuted: '#64748B',
    placeholder: '#94A3B8',
    accent: '#EA580C',
    accentFill: '#EA580C',
    accentFillText: '#FFFFFF',
    accentWash: '#FFF7ED',
    accentBorder: '#FED7AA',
    accentWashDeep: '#FFEDD5',
    accentBorderStrong: '#EA580C',
    bubbleAlt: '#F1F5F9',
    danger: '#EF4444',
    dangerFillText: '#FFFFFF',
    dangerWash: '#FEF2F2',
    success: '#059669',
    successWash: '#ECFDF5',
    warning: '#D97706',
    warningWash: '#FFFBEB',
    info: '#2563EB',
    infoWash: '#EFF6FF',
    special: '#7C3AED',
    specialWash: '#F5F3FF',
  };
};
