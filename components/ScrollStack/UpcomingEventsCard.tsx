import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, PanResponder, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { 
  createScrollStackStyles, 
  STACK_CARD_PALETTES, 
  createMonthCardFrame, 
  MonthPalette 
} from '@/assets/styles/scrollStack.styles';
import { Id } from '@/convex/_generated/dataModel';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface UpcomingEventDisplay {
  _id: Id<"todos">;
  title: string;
  date: number;
  startTime?: number;
  endTime?: number;
  location?: string;
  meetingLink?: string;
  priority?: string;
  type?: string;
  description?: string;
  repeatPeriod?: string;
  repeatCount?: number;
  status?: string;
}

interface UpcomingEventsCardProps {
  events: UpcomingEventDisplay[];
  onOpenEventModal: (eventToEdit?: UpcomingEventDisplay) => void;
  onToggleDone?: (id: Id<"todos">, currentStatus?: string) => void;
  palette?: MonthPalette;
}

export const UpcomingEventsCard: React.FC<UpcomingEventsCardProps> = ({
  events,
  onOpenEventModal,
  onToggleDone,
  palette = STACK_CARD_PALETTES.upcoming,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);
  const frame = createMonthCardFrame(palette, isDarkMode, colors);

  // Completed section: hidden by default, revealed by swipe-down or tap.
  const [showCompleted, setShowCompleted] = useState(false);

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString(
      isArabic ? 'ar-SA' : 'en-US',
      { hour: '2-digit', minute: '2-digit' }
    );
  };

  const repeatUnitLabel = (period?: string) => {
    if (period === 'hourly') return t.repeatHourly;
    if (period === 'daily') return t.repeatDaily;
    if (period === 'weekly') return t.repeatWeekly;
    if (period === 'monthly') return t.repeatMonthly;
    if (period === 'yearly') return t.repeatYearly;
    return '';
  };

  const { upcoming, completed } = useMemo(() => {
    const up: UpcomingEventDisplay[] = [];
    const done: UpcomingEventDisplay[] = [];
    events.forEach((e) => (e.status === 'done' ? done : up).push(e));
    return { upcoming: up, completed: done };
  }, [events]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 14) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowCompleted(true);
          } else if (g.dy < -14) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowCompleted(false);
          }
        },
      }),
    []
  );

  const toggleCompletedSection = () => {
    Haptics.selectionAsync().catch(() => {});
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCompleted((v) => !v);
  };

  const handleToggleDone = (evt: UpcomingEventDisplay) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggleDone?.(evt._id, evt.status);
  };

  const renderRow = (evt: UpcomingEventDisplay, isDone: boolean) => {
    const isMeeting = evt.type === 'meeting' || Boolean(evt.meetingLink);
    const isAppointment = evt.type === 'appointment';
    const isReminder = evt.type === 'reminder';

    let chipIcon = "time-outline";
    let typeBadgeText = "";

    if (isMeeting) {
      chipIcon = "videocam-outline";
      typeBadgeText = t.typeMeeting;
    } else if (isAppointment) {
      chipIcon = "calendar-outline";
      typeBadgeText = t.typeAppointment;
    } else if (isReminder) {
      chipIcon = "alarm-outline";
      typeBadgeText = t.typeReminder;
    } else {
      typeBadgeText = t.typeEvent;
    }

    const timeFormatted = formatTime(evt.startTime || evt.date);

    return (
      <View 
        key={evt._id} 
        style={[
          styles.eventRow, 
          { backgroundColor: frame.rowBg, borderColor: frame.rowBorder },
          isDone && { opacity: 0.65 }
        ]}
      >
        {/* Top Header Row of the Item: Time badge + Type badge on leading side, Checkbox + Details arrow on trailing side */}
        <View style={styles.eventRowHeader}>
          <TouchableOpacity
            style={styles.eventRowHeaderLeft}
            onPress={() => onOpenEventModal(evt)}
            activeOpacity={0.7}
          >
            {/* Time Badge with dynamic type-aware icon */}
            {timeFormatted ? (
              <View style={[styles.eventTimeChip, { backgroundColor: frame.pillBg }]}>
                <Ionicons name={chipIcon as any} size={12} color={frame.text} />
                <Text style={[styles.eventTimeText, { color: frame.text }]}>
                  {timeFormatted}
                </Text>
              </View>
            ) : null}

            {/* Type badge */}
            {typeBadgeText ? (
              <View style={[styles.eventTypeBadge, { backgroundColor: frame.pillBg }]}>
                <Text style={[styles.eventTypeBadgeText, { color: frame.text }]}>{typeBadgeText}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          <View style={styles.eventRowHeaderRight}>
            {/* Manual done / restore circle */}
            {onToggleDone ? (
              <TouchableOpacity
                onPress={() => handleToggleDone(evt)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.eventCheckCircle,
                  {
                    borderColor: isDone ? frame.accent : 'rgba(255, 255, 255, 0.40)',
                    backgroundColor: isDone ? frame.accent : 'transparent',
                  }
                ]}
                accessibilityRole="button"
                accessibilityLabel={isDone ? (t.restoreEvent || 'Restore') : (t.markDone || 'Mark as done')}
              >
                {isDone && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ) : null}

            {/* Edit / Detail Icon */}
            <TouchableOpacity
              onPress={() => onOpenEventModal(evt)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ paddingLeft: 2 }}
            >
              <Ionicons 
                name={isArabic ? "chevron-back" : "chevron-forward"} 
                size={15} 
                color={frame.textMuted} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Body: Title given 100% width and up to 2 lines so it never gets cut off */}
        <TouchableOpacity
          onPress={() => onOpenEventModal(evt)}
          activeOpacity={0.7}
          style={styles.eventBody}
        >
          <Text
            style={[
              styles.eventTitle, 
              { color: frame.text }, 
              isDone && { textDecorationLine: 'line-through', opacity: 0.55 }
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {evt.title}
          </Text>

          {evt.description ? (
            <View style={styles.eventMeta}>
              <Ionicons name="document-text-outline" size={12} color={frame.textMuted} style={{ flexShrink: 0 }} />
              <Text style={[styles.eventMetaText, { color: frame.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                {evt.description}
              </Text>
            </View>
          ) : null}

          {(evt.location || evt.meetingLink || (evt.repeatPeriod && evt.repeatPeriod !== 'none')) ? (
            <View style={styles.eventFooterMeta}>
              {evt.location ? (
                <View style={styles.eventMetaTag}>
                  <Ionicons name="location-outline" size={12} color={frame.textMuted} style={{ flexShrink: 0 }} />
                  <Text style={[styles.eventMetaTagText, { color: frame.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                    {evt.location}
                  </Text>
                </View>
              ) : null}

              {evt.meetingLink ? (
                <View style={styles.eventMetaTag}>
                  <Ionicons name="videocam-outline" size={12} color={frame.accent} style={{ flexShrink: 0 }} />
                  <Text style={[styles.eventMetaTagText, { color: frame.accent, fontWeight: '700' }]} numberOfLines={1} ellipsizeMode="tail">
                    {isArabic ? 'رابط الاجتماع' : 'Meeting Link'}
                  </Text>
                </View>
              ) : null}

              {evt.repeatPeriod && evt.repeatPeriod !== 'none' ? (
                <View style={styles.eventMetaTag}>
                  <Ionicons name="repeat-outline" size={12} color={frame.textMuted} style={{ flexShrink: 0 }} />
                  <Text style={[styles.eventMetaTagText, { color: frame.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                    {`${t.repeatEvery || 'Every'} ${repeatUnitLabel(evt.repeatPeriod)} × ${evt.repeatCount || 1} ${t.repeatTimes || 'times'}`}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[frame.gradTop, frame.gradBottom]}
      style={[styles.card, { borderColor: frame.cardBorder, overflow: 'hidden' }] }
    >
      {/* Header */}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={() => onOpenEventModal()}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: frame.badgeBg, flexShrink: 0 }]}>
            <Ionicons name="calendar" size={18} color={frame.badgeFg} />
          </View>
          <View style={[{ flex: 1, minWidth: 0 }, isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            <Text style={[styles.cardTitle, { color: frame.text }]} numberOfLines={1} ellipsizeMode="tail">
              {t.remindersAndEvents}
            </Text>
            <Text style={[styles.cardSubtitle, { color: frame.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
              {upcoming.length} {t.remindersAndEventsSubtitle}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Body: Events list with Nested Scroll or Empty State */}
      {upcoming.length === 0 && completed.length === 0 ? (
        <View style={styles.emptyCardContent}>
          <Ionicons name="notifications-outline" size={28} color={frame.accent} />
          <Text style={[styles.emptyCardTitle, { color: frame.text }]}>{t.noUpcomingRemindersEvents}</Text>
          <TouchableOpacity 
            style={[styles.emptyCardBtn, { backgroundColor: frame.pillBg, borderColor: frame.cardBorder }]} 
            onPress={() => onOpenEventModal()}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={frame.text} />
            <Text style={[styles.emptyCardBtnText, { color: frame.text }]}>{t.addReminder}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {upcoming.length > 0 ? (
            <ScrollView
              style={styles.eventScrollView}
              contentContainerStyle={styles.eventScrollContent}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              overScrollMode="never"
              decelerationRate="fast"
              scrollEventThrottle={16}
            >
              {upcoming.map((evt) => renderRow(evt, false))}
            </ScrollView>
          ) : (
            <View style={[styles.emptyCardContent, { paddingVertical: 14 }]}>
              <Ionicons name="checkmark-done-outline" size={22} color={frame.accent} />
              <Text style={[styles.emptyCardTitle, { fontSize: 12, color: frame.text }]}>
                {isArabic ? 'لا توجد عناصر قادمة' : 'Nothing upcoming'}
              </Text>
            </View>
          )}

          {/* Completed bar — swipe down (or tap) to reveal the done items */}
          {completed.length > 0 ? (
            <View style={{ borderTopWidth: 1, borderTopColor: frame.footerBorder, marginTop: 4 }}>
              <View {...panResponder.panHandlers}>
                <TouchableOpacity
                  onPress={toggleCompletedSection}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: isArabic ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: frame.pillBg,
                    borderRadius: 10,
                    marginVertical: 4,
                  }}
                >
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-done-circle-outline" size={16} color={frame.text} />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: frame.text }}>
                      {t.eventCompleted} ({completed.length})
                    </Text>
                  </View>
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    {!showCompleted ? (
                      <Text style={{ fontSize: 10, color: frame.textMuted }}>
                        {t.swipeOrTapToShow}
                      </Text>
                    ) : null}
                    <Ionicons
                      name={showCompleted ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={frame.textMuted}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {showCompleted ? (
                <View style={{ paddingBottom: 6 }}>
                  {completed.map((evt) => renderRow(evt, true))}
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      {/* Footer */}
      <View style={[styles.cardFooter, { borderTopColor: frame.footerBorder }]}>
        <TouchableOpacity 
          style={styles.footerActionBtn}
          onPress={() => onOpenEventModal()}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={frame.footerText} />
          <Text style={[styles.footerActionText, { color: frame.footerText }]}>{t.quickEdit}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onOpenEventModal()}>
          <Text style={[styles.footerHintText, { color: frame.text, fontWeight: '700' }]}>{t.addReminder} +</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default UpcomingEventsCard;
