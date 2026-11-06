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

export const SHEET_SURFACE_CREAM = '#FAF8F5';
export const SHEET_SURFACE_BORDER = 'rgba(30, 27, 24, 0.08)';
export const SHEET_TEXT_TITLE = '#1E1B18';
export const SHEET_TEXT_MUTED = 'rgba(30, 27, 24, 0.70)';
export const SHEET_ACCENT_PRIMARY = '#1E1B18';
export const SHEET_ACCENT_LIGHT = 'rgba(30, 27, 24, 0.06)';
export const SHEET_ACCENT_BORDER = 'rgba(30, 27, 24, 0.12)';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeatureSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
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
        {/* Transparent backdrop: No darkening layer covering the upper screen */}
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
          {/* Top Bar: Centered Grab Handle + Violet Close Button */}
          <View
            style={[
              styles.topBar,
              isArabic && { flexDirection: 'row-reverse' },
            ]}
          >
            {title ? (
              <Text
                style={[
                  styles.titleText,
                  isArabic && { textAlign: 'right' },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            ) : (
              <View style={styles.topBarSpacer} />
            )}

            {!title && <View style={styles.grabHandle} />}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={18} color={SHEET_ACCENT_PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* Body Content - Aligns naturally from top in normal upper position */}
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
    backgroundColor: 'transparent', // STRICTLY NO EXTRA DARKENING LAYER OVER SCREEN
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: SHEET_SURFACE_CREAM,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: SHEET_SURFACE_BORDER,
    maxHeight: Math.min(SCREEN_HEIGHT * 0.75, 560),
    shadowColor: '#1E1B18',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
  },
  topBarSpacer: {
    width: 32,
    height: 32,
  },
  grabHandle: {
    width: 42,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(30, 27, 24, 0.25)',
    alignSelf: 'center',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: SHEET_TEXT_TITLE,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SHEET_ACCENT_LIGHT,
    borderWidth: 1,
    borderColor: SHEET_ACCENT_BORDER,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 8,
    backgroundColor: SHEET_SURFACE_CREAM,
    justifyContent: 'flex-start',
  },
});

export default FeatureSheet;
