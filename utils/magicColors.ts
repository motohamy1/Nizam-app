export const LIST_TYPE_COLORS: Record<string, string> = {
  checklist: '#defef9', // Ice Mint
  todo: '#dbd4fd',      // Soft Lavender
  bullet: '#e5f19d',    // Pastel Lime
  toggle: '#f6e5c9',    // Warm Cream
};

// Same four hues as saturated inks for the light register. Pale pastels sit at
// ~1.1-1.4:1 on white; these pass >=4.4:1 on white and with white text.
export const LIST_TYPE_COLORS_LIGHT: Record<string, string> = {
  checklist: '#007973', // Marine Teal
  todo: '#6C38E9',      // Brand Violet
  bullet: '#547600',    // Leaf Lime
  toggle: '#9D5200',    // Burnt Apricot
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

// Light-register twin of PROJECT_COLORS: same 4 hue families x 4 depths,
// pulled down to saturated inks so swatches and saved project colors stay
// visible on white surfaces.
export const PROJECT_COLORS_LIGHT = [
  '#9D5200', '#547600', '#007973', '#6C38E9',
  '#C26507', '#6B9E00', '#00A69B', '#8B5CF6',
  '#7D4100', '#3F5900', '#005C56', '#5726C9',
  '#A85800', '#608600', '#008A83', '#7A4BF2',
];

export const GUIDE_TIP_ACCENTS = ['#dbd4fd', '#e5f19d', '#defef9', '#f6e5c9'];

export const JEWEL_DARK = ['#1D1A38', '#16281F', '#14232B', '#231838', '#2B1D2E', '#201C16'];
export const JEWEL_LIGHT = ['#F5EEDB', '#E8F5A6', '#E4FFFA', '#E2DCFE', '#F3EBFF', '#E7F6EC'];

export const AURORA_GRADIENT = ['#f6e5c9', '#e5f19d', '#defef9', '#dbd4fd'];

// Light-register aurora: same hue order, saturated so ambient glows read on
// white instead of vanishing as pale wash-on-wash.
export const AURORA_GRADIENT_LIGHT = ['#9D5200', '#547600', '#007973', '#6C38E9'];

/** Pick the register-appropriate twin for the project swatch scale. */
export const projectColorsFor = (isDarkMode: boolean): string[] =>
  isDarkMode ? PROJECT_COLORS : PROJECT_COLORS_LIGHT;

/** Pick the register-appropriate twin for list-type accents. */
export const listTypeColorFor = (type: keyof typeof LIST_TYPE_COLORS, isDarkMode: boolean): string =>
  (isDarkMode ? LIST_TYPE_COLORS : LIST_TYPE_COLORS_LIGHT)[type];

