import { ColorScheme } from '@/hooks/useTheme';

// Light-mode color adapter.
//
// The Nizam brand lives on a pastel quartet (cream / lime / mint / lavender)
// that was tuned for the obsidian dark surface. On white those pastels sit at
// 1.07–1.41:1 contrast — effectively invisible. These helpers keep ONE palette
// definition (the pastels) in the code and map each pastel to its saturated
// same-hue "ink" when a screen renders in light mode, so components can pass
// brand pastels freely and get a readable color in both registers.
//
// Ink values are OKLCH-derived from each pastel's own hue at L≈0.53–0.58 with
// near-gamut-max chroma, so identity survives the mode switch. All values pass
// >=4.5:1 on white (WCAG AA) and >=4.7:1 against white text.

/** Dark-mode proxy for style factories that only receive `colors`. */
export const isDarkScheme = (colors: Pick<ColorScheme, 'statusBarStyle'>) =>
  colors.statusBarStyle === 'light-content';

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** WCAG 2.1 relative luminance; tolerant of #RGB / #RRGGBB / #RRGGBBAA forms. */
export const relativeLuminance = (hex: string): number => {
  let v = hex.replace('#', '').trim();
  if (v.length === 3) v = v.split('').map((c) => c + c).join('');
  if (v.length !== 6 && v.length !== 8) return 0;
  const r = srgbToLinear(parseInt(v.slice(0, 2), 16) / 255);
  const g = srgbToLinear(parseInt(v.slice(2, 4), 16) / 255);
  const b = srgbToLinear(parseInt(v.slice(4, 6), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2.x contrast ratio between two hex colors. */
export const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/** True when the color is bright enough to need dark text on top of it. */
export const isLightColor = (hex: string): boolean => relativeLuminance(hex) > 0.35;

/** Readable text color for a solid fill of any brightness. */
export const textOn = (bg: string, onLight = '#101116', onDark = '#FFFFFF'): string =>
  isLightColor(bg) ? onLight : onDark;

/** Brand pastels -> saturated same-hue inks for light mode. */
export const PASTEL_TO_LIGHT_INK: Record<string, string> = {
  '#f6e5c9': '#AD5210', // Warm Cream  -> burnt-orange ink (Nizam orange family)
  '#e5f19d': '#547600', // Pastel Lime -> leaf lime ink
  '#d4ff00': '#547600', // Electric chartreuse (notes neon) -> same leaf lime ink
  '#defef9': '#0E7A62', // Ice Mint    -> deep teal ink (Nizam teal family)
  '#dbd4fd': '#6C38E9', // Lavender    -> violet ink
  '#f9a8d4': '#9D174D', // Pink        -> rose ink
  '#10b981': '#007835', // Emerald     -> fresh grass ink
};

/** Light-register VIVID gem fills: the same "pastel chip + dark ink" grammar
 *  as dark mode, pushed to each hue's max chroma so gems pop against white
 *  instead of washing into it. Used for buttons, pills, and badge fills. */
export const VIVID_FILL: Record<string, string> = {
  '#f6e5c9': '#FFB986', // -> electric apricot
  '#e5f19d': '#A4E200', // -> electric chartreuse
  '#defef9': '#00E8DE', // -> electric aqua
  '#dbd4fd': '#C7C2FF', // -> electric periwinkle
  '#f9a8d4': '#F9A8D4', // pink is already vivid
  '#10b981': '#34D399',
};

export const fillColor = (hex: string | undefined, isDarkMode: boolean): string => {
  if (!hex || isDarkMode) return hex ?? '';
  return VIVID_FILL[hex.toLowerCase()] ?? hex;
};

/** Map a brand pastel to its light-mode ink; unknown colors pass through. */
export const modeColor = (hex: string | undefined, isDarkMode: boolean): string => {
  if (!hex || isDarkMode) return hex ?? '';
  return PASTEL_TO_LIGHT_INK[hex.toLowerCase()] ?? hex;
};

/** Per-status forest card backgrounds (solid; append alpha hex for translucency). */
export const taskStatusBg = (colors: any, status?: string): string => {
  switch (status) {
    case 'in_progress': return colors.taskInProgressBg;
    case 'done': return colors.taskDoneBg;
    case 'paused': return colors.taskPausedBg;
    case 'not_done': return colors.taskNotDoneBg;
    default: return colors.taskNotStartedBg;
  }
};
