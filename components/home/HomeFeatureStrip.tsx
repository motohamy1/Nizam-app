import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import LivePress from '@/components/LivePress';

export type HomeFeatureKey = 'checklist' | 'reminders' | 'monthly' | 'insights' | 'timer';

export interface HomeFeatureDef {
  key: HomeFeatureKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: string;
  accentColor?: string;
}

interface HomeFeatureStripProps {
  features: HomeFeatureDef[];
  onSelectFeature: (key: HomeFeatureKey) => void;
  isArabic?: boolean;
}

export const HomeFeatureStrip: React.FC<HomeFeatureStripProps> = ({
  features,
  onSelectFeature,
  isArabic = false,
}) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isArabic && { flexDirection: 'row-reverse' },
        ]}
      >
        {features.map((item) => {
          return (
            <LivePress
              key={item.key}
              onPress={() => onSelectFeature(item.key)}
              style={styles.itemContainer}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isDarkMode
                      ? 'rgba(255, 255, 255, 0.08)'
                      : colors.surface,
                    borderColor: isDarkMode
                      ? 'rgba(255, 255, 255, 0.14)'
                      : colors.border,
                    shadowColor: isDarkMode ? '#000000' : colors.text,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={26}
                  color={item.accentColor || colors.text}
                />

                {!!item.badge && (
                  <View
                    style={[
                      styles.badgeContainer,
                      {
                        backgroundColor: item.accentColor || '#d4ff32',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: '#000000',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.badge}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.titleText,
                  {
                    color: colors.text,
                  },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </LivePress>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
    alignItems: 'center',
  },
  itemContainer: {
    alignItems: 'center',
    width: 76,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  titleText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 7,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});

export default HomeFeatureStrip;
