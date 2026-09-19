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

const Header = () => {
    const { colors } = useTheme();
    const { userId, language, isAnonymous } = useAuth();
    const { t, isArabic } = useTranslation(language);
    const isLocalGuest = typeof userId === 'string' && userId.startsWith('guest_');
    const userSettings = useOfflineQuery<any>('auth.getUserSettings', api.auth.getUserSettings, (userId && !isLocalGuest) ? { userId } : "skip");
    const homeStyles = createHomeStyles(colors, isArabic);

    const greeting = isArabic ? `مرحباً، ${userSettings?.name || t.guest}` : `Hi, ${userSettings?.name || 'Guest'}`;

    return (
        <AnimatedWavyHeader
            backgroundColor="transparent"
            waveHeight={0}
            contentStyle={{ paddingBottom: 4 }}
        >
            <View style={[homeStyles.header, { paddingTop: 8, paddingBottom: 4 }, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[homeStyles.headerLeft, isArabic && { alignItems: 'flex-end' }]}>
                    <Text style={[homeStyles.headerGreeting, isArabic && { textAlign: 'right' }]}>{greeting}</Text>
                </View>

                <TouchableOpacity
                    activeOpacity={0.97}
                    style={homeStyles.headerRight}
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
                        color={colors.text}
                    />
                </TouchableOpacity>
            </View>
        </AnimatedWavyHeader>
    );
};

export default Header;