// Theme-aware color helpers. Dark mode paints with pastel accents on
// obsidian; light mode swaps every pastel for a saturated same-hue INK that
// passes WCAG AA on white surfaces. See hooks/useTheme.tsx for the rationale.

const PASTEL_INK_MAP: Record<string, string> = {
  '#f6e5c9': '#9D5200', // cream
  '#e5f19d': '#547600', // pastel lime
  '#C8F135': '#547600', // active accent lime
  '#D4FF00': '#547600', // hashtag lime
  '#defef9': '#007973', // mint
  '#dbd4fd': '#6C38E9', // lavender
};

type Hsl = { h: number; s: number; l: number };

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let [r, g, b] = [0, 0, 0];
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const to255 = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to255(r)}${to255(g)}${to255(b)}`;
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// Pastel -> saturated ink twin for light surfaces. Known brand pastels map to
// the exact inks from the light palette; anything else gets a generic
// same-hue darkening pass.
function pastelToInk(color: string): string {
  const mapped = PASTEL_INK_MAP[color.trim().toUpperCase()];
  if (mapped) return mapped;
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  const hsl = rgbToHsl(...rgb);
  if (hsl.l <= 0.68) return color;
  return hslToHex({ h: hsl.h, s: Math.min(1, Math.max(hsl.s, 0.85)), l: 0.45 });
}

/**
 * Returns the mode-appropriate accent: the pastel as-is in dark mode, its
 * vivid ink twin in light mode.
 */
export function modeColor(color: string, isDarkMode: boolean): string {
  if (isDarkMode) return color;
  return pastelToInk(color);
}

/** Alias of modeColor — pastel gem presence for FABs, dock bubbles, pills. */
export const fillColor = modeColor;

/**
 * Best-readable ink to place on top of `bg`: keeps `ink` when it contrasts
 * well, otherwise falls back to white.
 */
export function textOn(bg: string, ink: string = '#101116'): string {
  if (!hexToRgb(bg)) return ink;
  return contrastRatio(bg, ink) >= contrastRatio(bg, '#FFFFFF') ? ink : '#FFFFFF';
}

/** Infers dark mode from a ColorScheme by the luminance of its background. */
export function isDarkScheme(colors: { bg: string }): boolean {
  const rgb = hexToRgb(colors.bg);
  if (!rgb) return false;
  return relativeLuminance(colors.bg) < 0.5;
}

