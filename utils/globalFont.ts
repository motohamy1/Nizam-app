import React from 'react';
import { Platform } from 'react-native';

export const APP_FONTS = {
  latin: {
    regular: 'PlusJakartaSans_500Medium',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
    black: 'PlusJakartaSans_800ExtraBold',
    display: 'ArchivoBlack_400Regular',
  },
  arabic: {
    regular: 'Cairo_500Medium',
    medium: 'Cairo_500Medium',
    semiBold: 'Cairo_600SemiBold',
    bold: 'Cairo_700Bold',
    extraBold: 'Cairo_800ExtraBold',
    black: 'Cairo_900Black',
    display: 'Cairo_900Black',
  },
} as const;

export type AppFontWeight =
  | 'regular'
  | 'medium'
  | 'semiBold'
  | 'bold'
  | 'extraBold'
  | 'black'
  | 'display';

export const getAppFont = (
  weight: AppFontWeight = 'bold',
  isArabic: boolean = false
): string => {
  if (isArabic) {
    return (APP_FONTS.arabic as Record<string, string>)[weight] || 'Cairo_700Bold';
  }
  return (APP_FONTS.latin as Record<string, string>)[weight] || 'PlusJakartaSans_700Bold';
};

export const GLOBAL_FONT_FAMILY = Platform.select({
  ios: 'PlusJakartaSans_700Bold',
  android: 'PlusJakartaSans_700Bold',
  web: 'Plus Jakarta Sans, Cairo, sans-serif',
  default: 'PlusJakartaSans_700Bold',
});

// 1. Client-side web DOM injection for web builds / browsers
if (typeof document !== 'undefined') {
  const fontLinkId = 'google-font-plus-jakarta-and-cairo';
  if (!document.getElementById(fontLinkId)) {
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const fontLink = document.createElement('link');
    fontLink.id = fontLinkId;
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Cairo:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';
    document.head.appendChild(fontLink);
  }

  // Inject CSS rules to enforce Plus Jakarta Sans and Cairo globally across all elements
  const fontStyleId = 'global-style-plus-jakarta-and-cairo';
  if (!document.getElementById(fontStyleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = fontStyleId;
    styleEl.textContent = `
      * {
        font-family: 'Plus Jakarta Sans', 'Cairo', sans-serif !important;
      }
      html, body, #root, div, span, p, h1, h2, h3, h4, h5, h6, input, textarea, button, select {
        font-family: 'Plus Jakarta Sans', 'Cairo', sans-serif !important;
      }
      input::placeholder, textarea::placeholder {
        font-family: 'Plus Jakarta Sans', 'Cairo', sans-serif !important;
      }
    `;
    document.head.appendChild(styleEl);
  }
}
