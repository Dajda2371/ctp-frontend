import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { canManageSites, canManageUsers } from '@/constants/roles';

function DrawerToggle() {
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={{ marginRight: 15 }}
        >
            <IconSymbol size={28} name="line.3.horizontal" color={theme.icon} />
        </TouchableOpacity>
    );
}

export default function DrawerLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { user } = useAuth();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
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
                        drawerLabel: 'Sites',
                        title: 'Sites',
                        drawerIcon: ({ color }) => <IconSymbol size={24} name="building.2.fill" color={color} />,
                    }}
                />

                <Drawer.Screen
                    name="tasks"
                    options={{
                        drawerLabel: 'Tasks',
                        title: 'Tasks',
                        drawerIcon: ({ color }) => <IconSymbol size={24} name="checklist" color={color} />,
                    }}
                />

                <Drawer.Screen
                    name="manage_sites"
                    options={{
                        drawerLabel: 'Site Management',
                        title: 'Site Management',
                        drawerIcon: ({ color }) => <IconSymbol size={24} name="building.2.crop.circle.fill" color={color} />,
                        drawerItemStyle: { display: canManageSites(user?.role) ? 'flex' : 'none' },
                    }}
                />

                <Drawer.Screen
                    name="users"
                    options={{
                        drawerLabel: 'User Management',
                        title: 'Users',
                        drawerIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
                        drawerItemStyle: { display: canManageUsers(user?.role) ? 'flex' : 'none' },
                    }}
                />
            </Drawer>
        </GestureHandlerRootView>
    );
}
