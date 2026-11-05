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

export const SHEET_SURFACE_DARK = '#1C0A2A';
export const SHEET_SURFACE_BORDER = 'rgba(201, 166, 242, 0.25)';
export const SHEET_TEXT_TITLE = '#FFFFFF';
export const SHEET_TEXT_MUTED = 'rgba(255, 255, 255, 0.70)';
export const SHEET_VIOLET_PRIMARY = '#A855F7';
export const SHEET_VIOLET_LIGHT = 'rgba(168, 85, 247, 0.18)';
export const SHEET_VIOLET_BORDER = 'rgba(168, 85, 247, 0.35)';

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
              <Ionicons name="close" size={18} color={SHEET_VIOLET_PRIMARY} />
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
    backgroundColor: SHEET_SURFACE_DARK,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: SHEET_SURFACE_BORDER,
    maxHeight: Math.min(SCREEN_HEIGHT * 0.75, 560),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
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
    backgroundColor: SHEET_VIOLET_LIGHT,
    borderWidth: 1,
    borderColor: SHEET_VIOLET_BORDER,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 8,
    backgroundColor: SHEET_SURFACE_DARK,
    justifyContent: 'flex-start',
  },
});

export default FeatureSheet;
