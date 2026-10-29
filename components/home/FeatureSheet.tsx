import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SHEET_PURPLE_BG = '#1C0A2A';
export const SHEET_CORAL_ACCENT = '#FF9470';
export const SHEET_PURPLE_BORDER = '#8E2CAC';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeatureSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  isArabic?: boolean;
  children: React.ReactNode;
}

export const FeatureSheet: React.FC<FeatureSheetProps> = ({
  visible,
  onClose,
  title,
  isArabic = false,
  children,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Transparent backdrop: Tapping the free space above closes the widget without adding any dark overlay */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Grab Handle matching page accent #FF9470 */}
          <View style={styles.grabHandle} />

          {/* Header Row */}
          <View
            style={[
              styles.headerRow,
              isArabic && { flexDirection: 'row-reverse' },
            ]}
          >
            <Text
              style={[
                styles.titleText,
                isArabic && { textAlign: 'right' },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={18} color={SHEET_CORAL_ACCENT} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: SHEET_PURPLE_BG,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: SHEET_PURPLE_BORDER,
    maxHeight: SCREEN_HEIGHT * 0.84,
    minHeight: SCREEN_HEIGHT * 0.50,
    shadowColor: '#3B0E4C',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 24,
    overflow: 'hidden',
    display: 'flex',
  },
  grabHandle: {
    width: 42,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: SHEET_CORAL_ACCENT,
    opacity: 0.85,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 44, 172, 0.25)',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 148, 112, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 148, 112, 0.35)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});

export default FeatureSheet;
