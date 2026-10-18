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
        <View style={[styles.overlay, { backgroundColor: colors.text + '80' }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.surface,
                  shadowColor: colors.text,
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
                <Text style={[styles.title, { color: colors.text }]}>Set timer & deadline</Text>
                
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Duration</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      keyboardType="numeric"
                      value={hours}
                      onChangeText={setHours}
                      maxLength={2}
                      selectTextOnFocus
                    />
                    <Text style={[styles.label, { color: colors.textMuted }]}>Hours</Text>
                  </View>
                  <Text style={[styles.colon, { color: colors.text }]}>:</Text>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      keyboardType="numeric"
                      value={minutes}
                      onChangeText={setMinutes}
                      maxLength={2}
                      selectTextOnFocus
                    />
                    <Text style={[styles.label, { color: colors.textMuted }]}>Mins</Text>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Deadline</Text>
                <TouchableOpacity 
                  style={[styles.dateButton, { borderColor: colors.border }]} 
                  onPress={() => { setDatePickerMode('dueDate'); setShowDatePicker(true); }}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={[styles.dateButtonText, { color: dueDate ? colors.text : colors.textMuted }]}>
                    {dueDate ? dueDate.toLocaleDateString() : 'No deadline'}
                  </Text>
                  {dueDate && (
                    <TouchableOpacity onPress={() => setDueDate(null)}>
                      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Plan for</Text>
                <TouchableOpacity 
                  style={[styles.dateButton, { borderColor: colors.border }]} 
                  onPress={() => { setDatePickerMode('plannerDate'); setShowDatePicker(true); }}
                >
                  <Ionicons name="calendar-clear-outline" size={20} color={colors.primary} />
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
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
                  <TouchableOpacity style={[styles.button, styles.cancelButton, { borderColor: colors.border }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
                    <Text style={[styles.buttonText, { color: colors.textMuted }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.saveButton, { backgroundColor: colors.primary, shadowColor: colors.text }]} onPress={handleSave} accessibilityRole="button" accessibilityLabel="Save timer settings">
                    <Text style={[styles.buttonText, { color: colors.primaryText }]}>Save settings</Text>
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
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    elevation: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 16,
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
    fontWeight: '500',
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
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});

export default TimerModal;
