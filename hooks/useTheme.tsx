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
  bg: "#0E0F14",
  surface: "#181922",
  surfaceHigh: "#222432",
  text: "#FFFFFF",
  textMuted: "#8E92A0",
  border: "#282A38",
  primary: "#dbd4fd",
  primaryText: "#181326",
  secondary: "#e5f19d",
  secondaryText: "#1a1a2e",
  success: "#10B981",
  warning: "#f6e5c9",
  danger: "#FB7185",
  info: "#defef9",
  shadow: "#000000",
  infoBg: "rgba(222, 254, 249, 0.15)",
  successBg: "rgba(16, 185, 129, 0.15)",
  warningBg: "rgba(246, 229, 201, 0.15)",
  dangerBg: "rgba(251, 113, 133, 0.15)",
  taskInProgressBg: "#1C1D2B",
  taskNotStartedBg: "#181922",
  taskDoneBg: "#141F1C",
  taskPausedBg: "#1A1B24",
  taskNotDoneBg: "#221619",
  surfaceText: "#FFFFFF",
  statusBarStyle: "light-content" as const,
  palette: {
    cream: "#f6e5c9",
    lime: "#e5f19d",
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
      shadowColor: "#dbd4fd",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    auroraGlow: {
      shadowColor: "#defef9",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
      elevation: 6,
    },
  },
};

// Light register of the Nizam quartet. Dark mode paints with pastels on
// obsidian; light mode paints with saturated same-hue INKS on warm-white.
// The pastel quartet would sit at ~1.1-1.4:1 on white (invisible), so every
// accent here is an OKLCH-derived ink: same hue as its pastel twin,
// L 0.50-0.55, near-max chroma. All pass WCAG AA >=4.5:1 on white surfaces and
// carry white text at >=5:1. Where the brand wants pastel GEM presence (FAB, dock
// bubble, status pills, date pills) fillColor() supplies vivid light twins. Neutrals carry a
// whisper of the brand's violet hue (chroma 0.005-0.045, H 285) for cohesion.
const lightColors: ColorScheme = {
  bg: "#F3F3FC",
  surface: "#FFFFFF",
  surfaceHigh: "#ECECF9",
  text: "#1E1B35",
  textMuted: "#60627E",
  border: "#DDDCEF",
  primary: "#6C38E9",
  primaryText: "#FFFFFF",
  secondary: "#547600",
  secondaryText: "#16270E",
  success: "#007835",
  warning: "#9D5200",
  danger: "#BB2441",
  info: "#007973",
  shadow: "#1E1B35",
  infoBg: "#CCF7F3",
  successBg: "#DFF4E4",
  warningBg: "#FFE8D8",
  dangerBg: "#FDE2E8",
  taskInProgressBg: "#EBEAFF",
  taskNotStartedBg: "#FFFFFF",
  taskDoneBg: "#E5F3D3",
  taskPausedBg: "#F1F0F8",
  taskNotDoneBg: "#FDE2E8",
  surfaceText: "#1E1B35",
  statusBarStyle: "dark-content" as const,
  palette: {
    cream: "#9D5200",
    lime: "#547600",
    mint: "#007973",
    lavender: "#6C38E9",
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
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    md: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
    glow: {
      shadowColor: "#6C38E9",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.20,
      shadowRadius: 16,
      elevation: 6,
    },
    auroraGlow: {
      shadowColor: "#007973",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
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
