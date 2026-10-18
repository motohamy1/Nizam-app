import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ViewStyle,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';

export interface PostalMilestone {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface PostalStampGoalCardProps {
  title: string;
  description?: string;
  category: string;
  milestones?: PostalMilestone[];
  isCompleted?: boolean;
  color?: string;
  icon?: string;
  timeframe?: string;
  year?: number;
  month?: number;
  day?: number;
  isArabic?: boolean;
  backdropColor?: string;
  onToggleGoal?: () => void;
  onToggleMilestone?: (id: string) => void;
  onDeleteMilestone?: (id: string) => void;
  onAddMilestone?: (text: string) => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  onEditCategoryPress?: () => void;
  readOnly?: boolean;
  style?: ViewStyle;
}

// 11 Curated vibrant color variants matching the reference image's avatar & playful stickers
export const STAMP_COLOR_VARIANTS = [
  { bg: '#FF2A93', text: '#FFFFFF', sticker: '👁', stickerBg: '#FEF08A' }, // Neon Pink + Yellow Eye
  { bg: '#00C968', text: '#FFFFFF', sticker: '✳', stickerBg: '#BBF7D0' }, // Emerald + Mint Star
  { bg: '#FFE500', text: '#0F172A', sticker: '🔥', stickerBg: '#FECDD3' }, // Sunflower + Pink Fire
  { bg: '#FFFFFF', text: '#0F172A', sticker: '🌓', stickerBg: '#BAE6FD', border: '#CBD5E1' }, // White + Cyan Moon
  { bg: '#5EEAD4', text: '#0F172A', sticker: '🌘', stickerBg: '#CCFBF1' }, // Aquamarine + Mint
  { bg: '#18181B', text: '#FFFFFF', sticker: '✳', stickerBg: '#DCFCE7' }, // Obsidian + Green Star
  { bg: '#2563EB', text: '#FFFFFF', sticker: '💗', stickerBg: '#FCE7F3' }, // Royal Blue + Pink Heart
  { bg: '#FF1493', text: '#FFFFFF', sticker: '🏷', stickerBg: '#1E293B' }, // Hot Magenta + Dark Tag
  { bg: '#FACC15', text: '#0F172A', sticker: '🔥', stickerBg: '#FED7AA' }, // Amber Yellow + Orange Fire
  { bg: '#6EE7B7', text: '#0F172A', sticker: '👁', stickerBg: '#FEF08A' }, // Mint Seafoam + Yellow Eye
  { bg: '#F43F5E', text: '#FFFFFF', sticker: '✳', stickerBg: '#BBF7D0' }, // Rose Pink + Mint Star
];

export const PostalStampGoalCard: React.FC<PostalStampGoalCardProps> = ({
  title,
  description,
  category,
  milestones = [],
  isCompleted = false,
  color = '#2563EB',
  icon = 'flag-outline',
  timeframe,
  year = new Date().getFullYear(),
  isArabic = false,
  backdropColor,
  onToggleGoal,
  onToggleMilestone,
  onDeleteMilestone,
  onAddMilestone,
  onEditPress,
  onDeletePress,
  onEditCategoryPress,
  readOnly = false,
  style,
}) => {
  const { colors, isDarkMode } = useTheme();
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [cardDimensions, setCardDimensions] = useState({ width: 0, height: 0 });

  // Effective colors: Keep paper stationery in pure crisp white even in dark theme (matching reference image)
  const effectiveBackdrop = backdropColor || (isDarkMode ? '#0a0a0c' : colors.bg || '#F3F4F6');
  const paperBg = '#FFFFFF';
  const paperText = '#0F172A';
  const paperTextMuted = '#64748B';
  const dashedBorderColor = '#CBD5E1';
  const subtleDivider = '#F1F5F9';

  const onCardLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - cardDimensions.width) > 4 || Math.abs(height - cardDimensions.height) > 4) {
      setCardDimensions({ width, height });
    }
  };

  const verticalHoles =
    cardDimensions.height > 0
      ? Math.max(6, Math.floor((cardDimensions.height - 24) / 20))
      : 14;
  const horizontalHoles =
    cardDimensions.width > 0
      ? Math.max(8, Math.floor((cardDimensions.width - 24) / 20))
      : 16;

  const handleAddSubmit = () => {
    if (newMilestoneText.trim() && onAddMilestone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onAddMilestone(newMilestoneText.trim());
      setNewMilestoneText('');
    }
  };

  return (
    <View style={[styles.outerWrapper, style]}>
      {/* ─── Main Paper Stamp Card ─── */}
      <View
        onLayout={onCardLayout}
        style={[
          styles.paperCard,
          {
            backgroundColor: paperBg,
            borderColor: '#E2E8F0',
            shadowColor: '#000000',
            shadowOpacity: isDarkMode ? 0.35 : 0.08,
            shadowRadius: isDarkMode ? 16 : 8,
          },
        ]}
      >
        {/* ─── Top Section: Header & Place Stamp Here Box ─── */}
        <View style={[styles.topRow, isArabic && styles.rowReverse]}>
          {/* Left Column: Title & Metadata */}
          <View style={[styles.topLeftCol, isArabic && { alignItems: 'flex-end' }]}>
            {/* "STAMPED BY" / Header */}
            <View style={[styles.stampedByRow, isArabic && styles.rowReverse]}>
              <Text style={[styles.stampedByText, { color: paperText }]}>
                {isArabic ? 'مصدق من نظام' : 'STAMPED BY'}
              </Text>
              <TouchableOpacity
                onPress={onEditCategoryPress}
                disabled={!onEditCategoryPress || readOnly}
                activeOpacity={0.7}
                style={[
                  styles.categoryStickerBadge,
                  { backgroundColor: `${color}18`, borderColor: `${color}35` },
                  isArabic && styles.rowReverse,
                ]}
              >
                <Ionicons name={icon as any} size={11} color={color} />
                <Text style={[styles.categoryStickerText, { color }]}>{category}</Text>
              </TouchableOpacity>
            </View>

            {/* Goal Title */}
            <TouchableOpacity
              onPress={onEditPress}
              disabled={!onEditPress || readOnly}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.goalTitle,
                  {
                    color: isCompleted ? paperTextMuted : paperText,
                    textDecorationLine: isCompleted ? 'line-through' : 'none',
                    textAlign: isArabic ? 'right' : 'left',
                  },
                ]}
              >
                {title}
              </Text>
            </TouchableOpacity>

            {/* Goal Description */}
            {Boolean(description) && (
              <Text
                style={[
                  styles.goalDescription,
                  {
                    color: paperTextMuted,
                    textAlign: isArabic ? 'right' : 'left',
                  },
                ]}
                numberOfLines={3}
              >
                {description}
              </Text>
            )}
          </View>

          {/* Right Column: "PLACE STAMP HERE" Box */}
          <TouchableOpacity
            onPress={onToggleGoal}
            disabled={!onToggleGoal || readOnly}
            activeOpacity={0.85}
            style={[
              styles.placeStampBox,
              {
                borderColor: isCompleted ? '#10B981' : dashedBorderColor,
                backgroundColor: isCompleted ? '#10B98114' : 'transparent',
              },
            ]}
          >
            {isCompleted ? (
              <View style={styles.completedStampInside}>
                <Ionicons name="checkmark-done-circle" size={26} color="#10B981" />
                <Text style={styles.stampAchievedText}>
                  {isArabic ? 'مكتمل' : 'STAMPED'}
                </Text>
                <Text style={styles.stampYearSub}>{year}</Text>
              </View>
            ) : (
              <View style={styles.emptyStampInside}>
                <Ionicons name="mail-outline" size={16} color={paperTextMuted} style={{ opacity: 0.6 }} />
                <Text style={[styles.placeStampText, { color: paperTextMuted }]}>
                  {isArabic ? 'ضع الختم\nهنا' : 'PLACE\nSTAMP\nHERE'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ─── Middle Section: Checklists / Milestones with Color Variants ─── */}
        <View style={styles.milestonesSection}>
          {milestones.length === 0 ? (
            /* Standalone Goal Item Row if no sub-milestones yet */
            <View
              style={[
                styles.itemRow,
                isArabic && styles.rowReverse,
                { borderBottomColor: subtleDivider },
              ]}
            >
              {/* Left: Avatar Circle in first vibrant color */}
              <TouchableOpacity
                onPress={onToggleGoal}
                disabled={!onToggleGoal || readOnly}
                activeOpacity={0.7}
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: isCompleted ? '#10B981' : STAMP_COLOR_VARIANTS[0].bg,
                  },
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.avatarText, { color: STAMP_COLOR_VARIANTS[0].text }]}>
                    {title.trim().charAt(0).toUpperCase() || '1'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Middle: Title + Fun Sticker Tag */}
              <TouchableOpacity
                onPress={onToggleGoal}
                disabled={!onToggleGoal || readOnly}
                activeOpacity={0.8}
                style={[styles.itemTextContainer, isArabic && styles.rowReverse]}
              >
                <Text
                  style={[
                    styles.itemTitle,
                    {
                      color: isCompleted ? paperTextMuted : paperText,
                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                      opacity: isCompleted ? 0.6 : 1,
                      textAlign: isArabic ? 'right' : 'left',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {title}
                </Text>

                <View style={[styles.stickerBadge, { backgroundColor: STAMP_COLOR_VARIANTS[0].stickerBg }]}>
                  <Text style={styles.stickerEmoji}>{STAMP_COLOR_VARIANTS[0].sticker}</Text>
                </View>
              </TouchableOpacity>

              {/* Right: NOW / DONE indicator */}
              <View style={[styles.itemMetaGroup, isArabic && styles.rowReverse]}>
                {isCompleted ? (
                  <View style={[styles.statusPill, { backgroundColor: '#10B98118' }]}>
                    <Text style={[styles.statusPillText, { color: '#10B981', fontWeight: '800' }]}>
                      {isArabic ? 'تم' : 'DONE'}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.statusPill, { backgroundColor: '#FF2A9318' }]}>
                    <Text style={[styles.statusPillText, { color: '#FF2A93', fontWeight: '900' }]}>
                      {isArabic ? 'الآن' : 'NOW'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            milestones.map((item, idx) => {
              const variant = STAMP_COLOR_VARIANTS[idx % STAMP_COLOR_VARIANTS.length];
              const isFirstActive = idx === 0 && !item.isCompleted;

              // Character to show inside avatar circle: first letter of task, or index number
              const letterOrNum = item.text.trim().charAt(0).toUpperCase() || `${idx + 1}`;

              return (
                <View
                  key={item.id || String(idx)}
                  style={[
                    styles.itemRow,
                    isArabic && styles.rowReverse,
                    { borderBottomColor: subtleDivider },
                  ]}
                >
                  {/* Left: Avatar Circle in row's vibrant color */}
                  <TouchableOpacity
                    onPress={() => onToggleMilestone?.(item.id)}
                    disabled={!onToggleMilestone || readOnly}
                    activeOpacity={0.7}
                    style={[
                      styles.avatarCircle,
                      {
                        backgroundColor: item.isCompleted ? '#10B981' : variant.bg,
                        borderWidth: variant.border ? 1 : 0,
                        borderColor: variant.border,
                      },
                    ]}
                  >
                    {item.isCompleted ? (
                      <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.avatarText, { color: variant.text }]}>
                        {letterOrNum}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Middle: Title + Fun Sticker Tag */}
                  <TouchableOpacity
                    onPress={() => onToggleMilestone?.(item.id)}
                    disabled={!onToggleMilestone || readOnly}
                    activeOpacity={0.8}
                    style={[styles.itemTextContainer, isArabic && styles.rowReverse]}
                  >
                    <Text
                      style={[
                        styles.itemTitle,
                        {
                          color: item.isCompleted ? paperTextMuted : paperText,
                          textDecorationLine: item.isCompleted ? 'line-through' : 'none',
                          opacity: item.isCompleted ? 0.6 : 1,
                          textAlign: isArabic ? 'right' : 'left',
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {item.text}
                    </Text>

                    {/* Cute sticker badge matching reference */}
                    <View style={[styles.stickerBadge, { backgroundColor: variant.stickerBg }]}>
                      <Text style={styles.stickerEmoji}>{variant.sticker}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Right: Step / Time / Status indicator */}
                  <View style={[styles.itemMetaGroup, isArabic && styles.rowReverse]}>
                    {item.isCompleted ? (
                      <View style={[styles.statusPill, { backgroundColor: '#10B98118' }]}>
                        <Text style={[styles.statusPillText, { color: '#10B981', fontWeight: '800' }]}>
                          {isArabic ? 'تم' : 'DONE'}
                        </Text>
                      </View>
                    ) : isFirstActive ? (
                      <View style={[styles.statusPill, { backgroundColor: '#FF2A9318' }]}>
                        <Text style={[styles.statusPillText, { color: '#FF2A93', fontWeight: '900' }]}>
                          {isArabic ? 'الآن' : 'NOW'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.stepMutedText, { color: paperTextMuted }]}>
                        {isArabic ? `خطوة ${idx + 1}` : `STEP ${idx + 1}`}
                      </Text>
                    )}

                    {onDeleteMilestone && !readOnly && (
                      <TouchableOpacity
                        onPress={() => onDeleteMilestone(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.deleteMilestoneBtn}
                      >
                        <Ionicons name="close" size={14} color={paperTextMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}

          {/* Quick inline add milestone */}
          {onAddMilestone && !readOnly && (
            <View style={[styles.inlineAddRow, isArabic && styles.rowReverse]}>
              <View style={[styles.inlineAddIcon, { backgroundColor: `${color}18` }]}>
                <Ionicons name="add" size={16} color={color} />
              </View>
              <TextInput
                style={[
                  styles.inlineAddInput,
                  { color: paperText, textAlign: isArabic ? 'right' : 'left' },
                ]}
                placeholder={isArabic ? '+ أضف مهمة أو خطوة...' : '+ Add checklist item...'}
                placeholderTextColor={paperTextMuted}
                value={newMilestoneText}
                onChangeText={setNewMilestoneText}
                onSubmitEditing={handleAddSubmit}
                returnKeyType="done"
              />
              {Boolean(newMilestoneText.trim()) && (
                <TouchableOpacity
                  onPress={handleAddSubmit}
                  style={[styles.inlineAddSubmitBtn, { backgroundColor: color }]}
                >
                  <Ionicons name="arrow-up" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ─── Bottom Dispatch Section ("FROM" Postcard Block) ─── */}
        <View style={[styles.bottomDispatchRow, isArabic && styles.rowReverse]}>
          {/* Action buttons on left (Edit, Delete) */}
          <View style={[styles.actionButtonsCol, isArabic && styles.rowReverse]}>
            {onEditPress && !readOnly && (
              <TouchableOpacity
                onPress={onEditPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.dispatchActionBtn, { backgroundColor: '#F1F5F9' }]}
              >
                <Ionicons name="pencil-outline" size={15} color={paperTextMuted} />
              </TouchableOpacity>
            )}

            {onDeletePress && !readOnly && (
              <TouchableOpacity
                onPress={onDeletePress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.dispatchActionBtn, { backgroundColor: '#F1F5F9' }]}
              >
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Postcard Dispatch Address Block on Right (matching reference image) */}
          <View style={[styles.dispatchBlock, isArabic && { alignItems: 'flex-start' }]}>
            <Text style={[styles.dispatchLabel, { color: paperTextMuted }]}>
              {isArabic ? 'من' : 'FROM'}
            </Text>
            <Text style={[styles.dispatchSender, { color: paperText }]}>
              nizam.ai
            </Text>
            <Text style={[styles.dispatchDetail, { color: paperTextMuted }]}>
              {category.toLowerCase()}
            </Text>
            <Text style={[styles.dispatchDetail, { color: paperTextMuted }]}>
              {year} Roadmap
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Perforated Stamp Edge Overlays (Top, Bottom, Left, Right) ─── */}
      {/* Left Perforations */}
      <View style={[styles.edgeHolesColumn, { left: -6 }]} pointerEvents="none">
        {[...Array(verticalHoles)].map((_, i) => (
          <View key={`lh-${i}`} style={[styles.perforationCircle, { backgroundColor: effectiveBackdrop }]} />
        ))}
      </View>

      {/* Right Perforations */}
      <View style={[styles.edgeHolesColumn, { right: -6 }]} pointerEvents="none">
        {[...Array(verticalHoles)].map((_, i) => (
          <View key={`rh-${i}`} style={[styles.perforationCircle, { backgroundColor: effectiveBackdrop }]} />
        ))}
      </View>

      {/* Top Perforations */}
      <View style={[styles.edgeHolesRow, { top: -6 }]} pointerEvents="none">
        {[...Array(horizontalHoles)].map((_, i) => (
          <View key={`th-${i}`} style={[styles.perforationCircle, { backgroundColor: effectiveBackdrop }]} />
        ))}
      </View>

      {/* Bottom Perforations */}
      <View style={[styles.edgeHolesRow, { bottom: -6 }]} pointerEvents="none">
        {[...Array(horizontalHoles)].map((_, i) => (
          <View key={`bh-${i}`} style={[styles.perforationCircle, { backgroundColor: effectiveBackdrop }]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    marginVertical: 10,
    marginHorizontal: 4,
    position: 'relative',
  },
  paperCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  topLeftCol: {
    flex: 1,
  },
  stampedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  stampedByText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  categoryStickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryStickerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 24,
    marginTop: 2,
  },
  goalDescription: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 4,
  },
  placeStampBox: {
    width: 74,
    height: 84,
    borderRadius: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  emptyStampInside: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeStampText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    lineHeight: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  completedStampInside: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  stampAchievedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.8,
  },
  stampYearSub: {
    fontSize: 8,
    fontWeight: '700',
    color: '#10B981',
  },
  milestonesSection: {
    marginTop: 16,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '900',
  },
  itemTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  stickerBadge: {
    width: 22,
    height: 22,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerEmoji: {
    fontSize: 12,
  },
  itemMetaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  stepMutedText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  deleteMilestoneBtn: {
    padding: 2,
  },
  inlineAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  inlineAddIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineAddInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 6,
  },
  inlineAddSubmitBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomDispatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionButtonsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dispatchActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dispatchBlock: {
    alignItems: 'flex-end',
  },
  dispatchLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dispatchSender: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  dispatchDetail: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // ─── Stamp Edge Perforation Cutout Circles ───
  edgeHolesColumn: {
    position: 'absolute',
    top: 14,
    bottom: 14,
    width: 12,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    zIndex: 10,
  },
  edgeHolesRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 12,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    zIndex: 10,
  },
  perforationCircle: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});

export default PostalStampGoalCard;
