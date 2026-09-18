export const LIST_TYPE_COLORS: Record<string, string> = {
  checklist: '#defef9', // Ice Mint
  todo: '#dbd4fd',      // Soft Lavender
  bullet: '#e5f19d',    // Pastel Lime
  toggle: '#f6e5c9',    // Warm Cream
};

export const CORE_PALETTE = {
  cream: '#f6e5c9',
  lime: '#e5f19d',
  mint: '#defef9',
  lavender: '#dbd4fd',
};

export const PROJECT_COLORS = [
  '#f6e5c9', '#e5f19d', '#defef9', '#dbd4fd',
  '#fbe8d5', '#e9f5a8', '#e5fffa', '#e4deff',
  '#eeddbf', '#dbec8c', '#d3fcf6', '#d2c8fb',
  '#f4dec0', '#cde37d', '#bdfbf1', '#c4b6f7',
];

export const GUIDE_TIP_ACCENTS = ['#dbd4fd', '#e5f19d', '#defef9', '#f6e5c9'];

export const JEWEL_DARK = ['#1D1A38', '#16281F', '#14232B', '#231838', '#2B1D2E', '#201C16'];
export const JEWEL_LIGHT = ['#F5EEDB', '#E8F5A6', '#E4FFFA', '#E2DCFE', '#F3EBFF', '#E7F6EC'];

export const AURORA_GRADIENT = ['#f6e5c9', '#e5f19d', '#defef9', '#dbd4fd'];

/** Project color swatches per mode: pastels in dark, ink twins in light. */
export function projectColorsFor(isDark: boolean): string[] {
  return isDark ? PROJECT_COLORS : PROJECT_COLORS.map(toInk);
}

const INK_MAP: Record<string, string> = {
  '#f6e5c9': '#9D5200',
  '#e5f19d': '#547600',
  '#defef9': '#007973',
  '#dbd4fd': '#6C38E9',
  '#fbe8d5': '#9D5200',
  '#e9f5a8': '#547600',
  '#e5fffa': '#007973',
  '#e4deff': '#6C38E9',
  '#eeddbf': '#9D5200',
  '#dbec8c': '#547600',
  '#d3fcf6': '#007973',
  '#d2c8fb': '#6C38E9',
  '#f4dec0': '#9D5200',
  '#cde37d': '#547600',
  '#bdfbf1': '#007973',
  '#c4b6f7': '#6C38E9',
};

function toInk(color: string): string {
  return INK_MAP[color.toLowerCase()] ?? color;
}

