import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  TextInput,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import useTheme from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useKeyboard } from '@/hooks/useKeyboard';

interface TimerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (durationInMs: number, dueDate?: number, date?: number) => void;
  initialDate?: number;
}

const MODAL_PURPLE_BG = '#1C0A2A';
const MODAL_PURPLE_BORDER = '#8E2CAC';
const MODAL_PURPLE_TINT = 'rgba(142, 44, 172, 0.14)';
const MODAL_PURPLE_LINE = 'rgba(142, 44, 172, 0.35)';
const MODAL_CORAL_ACCENT = '#FF9470';

const TimerModal: React.FC<TimerModalProps> = ({ visible, onClose, onSave, initialDate }) => {
  const { colors, isDarkMode } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [plannerDate, setPlannerDate] = useState<Date>(initialDate ? new Date(initialDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'dueDate' | 'plannerDate'>('dueDate');

  const handleSave = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const durationInMs = (h * 60 * 60 * 1000) + (m * 60 * 1000);
    onSave(durationInMs, dueDate?.getTime(), plannerDate.getTime());
    onClose();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (datePickerMode === 'dueDate') {
        setDueDate(selectedDate);
      } else {
        setPlannerDate(selectedDate);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: MODAL_PURPLE_BG,
                  borderWidth: 2,
                  borderColor: MODAL_PURPLE_BORDER,
                  shadowColor: '#8E2CAC',
                  marginBottom: keyboardHeight > 0 ? Math.min(keyboardHeight, 180) : 0,
                  maxHeight: isKeyboardVisible ? Math.max(300, screenHeight - keyboardHeight - 40) : '85%',
                },
              ]}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ alignItems: 'center', paddingBottom: isKeyboardVisible ? 20 : 0 }}
                style={{ width: '100%' }}
              >
                <Text style={[styles.title, { color: '#FFFFFF' }]}>Set timer & deadline</Text>
                
                <Text style={[styles.sectionTitle, { color: 'rgba(255, 255, 255, 0.70)' }]}>Duration</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: '#FFFFFF',
                          borderColor: MODAL_PURPLE_LINE,
                          backgroundColor: MODAL_PURPLE_TINT,
                        },
                      ]}
                      keyboardType="numeric"
                      value={hours}
                      onChangeText={setHours}
                      maxLength={2}
                      selectTextOnFocus
                    />
                    <Text style={[styles.label, { color: 'rgba(255, 255, 255, 0.70)' }]}>Hours</Text>
                  </View>
                  <Text style={[styles.colon, { color: MODAL_CORAL_ACCENT }]}>:</Text>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: '#FFFFFF',
                          borderColor: MODAL_PURPLE_LINE,
                          backgroundColor: MODAL_PURPLE_TINT,
                        },
                      ]}
                      keyboardType="numeric"
                      value={minutes}
                      onChangeText={setMinutes}
                      maxLength={2}
                      selectTextOnFocus
                    />
                    <Text style={[styles.label, { color: 'rgba(255, 255, 255, 0.70)' }]}>Mins</Text>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { color: 'rgba(255, 255, 255, 0.70)' }]}>Deadline</Text>
                <TouchableOpacity 
                  style={[
                    styles.dateButton,
                    {
                      borderColor: MODAL_PURPLE_LINE,
                      backgroundColor: MODAL_PURPLE_TINT,
                    },
                  ]} 
                  onPress={() => { setDatePickerMode('dueDate'); setShowDatePicker(true); }}
                >
                  <Ionicons name="calendar-outline" size={20} color={MODAL_CORAL_ACCENT} />
                  <Text style={[styles.dateButtonText, { color: dueDate ? '#FFFFFF' : 'rgba(255, 255, 255, 0.50)' }]}>
                    {dueDate ? dueDate.toLocaleDateString() : 'No deadline'}
                  </Text>
                  {dueDate && (
                    <TouchableOpacity onPress={() => setDueDate(null)}>
                      <Ionicons name="close-circle" size={20} color={MODAL_CORAL_ACCENT} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: 'rgba(255, 255, 255, 0.70)' }]}>Plan for</Text>
                <TouchableOpacity 
                  style={[
                    styles.dateButton,
                    {
                      borderColor: MODAL_PURPLE_LINE,
                      backgroundColor: MODAL_PURPLE_TINT,
                    },
                  ]} 
                  onPress={() => { setDatePickerMode('plannerDate'); setShowDatePicker(true); }}
                >
                  <Ionicons name="calendar-clear-outline" size={20} color={MODAL_CORAL_ACCENT} />
                  <Text style={[styles.dateButtonText, { color: '#FFFFFF' }]}>
                    {plannerDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={(datePickerMode === 'dueDate' ? dueDate : plannerDate) || new Date()}
                    mode="date"
                    display="default"
                    themeVariant={isDarkMode ? 'dark' : 'light'}
                    onChange={onDateChange}
                    minimumDate={datePickerMode === 'dueDate' ? new Date() : undefined}
                  />
                )}

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton, { borderColor: MODAL_PURPLE_LINE }]}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                  >
                    <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.saveButton,
                      { backgroundColor: MODAL_CORAL_ACCENT, shadowColor: MODAL_CORAL_ACCENT },
                    ]}
                    onPress={handleSave}
                    accessibilityRole="button"
                    accessibilityLabel="Save timer settings"
                  >
                    <Text style={[styles.buttonText, { color: '#14081E' }]}>Save settings</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  inputGroup: {
    alignItems: 'center',
  },
  input: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  colon: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  saveButton: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});

export default TimerModal;
