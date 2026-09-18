import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useTheme from '@/hooks/useTheme';

interface ScreenBackgroundProps {
  children?: React.ReactNode;
  style?: any;
}

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({ children, style }) => {
  const { colors, isDarkMode } = useTheme();

  if (!isDarkMode) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#050704' }, style]}>
      {/* 1. Base Dark Forest Atmosphere: deep emerald-olive top fading into rich obsidian floor */}
      <LinearGradient
        colors={['#182B14', '#12200F', '#0D160B', '#070A06', '#050704']}
        locations={[0, 0.20, 0.42, 0.70, 1.0]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Top Header & Status Bar Aurora Glow (matches reference image top glow) */}
      <LinearGradient
        colors={['rgba(72, 128, 48, 0.45)', 'rgba(38, 72, 26, 0.25)', 'rgba(16, 32, 11, 0.08)', 'transparent']}
        locations={[0, 0.22, 0.52, 1.0]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.42 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 3. Top-Right Ambient Sheen (matches reference image diagonal lighting) */}
      <LinearGradient
        colors={['rgba(110, 185, 75, 0.20)', 'rgba(45, 85, 30, 0.08)', 'transparent']}
        locations={[0, 0.35, 1.0]}
        start={{ x: 1.0, y: 0 }}
        end={{ x: 0.3, y: 0.38 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 4. Top-Left Soft Ambient Sheen */}
      <LinearGradient
        colors={['rgba(55, 105, 38, 0.20)', 'rgba(22, 45, 15, 0.08)', 'transparent']}
        locations={[0, 0.38, 1.0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.65, y: 0.35 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenBackground;
