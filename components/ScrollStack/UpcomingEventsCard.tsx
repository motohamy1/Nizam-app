import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, PanResponder, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
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
    }

    return (
      <View
        key={evt._id}
        style={[
          styles.eventRow,
          {
            backgroundColor: frame.rowBg,
            borderColor: frame.rowBorder,
            opacity: isDone ? 0.6 : 1,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => onOpenEventModal(evt)}
          activeOpacity={0.8}
          style={{ gap: 4 }}
        >
          {/* Header Row: Time Chip + Type Badge + Action Check */}
          <View style={[styles.eventRowHeader, isArabic ? { flexDirection: 'row-reverse' } : null]}>
            <View style={[styles.eventRowHeaderLeft, isArabic ? { flexDirection: 'row-reverse' } : null]}>
              <View style={[styles.eventTimeChip, { backgroundColor: frame.pillBg }]}>
                <Ionicons name={chipIcon as any} size={12} color={frame.badgeFg} />
                <Text style={[styles.eventTimeText, { color: frame.text }]}>
                  {formatTime(evt.startTime || evt.date)}
                </Text>
              </View>

              {typeBadgeText ? (
                <View style={[styles.eventTypeBadge, { backgroundColor: frame.badgeBg }]}>
                  <Text style={[styles.eventTypeBadgeText, { color: frame.badgeFg }]}>
                    {typeBadgeText}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Check/Complete button */}
            <TouchableOpacity
              onPress={() => handleToggleDone(evt)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.eventCheckCircle,
                {
                  borderColor: isDone ? '#AFE607' : 'rgba(168, 85, 247, 0.40)',
                  backgroundColor: isDone ? '#9333EA' : 'transparent',
                },
              ]}
            >
              {isDone && (
                <Ionicons name="checkmark" size={13} color="#AFE607" />
              )}
            </TouchableOpacity>
          </View>

          {/* Title & Notes */}
          <View style={styles.eventBody}>
            <Text
              style={[
                styles.eventTitle,
                {
                  color: frame.text,
                  textAlign: isArabic ? 'right' : 'left',
                  textDecorationLine: isDone ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {evt.title}
            </Text>

            {evt.description ? (
              <View style={[styles.eventMeta, isArabic ? { flexDirection: 'row-reverse' } : null]}>
                <Ionicons name="document-text-outline" size={12} color={frame.badgeFg} style={{ flexShrink: 0 }} />
                <Text
                  style={[styles.eventMetaText, { color: frame.textMuted }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {evt.description}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Footer Metadata: Location, Meet Link, Repeat */}
          {(evt.location || evt.meetingLink || (evt.repeatPeriod && evt.repeatPeriod !== 'none')) ? (
            <View style={[styles.eventFooterMeta, isArabic ? { flexDirection: 'row-reverse' } : null]}>
              {evt.location ? (
                <View style={styles.eventMetaTag}>
                  <Ionicons name="location-outline" size={12} color={frame.badgeFg} style={{ flexShrink: 0 }} />
                  <Text style={[styles.eventMetaTagText, { color: frame.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                    {evt.location}
                  </Text>
                </View>
              ) : null}

              {evt.meetingLink ? (
                <View style={styles.eventMetaTag}>
                  <Ionicons name="videocam-outline" size={12} color={frame.badgeFg} style={{ flexShrink: 0 }} />
                  <Text style={[styles.eventMetaTagText, { color: frame.badgeFg, fontWeight: '700' }]} numberOfLines={1} ellipsizeMode="tail">
                    {isArabic ? 'انضم للاجتماع' : 'Join Meeting'}
                  </Text>
                </View>
              ) : null}

              {evt.repeatPeriod && evt.repeatPeriod !== 'none' ? (
                <View style={styles.eventMetaTag}>
                  <Ionicons name="repeat-outline" size={12} color={frame.badgeFg} style={{ flexShrink: 0 }} />
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
    <View
      style={[styles.card, { backgroundColor: frame.cardBg, borderColor: 'transparent' }]}
    >
      {/* Header */}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={() => onOpenEventModal()}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(175, 230, 7, 0.22)', borderWidth: 1, borderColor: 'rgba(132, 204, 22, 0.40)', flexShrink: 0 }]}>
            <Ionicons name="calendar" size={18} color="#6D28D9" />
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
      {upcoming.length === 0 && completed.length === 0 ?
        (        <View style={styles.emptyCardContent}>
          <Ionicons name="notifications-outline" size={28} color={frame.accent} />
          <Text style={[styles.emptyCardTitle, { color: frame.text }]}>{t.noUpcomingRemindersEvents}</Text>
          <TouchableOpacity 
            style={[styles.emptyCardBtn, { backgroundColor: 'rgba(175, 230, 7, 0.16)', borderColor: 'rgba(175, 230, 7, 0.35)' }]}
            onPress={() => onOpenEventModal()}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#AFE607" />
            <Text style={[styles.emptyCardBtnText, { color: "#F5F3FF" }]}>{t.addReminder}</Text>
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
                    <Ionicons name="checkmark-done-circle-outline" size={16} color={frame.badgeFg} />
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
                      color={frame.badgeFg}
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
      <View style={[styles.checklistStats, { borderTopColor: frame.footerBorder, marginTop: 6, paddingTop: 8 }]}>
        <TouchableOpacity 
          style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}
          onPress={() => onOpenEventModal()}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={frame.badgeFg} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: frame.text }}>{t.quickEdit}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => onOpenEventModal()}
          style={{
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: frame.pillBg,
            paddingHorizontal: 10,
            paddingVertical: 4.5,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: frame.rowBorder,
          }}
        >
          <Ionicons name="add" size={14} color={frame.badgeFg} />
          <Text style={{ color: frame.text, fontWeight: '800', fontSize: 11.5 }}>{t.addReminder}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UpcomingEventsCard;
