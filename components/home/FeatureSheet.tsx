import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';

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
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDarkMode ? '#171922' : colors.surface,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Grab Handle */}
          <View
            style={[
              styles.grabHandle,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.25)'
                  : 'rgba(0, 0, 0, 0.15)',
              },
            ]}
          />

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
                { color: colors.text },
                isArabic && { textAlign: 'right' },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.text} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: SCREEN_HEIGHT * 0.82,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    overflow: 'hidden',
  },
  grabHandle: {
    width: 42,
    height: 4.5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});

export default FeatureSheet;
