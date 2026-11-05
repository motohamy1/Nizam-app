import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  Alert,
  useWindowDimensions,
  type ScrollViewInstance,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { createScrollStackStyles } from '@/assets/styles/scrollStack.styles';
import { useKeyboard } from '@/hooks/useKeyboard';
import { Id } from '@/convex/_generated/dataModel';

export type EventData = EventManagementData;
export type ManagedItemType = 'reminder' | 'meeting' | 'appointment';

export interface EventManagementData {
  _id?: Id<"todos">;
  id?: Id<"todos">;
  title: string;
  type: 'reminder' | 'meeting' | 'appointment';
  date: number;
  startTime?: number;
  endTime?: number;
  location?: string;
  meetingLink?: string;
  description?: string;
  priority?: string;
  repeatPeriod?: 'none' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatCount?: number;
}

interface EventManagementModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: number;
  eventToEdit?: EventManagementData | null;
  onSaveEvent: (data: EventManagementData) => Promise<void>;
  onDeleteEvent?: (id: Id<"todos">) => Promise<void>;
}

export const EventManagementModal: React.FC<EventManagementModalProps> = ({
  visible,
  onClose,
  initialDate,
  eventToEdit,
  onSaveEvent,
  onDeleteEvent,
}) => {
  const theme = useTheme();
  const colors = {
    ...theme.colors,
    primary: '#6D28D9',
    primaryText: '#FFFFFF',
    border: 'rgba(109, 40, 217, 0.22)',
    textMuted: 'rgba(76, 29, 149, 0.75)',
    surface: 'rgba(255, 255, 255, 0.45)',
    text: '#4C1D95',
  };
  const isDarkMode = true;
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);
  const { height: screenHeight } = useWindowDimensions();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const formScrollRef = useRef<ScrollViewInstance>(null);

  // Scroll the focused input above the keyboard inside the sheet. Android
  // fires the keyboard event late, hence the longer delay.
  const focusScroll = (input: any) => {
    if (!input || !formScrollRef.current) return;
    const delay = Platform.OS === 'android' ? 140 : 40;
    setTimeout(() => {
      input.measureLayout(
        formScrollRef.current as any,
        (_left: number, top: number) => {
          formScrollRef.current?.scrollTo({ y: Math.max(0, top - 24), animated: true });
        },
        () => {}
      );
    }, delay);
  };

  const titleInputRef = useRef<any>(null);
  const locationInputRef = useRef<any>(null);
  const meetingLinkInputRef = useRef<any>(null);
  const notesInputRef = useRef<any>(null);
  const repeatCountInputRef = useRef<any>(null);

  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState<'reminder' | 'meeting' | 'appointment'>('reminder');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [repeatPeriod, setRepeatPeriod] = useState<'none' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setItemType((eventToEdit.type as any) || 'reminder');
      const baseDate = new Date(eventToEdit.startTime || eventToEdit.date);
      setSelectedDate(baseDate);
      setSelectedTime(baseDate);
      setLocation(eventToEdit.location || '');
      setMeetingLink(eventToEdit.meetingLink || '');
      setNotes(eventToEdit.description || '');
      setRepeatPeriod((eventToEdit.repeatPeriod as any) || 'none');
      setRepeatCount(eventToEdit.repeatCount || 1);
    } else {
      const baseDate = initialDate ? new Date(initialDate) : new Date();
      setTitle('');
      setItemType('reminder');
      setSelectedDate(baseDate);
      setSelectedTime(baseDate);
      setLocation('');
      setMeetingLink('');
      setNotes('');
      setRepeatPeriod('none');
      setRepeatCount(1);
    }
    setIsSaving(false);
  }, [eventToEdit, initialDate, visible]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(isArabic ? 'تنبيه' : 'Warning', isArabic ? 'يرجى إدخال العنوان' : 'Please enter a title');
      return;
    }

    try {
      setIsSaving(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const combinedDate = new Date(selectedDate);
      combinedDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

      await onSaveEvent({
        _id: eventToEdit?._id,
        id: eventToEdit?._id,
        title: title.trim(),
        type: itemType,
        date: combinedDate.getTime(),
        startTime: combinedDate.getTime(),
        location: location.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
        description: notes.trim() || undefined,
        repeatPeriod: repeatPeriod,
        repeatCount: repeatPeriod !== 'none' ? repeatCount : undefined,
      });

      onClose();
    } catch {
      Alert.alert(isArabic ? 'خطأ' : 'Error', isArabic ? 'فشل حفظ الموعد' : 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    const editId = eventToEdit?._id;
    if (!editId || !onDeleteEvent) return;
    Alert.alert(
      isArabic ? 'حذف الموعد' : 'Delete Event',
      isArabic ? 'هل أنت متأكد من حذف هذا الموعد؟' : 'Are you sure you want to delete this event?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await onDeleteEvent(editId);
              onClose();
            } catch {
              Alert.alert(isArabic ? 'خطأ' : 'Error', isArabic ? 'فشل الحذف' : 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const typeOptions: { id: 'reminder' | 'meeting' | 'appointment'; label: string; icon: string }[] = [
    { id: 'reminder', label: t.typeReminder, icon: 'alarm-outline' },
    { id: 'meeting', label: t.typeMeeting, icon: 'videocam-outline' },
    { id: 'appointment', label: t.typeAppointment, icon: 'calendar-outline' },
  ];

  const repeatOptions: { id: 'none' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'; label: string }[] = [
    { id: 'none', label: isArabic ? 'بدون تكرار' : 'None' },
    { id: 'hourly', label: isArabic ? 'كل ساعة' : 'Hourly' },
    { id: 'daily', label: isArabic ? 'يومياً' : 'Daily' },
    { id: 'weekly', label: isArabic ? 'أسبوعياً' : 'Weekly' },
    { id: 'monthly', label: isArabic ? 'شهرياً' : 'Monthly' },
    { id: 'yearly', label: isArabic ? 'سنوياً' : 'Yearly' },
  ];

  const dateString = selectedDate.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeString = selectedTime.toLocaleTimeString(isArabic ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const headerTitle = (() => {
    if (eventToEdit) {
      if (itemType === 'meeting') return isArabic ? 'تعديل اجتماع' : 'Edit Meeting';
      if (itemType === 'appointment') return isArabic ? 'تعديل موعد' : 'Edit Appointment';
      return isArabic ? 'تعديل تذكير' : 'Edit Reminder';
    }
    if (itemType === 'meeting') return isArabic ? 'اجتماع جديد' : 'New Meeting';
    if (itemType === 'appointment') return isArabic ? 'موعد جديد' : 'New Appointment';
    return isArabic ? 'تذكير جديد' : 'New Reminder';
  })();

  const repeatSummary = (() => {
    if (repeatPeriod === 'none') return '';
    const unitLabel = (() => {
      if (repeatPeriod === 'hourly') return t.repeatHourly;
      if (repeatPeriod === 'daily') return t.repeatDaily;
      if (repeatPeriod === 'weekly') return t.repeatWeekly;
      if (repeatPeriod === 'monthly') return t.repeatMonthly;
      if (repeatPeriod === 'yearly') return t.repeatYearly;
      return '';
    })();
    return `${t.repeatEvery || 'Every'} ${unitLabel} × ${repeatCount || 1} ${t.repeatTimes || 'times'}`;
  })();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContent,
                {
                  maxHeight: isKeyboardVisible
                    ? Math.max(320, screenHeight - keyboardHeight - (Platform.OS === 'ios' ? 44 : 28))
                    : '90%',
                  marginBottom: keyboardHeight,
                },
              ]}
            >
              {/* Drag Handle in Violet */}
              <View style={styles.modalDragHandle} />

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {headerTitle}
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={24} color="#6D28D9" />
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={formScrollRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 140 : 40 }}
              >
                <View style={styles.modalForm}>
                  {/* Type Selector: Reminder / Meeting / Appointment */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>
                      {isArabic ? 'النوع' : 'Type'}
                    </Text>
                    <View style={styles.modalTypeRow}>
                      {typeOptions.map((opt) => {
                        const active = itemType === opt.id;
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            style={[styles.modalTypeChip, active && styles.modalTypeChipActive]}
                            onPress={() => setItemType(opt.id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name={opt.icon as any}
                              size={15}
                              color={active ? '#FFFFFF' : '#4C1D95'}
                            />
                            <Text style={[styles.modalTypeChipText, active && styles.modalTypeChipTextActive]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Item Title */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>{itemType === 'reminder' ? t.reminderTitle : t.eventTitle}</Text>
                    <TextInput
                      style={styles.modalTextInput}
                      placeholder={
                        itemType === 'reminder'
                          ? (isArabic ? 'مثال: شرب الدواء' : 'e.g., Take the medication')
                          : (isArabic ? 'مثال: اجتماع فريق العمل' : 'e.g., Team Sync Meeting')
                      }
                      placeholderTextColor="rgba(76, 29, 149, 0.45)"
                      value={title}
                      onChangeText={setTitle}
                      ref={titleInputRef}
                      onFocus={() => focusScroll(titleInputRef.current)}
                      autoFocus={!eventToEdit}
                    />
                  </View>

                  {/* Date & Time Selectors */}
                  <View style={styles.modalTimeRow}>
                    {/* Date Picker Button */}
                    <TouchableOpacity
                      style={styles.modalTimeBox}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="calendar-outline" size={18} color="#6D28D9" />
                      <Text style={styles.modalTimeBoxText}>{dateString}</Text>
                    </TouchableOpacity>

                    {/* Time Picker Button */}
                    <TouchableOpacity
                      style={styles.modalTimeBox}
                      onPress={() => setShowTimePicker(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="time-outline" size={18} color="#6D28D9" />
                      <Text style={styles.modalTimeBoxText}>{timeString}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Date Picker Modal (Native) */}
                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_, date) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (date) setSelectedDate(date);
                      }}
                    />
                  )}

                  {/* Time Picker Modal (Native) */}
                  {showTimePicker && (
                    <DateTimePicker
                      value={selectedTime}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_, date) => {
                        setShowTimePicker(Platform.OS === 'ios');
                        if (date) setSelectedTime(date);
                      }}
                    />
                  )}

                  {/* Repeat */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>{t.repeat}</Text>
                    <View style={[styles.modalTypeRow, { flexWrap: 'wrap' }]}>
                      {repeatOptions.map((opt) => {
                        const active = repeatPeriod === opt.id;
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            style={[styles.modalTypeChip, { flex: 0, paddingHorizontal: 12 }, active && styles.modalTypeChipActive]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setRepeatPeriod(opt.id);
                            }}
                            activeOpacity={0.8}
                          >
                            {opt.id !== 'none' && (
                              <Ionicons
                                name="repeat-outline"
                                size={13}
                                color={active ? '#FFFFFF' : '#4C1D95'}
                              />
                            )}
                            <Text style={[styles.modalTypeChipText, active && styles.modalTypeChipTextActive]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {repeatPeriod !== 'none' && (
                      <View
                        style={{
                          flexDirection: isArabic ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 12,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: 'rgba(109, 40, 217, 0.22)',
                          backgroundColor: 'rgba(255, 255, 255, 0.45)',
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#4C1D95', flex: 1 }}>
                          {repeatSummary}
                        </Text>
                        <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.selectionAsync();
                              setRepeatCount((c) => Math.max(1, (c || 1) - 1));
                            }}
                            style={{
                              width: 34, height: 34, borderRadius: 17,
                              alignItems: 'center', justifyContent: 'center',
                              backgroundColor: 'rgba(109, 40, 217, 0.12)',
                              borderWidth: 1, borderColor: 'rgba(109, 40, 217, 0.25)',
                            }}
                          >
                            <Ionicons name="remove" size={18} color="#6D28D9" />
                          </TouchableOpacity>
                          <TextInput
                            style={{
                              minWidth: 44, textAlign: 'center', fontSize: 16, fontWeight: '800',
                              color: '#4C1D95', paddingVertical: 2,
                            }}
                            value={String(repeatCount)}
                            onChangeText={(v) => {
                              const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
                              setRepeatCount(Number.isFinite(n) ? Math.max(1, Math.min(60, n)) : 1);
                            }}
                            ref={repeatCountInputRef}
                            onFocus={() => focusScroll(repeatCountInputRef.current)}
                            keyboardType="number-pad"
                            maxLength={2}
                            selectTextOnFocus
                          />
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.selectionAsync();
                              setRepeatCount((c) => Math.min(60, (c || 1) + 1));
                            }}
                            style={{
                              width: 34, height: 34, borderRadius: 17,
                              alignItems: 'center', justifyContent: 'center',
                              backgroundColor: 'rgba(109, 40, 217, 0.12)',
                              borderWidth: 1, borderColor: 'rgba(109, 40, 217, 0.25)',
                            }}
                          >
                            <Ionicons name="add" size={18} color="#6D28D9" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Optional: Location & Meeting Link */}
                  {itemType !== 'reminder' ? (
                    <>
                      <View style={styles.modalInputGroup}>
                        <Text style={styles.modalInputLabel}>{t.eventLocation}</Text>
                        <TextInput
                          style={styles.modalTextInput}
                          placeholder={isArabic ? 'مثال: قاعة الاجتماعات أو العنوان' : 'e.g., Conference Room B'}
                          placeholderTextColor="rgba(76, 29, 149, 0.45)"
                          value={location}
                          onChangeText={setLocation}
                          ref={locationInputRef}
                          onFocus={() => focusScroll(locationInputRef.current)}
                        />
                      </View>

                      <View style={styles.modalInputGroup}>
                        <Text style={styles.modalInputLabel}>{t.eventMeetingLink}</Text>
                        <TextInput
                          style={styles.modalTextInput}
                          placeholder="https://meet.google.com/..."
                          placeholderTextColor="rgba(76, 29, 149, 0.45)"
                          value={meetingLink}
                          onChangeText={setMeetingLink}
                          keyboardType="url"
                          autoCapitalize="none"
                          ref={meetingLinkInputRef}
                          onFocus={() => focusScroll(meetingLinkInputRef.current)}
                        />
                      </View>
                    </>
                  ) : null}

                  {/* Notes — like attaching a note to a reminder in the Notes page */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>{t.itemNotes}</Text>
                    <TextInput
                      style={styles.modalNotesInput}
                      placeholder={t.itemNotesPlaceholder}
                      placeholderTextColor="rgba(76, 29, 149, 0.45)"
                      value={notes}
                      onChangeText={setNotes}
                      ref={notesInputRef}
                      onFocus={() => focusScroll(notesInputRef.current)}
                      multiline={true}
                      blurOnSubmit={false}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.modalActionRow}>
                    {eventToEdit && onDeleteEvent && (
                      <TouchableOpacity
                        style={styles.modalDeleteBtn}
                        onPress={handleDelete}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.modalSaveBtn}
                      onPress={handleSave}
                      disabled={isSaving}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalSaveBtnText}>{t.save}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default EventManagementModal;
