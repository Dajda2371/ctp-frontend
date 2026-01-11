import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { DrawerToggle } from '../_layout';

export default function ChatLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <Stack screenOptions={{
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerTitleStyle: { color: theme.text },
        }}>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Chat',
                    headerRight: () => <DrawerToggle />
                }}
            />
            <Stack.Screen name="[id]" options={{ title: 'Conversation' }} />
            <Stack.Screen name="create" options={{ title: 'New Chat', presentation: 'modal' }} />
        </Stack>
    );
}
