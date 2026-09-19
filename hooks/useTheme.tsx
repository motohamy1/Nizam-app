import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === "web") {
        return typeof localStorage !== "undefined" ? localStorage.getItem(key) : memoryStorage[key];
      }
      if (SecureStore && typeof SecureStore.getItemAsync === "function") {
        return await SecureStore.getItemAsync(key);
      }
      return memoryStorage[key] || null;
    } catch (error) {
      console.warn("Storage getItem failed:", error);
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      memoryStorage[key] = value;
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
        return;
      }
      if (SecureStore && typeof SecureStore.setItemAsync === "function") {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.warn("Storage setItem failed:", error);
    }
  },
};

export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ColorScheme {
  bg: string;
  surface: string;
  surfaceHigh: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  secondary: string;
  secondaryText: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  special: string;
  specialBg: string;
  shadow: string;
  infoBg: string;
  successBg: string;
  warningBg: string;
  dangerBg: string;
  taskInProgressBg: string;
  taskNotStartedBg: string;
  taskDoneBg: string;
  taskPausedBg: string;
  taskNotDoneBg: string;
  surfaceText: string;
  statusBarStyle: "light-content" | "dark-content";
  palette: {
    cream: string;
    lime: string;
    mint: string;
    lavender: string;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
    tab: number;
  };
  shadows: {
    sm: ShadowPreset;
    md: ShadowPreset;
    lg: ShadowPreset;
    glow: ShadowPreset;
    auroraGlow: ShadowPreset;
  };
}

const darkColors: ColorScheme = {
  bg: "#060805",              // Deep dark forest obsidian matching reference base
  surface: "#111510",         // Dark obsidian card surface with subtle olive undertone
  surfaceHigh: "#181E15",     // Elevated card / modal surface
  text: "#FFFFFF",            // Crisp white text
  textMuted: "#8E9A86",       // Sophisticated muted olive-tinted neutral
  border: "#1E261A",          // Subtle border matching dark forest tones
  primary: "#C8F135",         // Neon Chartreuse / Electric Lime from reference!
  primaryText: "#0D1405",     // Deep forest ink on electric lime (>12:1 contrast)
  secondary: "#B8F628",       // Saturated Lime accent
  secondaryText: "#0D1405",   // Deep forest ink
  success: "#10B981",
  warning: "#FBBF24",
  danger: "#FB7185",
  info: "#38BDF8",
  shadow: "#000000",
  infoBg: "rgba(56, 189, 248, 0.15)",
  successBg: "rgba(16, 185, 129, 0.15)",
  warningBg: "rgba(251, 191, 36, 0.15)",
  dangerBg: "rgba(251, 113, 133, 0.15)",
  taskInProgressBg: "#172013",
  taskNotStartedBg: "#121610",
  taskDoneBg: "#0E170C",
  taskPausedBg: "#151B12",
  taskNotDoneBg: "#221619",
  surfaceText: "#FFFFFF",
  statusBarStyle: "light-content" as const,
  textSecondary: "#A8B29E",   // additive token — unused by dark rendering
  special: "#dbd4fd",        // additive token — unused by dark rendering
  specialBg: "rgba(142, 117, 246, 0.15)", // additive token — unused by dark rendering
  palette: {
    cream: "#f6e5c9",
    lime: "#C8F135",
    mint: "#defef9",
    lavender: "#dbd4fd",
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 22,
    full: 28,
    tab: 24,
  },
  shadows: {
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 6,
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.55,
      shadowRadius: 24,
      elevation: 10,
    },
    glow: {
      shadowColor: "#C8F135",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    auroraGlow: {
      shadowColor: "#2E4E20",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// ─── LIGHT MODE — "Warm Ivory" visual system ───────────────────────────────
// A warm ivory environment (#F3EBDD) brought alive by ambient light layers
// (soft peach + pale sage) rendered in ScreenBackground. Orange is the PRIMARY
// brand color, teal the SECONDARY; yellow/purple/blue/coral/soft-green are
// semantic supporting states. Neutrals stay warm so surfaces harmonize with
// the ivory base. DARK MODE has its own independent register above — none of
// these values are shared with it.
const lightColors: ColorScheme = {
  bg: "#F3EBDD",              // very light warm ivory base (ambient layers live in ScreenBackground)
  surface: "#FFFFFF",         // clean warm-white card surface
  surfaceHigh: "#FBFAF7",     // warm-white elevated / secondary surface
  text: "#111111",            // primary text
  textSecondary: "#66635E",   // secondary text — warm gray
  textMuted: "#8C8881",       // muted text / captions
  border: "#E7E2D8",          // soft warm border
  primary: "#FD8B2D",         // Nizam ORANGE — primary brand (CTA, active states)
  primaryText: "#231303",     // dark warm ink on orange fills (≈7:1)
  secondary: "#149375",       // Nizam TEAL — secondary brand
  secondaryText: "#20201C",   // dark warm ink used on pastel/pill fills
  success: "#55B999",         // soft green — success / completion
  warning: "#FBC432",         // yellow — warnings / attention / categories
  danger: "#F06F63",          // coral — urgent / destructive / errors
  info: "#5292F1",            // blue — informational states
  special: "#8E75F6",         // purple — AI / creative / special categories
  shadow: "#3A2E1F",          // warm shadow ink
  infoBg: "#E3EEFC",
  successBg: "#E3F3EC",
  warningBg: "#FDF1D4",
  dangerBg: "#FDE7E4",
  specialBg: "#EEEAFD",
  taskInProgressBg: "#FBEFDE", // peach tint — in progress
  taskNotStartedBg: "#FFFFFF",
  taskDoneBg: "#E5F0E9",       // soft green tint — done
  taskPausedBg: "#F4F1E8",     // warm pause tint
  taskNotDoneBg: "#FDE7E4",    // coral tint — overdue
  surfaceText: "#111111",
  statusBarStyle: "dark-content" as const,
  palette: {
    cream: "#AD5210",          // burnt-orange ink (cream family, AA on white)
    lime: "#547600",           // leaf lime ink
    mint: "#0E7A62",           // deep teal ink (mint family)
    lavender: "#6C38E9",       // violet ink
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 22,
    full: 28,
    tab: 24,
  },
  shadows: {
    sm: {
      shadowColor: "#3A2E1F",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    md: {
      shadowColor: "#3A2E1F",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.09,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: "#3A2E1F",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.13,
      shadowRadius: 20,
      elevation: 8,
    },
    glow: {
      shadowColor: "#FD8B2D",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    },
    auroraGlow: {
      shadowColor: "#149375",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.20,
      shadowRadius: 12,
      elevation: 4,
    },
  },
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: ColorScheme;
}

const ThemeContext = createContext<undefined | ThemeContextType>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    safeStorage.getItem("darkMode").then((value) => {
      if (value) setIsDarkMode(JSON.parse(value));
    });
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await safeStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default useTheme;
