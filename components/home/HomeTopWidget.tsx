import React, { useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/hooks/useAuth";
import { useOfflineQuery } from "@/hooks/useOfflineQuery";
import { api } from "@/convex/_generated/api";
import { getAppFont } from "@/utils/globalFont";

interface HomeTopWidgetProps {
  selectedDate?: number;
  todayStart?: number;
  onSelectDate?: (dayStart: number) => void;
  onOpenDayPlanner?: (dayTimestamp: number) => void;
  homeStyles?: any;
  isArabic?: boolean;
  taskCounts?: Map<number, number>;
  onActivePillLayout?: (layout: { x: number; y: number; width: number; height: number; cx: number }) => void;
}

export const BAR_WIDGET_COLOR = "#C084FC";
export const BAR_WIDGET_GRADIENT = ["#C084FC", "#C084FC"] as const; // Backward-compatible alias (no gradient)
export const LIME_ACCENT = BAR_WIDGET_COLOR; // Backward-compatible alias
export const LIME_TOP_GRADIENT = BAR_WIDGET_GRADIENT; // Backward-compatible alias

export const COLOR_DARK_PURPLE = "#18042B"; // Deep obsidian-violet for crisp contrast on #C084FC
export const COLOR_VIOLET_ACCENT = "#5B1497"; // Rich royal violet accent
export const COLOR_WARM_OFFWHITE = COLOR_DARK_PURPLE; // Backward-compatible alias
export const COLOR_VIOLET = COLOR_DARK_PURPLE; // Backward-compatible alias
export const COLOR_BLACK = COLOR_DARK_PURPLE; // Backward-compatible alias
export const COLOR_GOLD_ORANGE = COLOR_VIOLET_ACCENT; // Backward-compatible alias
export const SAND_GOLD_ACCENT = "#f6d7a1";
export const PURPLE_SHIMMER_ACCENT = "#641D7F";
export const PURPLE_SHIMMER_GRADIENT = ["#3B0E4C", "#641D7F", "#8E2CAC", "#521466"] as const;

export const HomeTopWidget: React.FC<HomeTopWidgetProps> = ({
  selectedDate,
  todayStart,
  onSelectDate,
  onOpenDayPlanner,
  homeStyles,
  isArabic = false,
  taskCounts,
  onActivePillLayout,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();
  const isLocalGuest = typeof userId === "string" && userId.startsWith("guest_");
  const userSettings = useOfflineQuery<any>(
    "auth.getUserSettings",
    api.auth.getUserSettings,
    userId && !isLocalGuest ? { userId } : "skip"
  );

  const widgetRef = useRef<any>(null);

  const handleProfilePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/settings");
  }, [router]);

  const handleOpenPlanner = useCallback(() => {
    if (onOpenDayPlanner) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onOpenDayPlanner(todayStart || selectedDate || Date.now());
    } else {
      router.push("/(tabs)/planner");
    }
  }, [onOpenDayPlanner, todayStart, selectedDate, router]);

  const todayFormatted = useMemo(() => {
    const ts = todayStart || selectedDate || Date.now();
    const d = new Date(ts);
    return d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [todayStart, selectedDate, isArabic]);

  const userName = userSettings?.name?.trim() || (isArabic ? "المبدع" : "Creator");

  const fontBold = getAppFont("bold", isArabic);
  const fontMedium = getAppFont("medium", isArabic);
  const fontBlack = getAppFont("black", isArabic);

  return (
    <View ref={widgetRef} style={styles.shadowWrapper}>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top + 5, Platform.OS === "android" ? 19 : 9),
          },
        ]}
      >
        {/* Background Base (Pure solid #C084FC, clean without granules or micro-shimmer) */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: BAR_WIDGET_COLOR },
            ]}
          />

          {/* Subtle Frosted Rim along bottom */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderBottomWidth: 1,
                borderBottomColor: "rgba(24, 4, 43, 0.12)",
              },
            ]}
          />
        </View>

        {/* Content Container (Height reduced by 15% for sleek footprint) */}
        <View style={styles.innerContent}>
          {/* Top Row: User Welcome Pill + Action Buttons (Planner Shortcut + Profile Avatar) */}
          <View style={[styles.topRow, isArabic && styles.rowRtl]}>
            <View style={[styles.welcomeBadge, isArabic && styles.rowRtl]}>
              <View style={styles.liveDot} />
              <Text
                style={[styles.welcomeBadgeText, { fontFamily: fontBold }]}
                numberOfLines={1}
              >
                {isArabic ? `أهلاً، ${userName}` : `HI, ${userName.toUpperCase()}`}
              </Text>
              <Text style={styles.badgeDivider}>•</Text>
              <Text
                style={[styles.badgeDateText, { fontFamily: fontMedium }]}
              >
                {todayFormatted}
              </Text>
            </View>

            <View style={[styles.topActions, isArabic && styles.rowRtl]}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={handleOpenPlanner}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? "فتح المخطط اليومي" : "Open Day Planner"}
                style={[styles.plannerBtn, isArabic && styles.rowRtl]}
              >
                <Ionicons name="calendar-outline" size={14} color={COLOR_DARK_PURPLE} />
                <Text style={[styles.plannerBtnText, { fontFamily: fontBold }]}>
                  {isArabic ? "المخطط" : "Planner"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.82}
                onPress={handleProfilePress}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? "الملف الشخصي" : "User Profile"}
                style={styles.profileBtn}
              >
                {userSettings?.profilePictureUrl ? (
                  <Image
                    source={{ uri: userSettings.profilePictureUrl }}
                    style={styles.profileAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="person" size={16} color={COLOR_DARK_PURPLE} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Bold Text Section */}
          <View style={styles.heroSection}>
            <Text style={[styles.headline, { fontFamily: fontBlack }, isArabic && styles.textRtl]}>
              <Text style={styles.textDark}>
                {isArabic ? "خطّط بوضوح، " : "PLAN WITH CLARITY. "}
              </Text>
              <Text style={styles.textAccent}>
                {isArabic ? "وأنجز بأثر حقيقي." : "OWN YOUR MOMENTUM."}
              </Text>
            </Text>
          </View>

          {/* Productivity Pillars Pill Row with Sleek Proportions */}
          <View style={[styles.pillarsRow, isArabic && styles.rowRtl]}>
            <View style={styles.pillarTag}>
              <Ionicons name="flash" size={11} color={COLOR_VIOLET_ACCENT} />
              <Text style={[styles.pillarText, { fontFamily: fontBold }]}>
                {isArabic ? "تركيز فائق" : "Deep Focus"}
              </Text>
            </View>
            <View style={styles.pillarTag}>
              <Ionicons name="layers-outline" size={11} color={COLOR_DARK_PURPLE} />
              <Text style={[styles.pillarText, { fontFamily: fontBold }]}>
                {isArabic ? "تنظيم ذكي" : "Smart Planning"}
              </Text>
            </View>
            <View style={styles.pillarTag}>
              <Ionicons name="checkmark-done" size={11} color={COLOR_VIOLET_ACCENT} />
              <Text style={[styles.pillarText, { fontFamily: fontBold }]}>
                {isArabic ? "إنجاز يومي" : "Daily Flow"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#3B0E4C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: "transparent",
  },
  container: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 15,
    overflow: "hidden",
    position: "relative",
    backgroundColor: BAR_WIDGET_COLOR,
  },
  innerContent: {
    paddingHorizontal: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  welcomeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(24, 4, 43, 0.08)",
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(24, 4, 43, 0.14)",
    maxWidth: "62%",
  },
  liveDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    backgroundColor: COLOR_VIOLET_ACCENT,
  },
  welcomeBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLOR_DARK_PURPLE,
    letterSpacing: 0.2,
  },
  badgeDivider: {
    color: "rgba(24, 4, 43, 0.35)",
    fontSize: 9.5,
  },
  badgeDateText: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(24, 4, 43, 0.72)",
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  plannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(24, 4, 43, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(24, 4, 43, 0.14)",
  },
  plannerBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLOR_DARK_PURPLE,
  },
  profileBtn: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: "rgba(24, 4, 43, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(24, 4, 43, 0.14)",
    overflow: "hidden",
  },
  profileAvatar: {
    width: "100%",
    height: "100%",
  },
  heroSection: {
    marginTop: 4,
    marginBottom: 9,
  },
  headline: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  textRtl: {
    textAlign: "right",
  },
  textDark: {
    color: COLOR_DARK_PURPLE,
  },
  textAccent: {
    color: "#4A044E",
  },
  pillarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  pillarTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(24, 4, 43, 0.08)",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: 4.5,
    borderWidth: 1,
    borderColor: "rgba(24, 4, 43, 0.14)",
  },
  pillarText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLOR_DARK_PURPLE,
    letterSpacing: 0.1,
  },
});

export default HomeTopWidget;
