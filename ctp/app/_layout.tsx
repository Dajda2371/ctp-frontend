import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getToken } from '@/constants/api';
import { AuthProvider } from '@/contexts/AuthContext';

import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';

import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: 'login',
};

function AppContent() {
  const { locale } = useLanguage();
  const colorScheme = useColorScheme();

  const CTPLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.tint,
      background: Colors.light.background,
      card: Colors.light.card,
      text: Colors.light.text,
      border: '#E5E5E5',
      notification: Colors.light.danger,
    },
  };

  const CTPDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.dark.tint,
      background: Colors.dark.background,
      card: Colors.dark.card,
      text: Colors.dark.text,
      border: '#2C2C2C',
      notification: Colors.dark.danger,
    },
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? CTPDarkTheme : CTPLightTheme}>
      <Stack key={locale}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

        if (!token && !inAuthGroup) {
          // Redirect to login if no token and not in auth group
          router.replace('/login');
        } else if (token && inAuthGroup) {
          // Redirect to home if token exists and user is in auth group
          router.replace('/');
        }
      } catch (e) {
        console.error('Auth check failed', e);
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();
  }, [segments]);

  if (!isReady) {
    return null; // Or return a loading spinner
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
