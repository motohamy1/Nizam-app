import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, PanResponder, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { createScrollStackStyles, CARD_ACCENTS, createCardFrame, CardAccent } from '@/assets/styles/scrollStack.styles';
import { Id } from '@/convex/_generated/dataModel';
import { fillColor } from '@/utils/colorUtils';

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
}

export const UpcomingEventsCard: React.FC<UpcomingEventsCardProps> = ({
  events,
  onOpenEventModal,
  onToggleDone,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);

  const frame = createCardFrame(CARD_ACCENTS.lime, isDarkMode, colors.secondaryText);

  // Completed section: hidden by default, revealed by swipe-down or tap.
  const [showCompleted, setShowCompleted] = useState(false);

  // Per-type chip accent: light mode always uses the deep ink so nothing sits
  // as a pale wash-on-wash; dark mode uses the pastel. Reminder uses the card's lime.
  const typeAccent = (kind: 'meeting' | 'appointment' | 'reminder' | 'event'): CardAccent => {
    if (kind === 'meeting') return CARD_ACCENTS.sky;
    if (kind === 'appointment') return CARD_ACCENTS.amber;
    if (kind === 'reminder') return { pastel: fillColor('#e5f19d', isDarkMode), ink: CARD_ACCENTS.lime.ink };
    return CARD_ACCENTS.mint;
  };

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

  // Manual completion only: an item is "completed" solely when its status says
  // so — time passing never moves it here.
  const { upcoming, completed } = useMemo(() => {
    const up: UpcomingEventDisplay[] = [];
    const done: UpcomingEventDisplay[] = [];
    events.forEach((e) => (e.status === 'done' ? done : up).push(e));
    return { upcoming: up, completed: done };
  }, [events]);

  // Swipe down on the Completed bar to reveal, swipe up to hide.
  // useMemo (not useRef) so no ref is read during render; the handlers only
  // touch the stable setter, so an empty dep list is safe.
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
    let accent: CardAccent = typeAccent('event');

    if (isMeeting) {
      chipIcon = "videocam-outline";
      accent = typeAccent('meeting');
      typeBadgeText = t.typeMeeting;
    } else if (isAppointment) {
      chipIcon = "calendar-outline";
      accent = typeAccent('appointment');
      typeBadgeText = t.typeAppointment;
    } else if (isReminder) {
      chipIcon = "alarm-outline";
      accent = typeAccent('reminder');
      typeBadgeText = t.typeReminder;
    } else {
      typeBadgeText = t.typeEvent;
    }

    const chipFg = isDarkMode ? accent.pastel : accent.ink;
    const chipWash = isDarkMode ? `${accent.pastel}33` : `${accent.pastel}8C`;
    const badgeWash = isDarkMode ? `${accent.pastel}26` : `${accent.pastel}66`;

    return (
      <View key={evt._id} style={[styles.eventRow, isDone && { opacity: 0.72 }]}>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
          onPress={() => onOpenEventModal(evt)}
          activeOpacity={0.7}
        >
          {/* Time Badge with dynamic type-aware icon */}
          <View style={[styles.eventTimeChip, { backgroundColor: chipWash }]}>
            <Ionicons name={chipIcon as any} size={13} color={chipFg} />
            <Text style={[styles.eventTimeText, { color: chipFg }]}>
              {formatTime(evt.startTime || evt.date)}
            </Text>
          </View>

          {/* Event Info */}
          <View style={[styles.eventInfo, { flex: 1, minWidth: 0 }]}>
            <View style={[{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, width: '100%' }]}>
              <Text
                style={[styles.eventTitle, { flex: 1, flexShrink: 1 }, isDone && { textDecorationLine: 'line-through', color: colors.textMuted }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {evt.title}
              </Text>
              {typeBadgeText ? (
                <View style={{ backgroundColor: badgeWash, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4, flexShrink: 0 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: chipFg }}>{typeBadgeText}</Text>
                </View>
              ) : null}
            </View>

            {evt.description ? (
              <View style={[styles.eventMeta, { width: '100%' }]}>
                <Ionicons name="document-text-outline" size={12} color={colors.textMuted} style={{ flexShrink: 0 }} />
                <Text style={[styles.eventMetaText, { flex: 1, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">{evt.description}</Text>
              </View>
            ) : null}

            {(evt.location || evt.meetingLink) && (
              <View style={[styles.eventMeta, { width: '100%' }]}>
                {evt.location ? (
                  <>
                    <Ionicons name="location-outline" size={12} color={colors.textMuted} style={{ flexShrink: 0 }} />
                    <Text style={[styles.eventMetaText, { flex: 1, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">{evt.location}</Text>
                  </>
                ) : null}
                {evt.meetingLink ? (
                  <>
                    <Ionicons name="videocam-outline" size={12} color={isDarkMode ? CARD_ACCENTS.sky.pastel : CARD_ACCENTS.sky.ink} style={{ flexShrink: 0 }} />
                    <Text style={[styles.eventMetaText, { color: isDarkMode ? CARD_ACCENTS.sky.pastel : CARD_ACCENTS.sky.ink, flex: 1, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                      {isArabic ? 'رابط الاجتماع' : 'Meeting Link'}
                    </Text>
                  </>
                ) : null}
              </View>
            )}

            {evt.repeatPeriod && evt.repeatPeriod !== 'none' ? (
              <View style={[styles.eventMeta, { width: '100%' }]}>
                <Ionicons name="repeat-outline" size={12} color={chipFg} style={{ flexShrink: 0 }} />
                <Text style={[styles.eventMetaText, { color: chipFg, flex: 1, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                  {`${t.repeatEvery} ${repeatUnitLabel(evt.repeatPeriod)} × ${evt.repeatCount || 1} ${t.repeatTimes}`}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Manual done / restore */}
        {onToggleDone ? (
          <TouchableOpacity
            onPress={() => handleToggleDone(evt)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ paddingHorizontal: 4, flexShrink: 0 }}
            accessibilityRole="button"
            accessibilityLabel={isDone ? (t.restoreEvent || 'Restore') : (t.markDone || 'Mark as done')}
          >
            <Ionicons
              name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={isDone ? colors.success : colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}

        {/* Edit Icon */}
        <Ionicons name={isArabic ? "chevron-back" : "chevron-forward"} size={16} color={colors.textMuted} style={{ flexShrink: 0, marginHorizontal: 4 }} />
      </View>
    );
  };

  return (
    <View style={[styles.card, { borderColor: frame.edge }]}>
      {/* Header */}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={() => onOpenEventModal()}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: frame.badgeBg }]}>
            <Ionicons name="calendar" size={20} color={frame.badgeFg} />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={styles.cardTitle}>{t.remindersAndEvents}</Text>
            <Text style={styles.cardSubtitle}>
              {upcoming.length} {t.remindersAndEventsSubtitle}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.headerPill, { backgroundColor: frame.pillBg }]}
          onPress={() => onOpenEventModal()}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={15} color={frame.pillFg} />
          <Text style={[styles.headerPillText, { color: frame.pillFg }]}>{isArabic ? 'إضافة' : 'Add'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Body: Events list with Nested Scroll or Empty State */}
      {upcoming.length === 0 && completed.length === 0 ? (
        <View style={styles.emptyCardContent}>
          <Ionicons name="notifications-outline" size={28} color={frame.fg} />
          <Text style={styles.emptyCardTitle}>{t.noUpcomingRemindersEvents}</Text>
          <TouchableOpacity 
            style={[styles.emptyCardBtn, { borderColor: frame.border }]} 
            onPress={() => onOpenEventModal()}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={frame.fg} />
            <Text style={[styles.emptyCardBtnText, { color: frame.fg }]}>{t.addReminder}</Text>
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
              <Ionicons name="checkmark-done-outline" size={22} color={frame.fg} />
              <Text style={[styles.emptyCardTitle, { fontSize: 12 }]}>
                {isArabic ? 'لا توجد عناصر قادمة' : 'Nothing upcoming'}
              </Text>
            </View>
          )}

          {/* Completed bar — swipe down (or tap) to reveal the done items */}
          {completed.length > 0 ? (
            <View style={{ borderTopWidth: 1, borderTopColor: frame.edge, marginTop: 4 }}>
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
                  }}
                >
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-done-circle-outline" size={16} color={frame.fg} />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: frame.fg }}>
                      {t.eventCompleted} ({completed.length})
                    </Text>
                  </View>
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    {!showCompleted ? (
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>
                        {t.swipeOrTapToShow}
                      </Text>
                    ) : null}
                    <Ionicons
                      name={showCompleted ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.textMuted}
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
      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={styles.footerActionBtn}
          onPress={() => onOpenEventModal()}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerActionText}>{t.quickEdit}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onOpenEventModal()}>
          <Text style={[styles.footerHintText, { color: frame.fg }]}>{t.addReminder} +</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UpcomingEventsCard;
