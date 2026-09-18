import ScreenBackground from '@/components/ScreenBackground';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TouchableWithoutFeedback, StatusBar, Switch, Platform, Modal, TextInput, Alert, Image, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import { createSettingsStyles } from '@/assets/styles/settings.styles';
import { api } from '@/convex/_generated/api';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from 'convex/react';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/utils/i18n';
import * as ImagePicker from 'expo-image-picker';
import { useScreenGuide } from '@/hooks/useScreenGuide';
import ScreenGuide from '@/components/ScreenGuide';
import type { GuideTip } from '@/components/ScreenGuide';
import { getNotificationSound, setNotificationSound, SOUND_META, NotificationSound } from '@/utils/soundPreferences';
import { updateNotificationSoundPreference } from '@/utils/notifications';
import AnimatedWavyHeader from '@/components/AnimatedWavyHeader';

const Settings = () => {
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const { userId, signOut, isAnonymous, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createSettingsStyles(colors, isArabic);
  const router = useRouter();
  const { showGuide, dismissGuide } = useScreenGuide('settings');

  const settingsTips: GuideTip[] = isArabic ? [
    { icon: 'person-circle-outline', title: 'ملفك الشخصي', description: 'اضغط على صورتك لتغييرها، أو اضغط على أيقونة القلم لتعديل اسمك.', accentColor: colors.primary },
    { icon: 'moon-outline', title: 'الوضع الداكن', description: 'فعّل الوضع الداكن لراحة عينيك في الإضاءة المنخفضة.', accentColor: colors.warning },
    { icon: 'language-outline', title: 'تغيير اللغة', description: 'بدّل بين العربية والإنجليزية من إعدادات التفضيلات.', accentColor: colors.success },
  ] : [
    { icon: 'person-circle-outline', title: 'Your Profile', description: 'Tap your photo to change it, or tap the edit icon to update your name.', accentColor: colors.primary },
    { icon: 'moon-outline', title: 'Dark Mode', description: 'Toggle dark mode for a comfortable experience in low light.', accentColor: colors.warning },
    { icon: 'language-outline', title: 'Switch Language', description: 'Switch between Arabic and English from the Preferences section.', accentColor: colors.success },
  ];
  
  const isLocalGuest = typeof userId === 'string' && userId.startsWith('guest_');
  const userSettings = useOfflineQuery<any>('auth.getUserSettings', api.auth.getUserSettings, (userId && !isLocalGuest) ? { userId } : "skip");
  const updateSettings = useOfflineMutation(api.auth.updateSettings, "auth:updateSettings");
  const generateUploadUrl = useMutation(api.auth.generateUploadUrl);
  const updateProfilePicture = useMutation(api.auth.updateProfilePicture);

  const [isEditModalVisible, setIsEditModalVisible] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSoundModalVisible, setIsSoundModalVisible] = React.useState(false);
  const [notificationSound, setNotificationSoundState] = React.useState<NotificationSound>('default');

  React.useEffect(() => {
    getNotificationSound().then(setNotificationSoundState);
  }, []);

  const handleSoundChange = async (sound: NotificationSound) => {
    await setNotificationSound(sound);
    setNotificationSoundState(sound);
    await updateNotificationSoundPreference(sound);
    if (userId && !isAnonymous) {
      try {
        await updateSettings({ userId, notificationSound: sound } as any);
      } catch(e) {}
    }
    setIsSoundModalVisible(false);
  };

  React.useEffect(() => {
    if (userSettings) {
      setEditName(userSettings.name || '');
      setEditEmail(userSettings.email || '');
    }
  }, [userSettings]);

  const handleUpdateProfile = async () => {
    if (!userId || isAnonymous) return;
    try {
      await updateSettings({
        userId,
        name: editName,
        email: editEmail
      });
      setIsEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (e) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handlePickImage = async () => {
    if (!userId || isAnonymous) return;
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      const { storageId } = await result.json();
      
      await updateProfilePicture({ userId: userId!, storageId });
      Alert.alert("Success", "Profile picture updated");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const todos = useOfflineQuery<any[]>('todos', api.todos.get, userId ? { userId } : "skip") || [];
  const projects = useOfflineQuery<any[]>('projects.getCategories', api.projects.getCategories, userId ? { userId } : "skip") || [];

  const handleToggleNotifications = async () => {
    if (!userId || !userSettings) return;
    await updateSettings({
      userId,
      notificationsEnabled: !userSettings.notificationsEnabled
    });
  };

  const handleToggleLanguage = async () => {
    if (!userId || !userSettings) return;
    const newLang = userSettings.language === 'en' ? 'ar' : 'en';
    await updateSettings({
      userId,
      language: newLang
    });
  };

  const SettingItem = ({ icon, label, value, type = 'chevron', color, onPress, status }: any) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={onPress} 
      activeOpacity={0.97}
      disabled={type === 'switch' && status === undefined}
    >
      <View style={[styles.settingIconWrap, { backgroundColor: color + '14' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.settingLabel, isArabic && { textAlign: 'right' }]}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {type === 'chevron' && <Ionicons name={isArabic ? "chevron-back" : "chevron-forward"} size={16} color={colors.textMuted} style={styles.settingChevron} />}
      {type === 'switch' && (
        <Switch 
          value={status ?? isDarkMode} 
          onValueChange={onPress || toggleDarkMode}
          trackColor={{ false: colors.border, true: colors.primary + '50' }}
          thumbColor={(status ?? isDarkMode) ? colors.primary : colors.surface}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.safeArea}>
        <AnimatedWavyHeader backgroundColor={colors.bg} waveHeight={10} contentStyle={{ paddingBottom: 2 }}>
          <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, { paddingTop: 4, paddingBottom: 4 }]}>
            <Text style={[styles.headerTitle, isArabic && { textAlign: 'right' }]}>
              {t.settings}
            </Text>
          </Animated.View>
        </AnimatedWavyHeader>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 12 }]} showsVerticalScrollIndicator={false}>

          {/* Profile Section */}
          <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.profileOuter}>
            <View style={styles.profileInner}>
              <View style={styles.profileRow}>
                <TouchableOpacity 
                  style={styles.avatarContainer}
                  onPress={handlePickImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : userSettings?.profilePictureUrl ? (
                    <Image source={{ uri: userSettings.profilePictureUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="person" size={36} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.avatarEditButton}>
                    <Ionicons name="camera" size={14} color={colors.primaryText} />
                  </View>
                </TouchableOpacity>
                <View style={[styles.profileInfo, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={styles.profileName}>
                    {isAnonymous ? t.guest : (userSettings?.name || '...')}
                  </Text>
                  <Text style={styles.profileEmail}>
                    {isAnonymous ? t.signInToSync : (userSettings?.email || '...')}
                  </Text>
                </View>
                {isAnonymous ? (
                  <TouchableOpacity style={styles.profileEditBtn} onPress={() => router.push('/auth')}>
                    <Ionicons name={isArabic ? "log-in" : "log-in-outline"} size={24} color={colors.primary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.profileEditBtn} onPress={() => setIsEditModalVisible(true)}>
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Profile Edit Modal */}
          <Modal visible={isEditModalVisible} transparent animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
            <TouchableWithoutFeedback onPress={() => setIsEditModalVisible(false)}>
              <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={styles.inputLabel}>Display Name</Text>
                  <TextInput 
                    style={styles.textInput} 
                    value={editName} 
                    onChangeText={setEditName}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textMuted}
                  />
                  
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput 
                    style={styles.textInput} 
                    value={editEmail} 
                    onChangeText={setEditEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  
                  <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Sound Selection Modal */}
          <Modal visible={isSoundModalVisible} animationType="slide" transparent onRequestClose={() => setIsSoundModalVisible(false)}>
            <TouchableWithoutFeedback onPress={() => setIsSoundModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                <Text style={styles.modalTitle}>{isArabic ? 'اختر النغمة' : 'Select Sound'}</Text>
                
                <TouchableOpacity
                  style={[styles.soundOption, notificationSound === 'default' && styles.soundOptionActive]}
                  onPress={() => handleSoundChange('default')}
                >
                  <Ionicons name="notifications-outline" size={22} color={notificationSound === 'default' ? colors.primary : colors.textMuted} />
                  <Text style={styles.soundOptionLabel}>{isArabic ? 'أصوات مخصصة لكل نوع (موصى به)' : 'Curated per-type sounds (recommended)'}</Text>
                  {notificationSound === 'default' && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>

                {SOUND_META.map((s) => (
                  <TouchableOpacity
                    key={s.file}
                    style={[styles.soundOption, notificationSound === s.file && styles.soundOptionActive]}
                    onPress={() => handleSoundChange(s.file)}
                  >
                    <Ionicons name="musical-note-outline" size={22} color={notificationSound === s.file ? colors.primary : colors.textMuted} />
                    <Text style={styles.soundOptionLabel}>
                      {isArabic ? s.labelAr : s.labelEn} — {isArabic ? s.purposeAr : s.purposeEn}
                    </Text>
                    {notificationSound === s.file && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsSoundModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>{t.cancel || 'Cancel'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
          </Modal>

          {/* Preferences */}
          <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.sectionGroup}>
            <Text style={[styles.sectionGroupLabel, isArabic && { textAlign: 'right' }]}>
              {t.preferences}
            </Text>
            <View style={styles.card}>
              <SettingItem 
                icon="moon-outline" 
                label={t.darkMode} 
                type="switch" 
                color={colors.primary} 
                onPress={toggleDarkMode}
                status={isDarkMode}
              />
              <View style={styles.settingRowDivider} />
              <SettingItem 
                icon="notifications-outline" 
                label={t.notifications} 
                type="switch"
                status={userSettings?.notificationsEnabled}
                onPress={handleToggleNotifications}
                color={colors.danger} 
              />
              <View style={styles.settingRowDivider} />
              <SettingItem 
                icon="musical-notes-outline" 
                label={isArabic ? 'نغمة الإشعار' : 'Notification Sound'}
                value={notificationSound === 'default' ? (isArabic ? 'مخصصة لكل نوع' : 'Per-type') : (SOUND_META.find(s => s.file === notificationSound)?.[isArabic ? 'labelAr' : 'labelEn'] ?? (isArabic ? 'مخصصة' : 'Custom'))}
                onPress={() => setIsSoundModalVisible(true)}
                color={colors.warning} 
              />
              <View style={styles.settingRowDivider} />
              <SettingItem 
                icon="language-outline" 
                label={t.language} 
                value={isArabic ? 'العربية' : 'English'}
                onPress={handleToggleLanguage}
                color={colors.success} 
              />
            </View>
          </Animated.View>

          {/* Statistics */}
          <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.sectionGroup}>
            <Text style={[styles.sectionGroupLabel, isArabic && { textAlign: 'right' }]}>
              {t.statistics}
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{todos.length}</Text>
                <Text style={styles.statLabel}>{t.totalTasks}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {todos.filter((t: any) => t.status === 'done').length}
                </Text>
                <Text style={styles.statLabel}>{t.completed}</Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{projects.length}</Text>
                <Text style={styles.statLabel}>{t.activeWorkspaces}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {todos.length > 0 
                    ? Math.round((todos.filter((t: any) => t.status === 'done').length / todos.length) * 100) 
                    : 0}%
                </Text>
                <Text style={styles.statLabel}>{t.completionRate}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Utility */}
          <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.sectionGroup}>
            <Text style={[styles.sectionGroupLabel, isArabic && { textAlign: 'right' }]}>
              {t.project}
            </Text>
            <View style={styles.card}>
              <SettingItem 
                icon="shield-checkmark-outline" 
                label={t.privacy} 
                color={colors.success} 
              />
              <View style={styles.settingRowDivider} />
              <SettingItem 
                icon="help-circle-outline" 
                label={t.help} 
                color={colors.warning} 
              />
              <View style={styles.settingRowDivider} />
              <SettingItem 
                icon="information-circle-outline" 
                label={t.about} 
                color={colors.primary} 
              />
            </View>
            
            <TouchableOpacity style={[styles.logoutButton, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }]} onPress={signOut}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={styles.logoutText}>{t.logout}</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.versionText}>VERSION 1.0.4 (BETA)</Text>
        </ScrollView>
      </SafeAreaView>

      <ScreenGuide visible={showGuide} tips={settingsTips} onDismiss={dismissGuide} isArabic={isArabic} />
    </View>
  );
};

export default Settings;