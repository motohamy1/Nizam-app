import { createHomeStyles } from '@/assets/styles/home.styles'
import useTheme from '@/hooks/useTheme'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/hooks/useAuth'
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { api } from '@/convex/_generated/api'
import React from 'react'
import { Text, View, TouchableOpacity } from 'react-native'
import { useTranslation } from '@/utils/i18n'
import AnimatedWavyHeader from '@/components/AnimatedWavyHeader'

interface HeaderProps {
  tone?: 'default' | 'onLime' | 'purpleShimmer';
}

const Header: React.FC<HeaderProps> = ({ tone = 'default' }) => {
    const { colors } = useTheme();
    const { userId, language, isAnonymous } = useAuth();
    const { t, isArabic } = useTranslation(language);
    const isLocalGuest = typeof userId === 'string' && userId.startsWith('guest_');
    const userSettings = useOfflineQuery<any>('auth.getUserSettings', api.auth.getUserSettings, (userId && !isLocalGuest) ? { userId } : "skip");
    const homeStyles = createHomeStyles(colors, isArabic);

    const greeting = isArabic ? `مرحباً، ${userSettings?.name || t.guest}` : `Hi, ${userSettings?.name || 'Guest'}`;
    const isOnLime = tone === 'onLime';
    const isPurpleShimmer = tone === 'purpleShimmer';

    return (
        <AnimatedWavyHeader
            backgroundColor="transparent"
            waveHeight={0}
            contentStyle={{ paddingBottom: 4 }}
        >
            <View style={[homeStyles.header, { paddingTop: 8, paddingBottom: 4 }, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[homeStyles.headerLeft, isArabic && { alignItems: 'flex-end' }]}>
                    <Text
                      style={[
                        homeStyles.headerGreeting,
                        isOnLime && { color: '#0E1208', fontWeight: '800' },
                        isPurpleShimmer && {
                          color: '#FFFFFF',
                          fontWeight: '800',
                          textShadowColor: 'rgba(0, 0, 0, 0.45)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 4,
                        },
                        isArabic && { textAlign: 'right' },
                      ]}
                    >
                      {greeting}
                    </Text>
                </View>

                <TouchableOpacity
                    activeOpacity={0.88}
                    style={[
                      homeStyles.headerRight,
                      isOnLime && {
                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                        shadowOpacity: 0,
                        elevation: 0,
                      },
                      isPurpleShimmer && {
                        backgroundColor: 'rgba(255, 255, 255, 0.16)',
                        borderColor: 'rgba(255, 255, 255, 0.28)',
                        shadowOpacity: 0,
                        elevation: 0,
                      },
                    ]}
                    onPress={() => {
                      import('@/utils/notifications').then(({ requestPermissionsAsync }) => {
                        requestPermissionsAsync().then(granted => {
                          if (granted) {
                            alert(isArabic ? 'الإشعارات مفعلة ✅' : 'Notifications enabled ✅');
                          } else {
                            alert(isArabic ? 'يرجى مراجعة إعدادات الجهاز لتفعيل الإشعارات' : 'Please check device settings to enable notifications');
                          }
                        });
                      });
                    }}
                >
                    <Ionicons
                        name="notifications-outline"
                        size={20}
                        color={isPurpleShimmer ? '#FFFFFF' : isOnLime ? '#0E1208' : colors.text}
                    />
                </TouchableOpacity>
            </View>
        </AnimatedWavyHeader>
    );
};

export default Header;
