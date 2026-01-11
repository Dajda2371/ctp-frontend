import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { canManageSites, canManageUsers, ROLE_LABELS, UserRole } from '@/constants/roles';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import i18n from '@/i18n';
import { SelectModal } from '@/components/SelectModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

function DrawerToggle() {
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { user } = useAuth();

    return (
        <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={styles.drawerToggle}
        >
            <View style={styles.userInfo}>
                <View style={styles.userTextContainer}>
                    <Text style={[styles.userName, { color: theme.text }]}>{user?.name}</Text>
                    {user?.role && (
                        <Text style={[styles.userRole, { color: theme.icon }]}>
                            {ROLE_LABELS[user.role as UserRole] || user.role}
                        </Text>
                    )}
                </View>
                <IconSymbol size={20} name="person.fill" color={theme.icon} style={{ marginLeft: 6, marginRight: 12 }} />
            </View>
            <IconSymbol size={28} name="line.3.horizontal" color={theme.icon} />
        </TouchableOpacity>
    );
}

function CustomDrawerContent(props: any) {
    const { signOut } = useAuth();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { locale, changeLanguage } = useLanguage();
    const [languageModalVisible, setLanguageModalVisible] = useState(false);

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                <DrawerItemList {...props} />
            </View>
            <View style={styles.logoutContainer}>
                <DrawerItem
                    label={i18n.t('drawer.language')}
                    onPress={() => setLanguageModalVisible(true)}
                    icon={({ color, size }) => (
                        <IconSymbol name="globe" size={size} color={color} />
                    )}
                    style={{ marginBottom: 0 }}
                />
                <DrawerItem
                    label={i18n.t('drawer.logout')}
                    onPress={() => signOut()}
                    icon={({ color, size }) => (
                        <IconSymbol name="door.right.hand.open" size={size} color={color} />
                    )}
                    inactiveTintColor={theme.danger}
                    labelStyle={{ fontWeight: '600' }}
                />
            </View>

            <SelectModal
                visible={languageModalVisible}
                onClose={() => setLanguageModalVisible(false)}
                onSelect={(value) => {
                    changeLanguage(value);
                    setLanguageModalVisible(false);
                }}
                options={[
                    { label: 'English', value: 'en' },
                    { label: 'Čeština', value: 'cs' }
                ]}
                selectedValue={locale}
                title={i18n.t('drawer.selectLanguage')}
            />
        </DrawerContentScrollView>
    );
}

export default function DrawerLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { user } = useAuth();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
                drawerContent={(props) => <CustomDrawerContent {...props} />}
                screenOptions={{
                    drawerActiveTintColor: theme.tint,
                    headerShown: true,
                    headerLeft: () => null,
                    headerRight: () => <DrawerToggle />,
                    drawerPosition: 'right',
                }}
            >
                <Drawer.Screen
                    name="index"
                    options={{
                        drawerLabel: i18n.t('drawer.sites'),
                        title: i18n.t('drawer.sites'),
                        drawerIcon: ({ color }) => <IconSymbol size={24} name="building.2.fill" color={color} />,
                    }}
                />

                <Drawer.Screen
                    name="tasks"
                    options={{
                        drawerLabel: i18n.t('drawer.allTasks'),
                        title: i18n.t('drawer.allTasks'),
                        drawerIcon: ({ color }) => <IconSymbol size={24} name="checklist" color={color} />,
                    }}
                />

                <Drawer.Screen
                    name="my_tasks"
                    options={{
                        drawerLabel: i18n.t('drawer.myTasks'),
                        title: i18n.t('drawer.myTasks'),
                        drawerIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
                    }}
                />

                <Drawer.Screen
                    name="manage_sites"
                    options={{
                        drawerLabel: i18n.t('drawer.siteManagement'),
                        title: i18n.t('drawer.siteManagement'),
                        drawerIcon: ({ color }) => <IconSymbol size={24} name="building.2.crop.circle.fill" color={color} />,
                        drawerItemStyle: { display: canManageSites(user?.role) ? 'flex' : 'none' },
                    }}
                />

                <Drawer.Screen
                    name="users"
                    options={{
                        drawerLabel: i18n.t('drawer.userManagement'),
                        title: i18n.t('drawer.users'),
                        drawerIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
                        drawerItemStyle: { display: canManageUsers(user?.role) ? 'flex' : 'none' },
                    }}
                />
            </Drawer>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    drawerToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
    },
    userRole: {
        fontSize: 11,
        textTransform: 'capitalize',
    },
    userTextContainer: {
        alignItems: 'flex-end',
    },
    logoutContainer: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#ccc',
        paddingBottom: 20,
        marginTop: 'auto',
    },
});
