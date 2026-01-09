import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { login } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            // Perform real API login
            const data = await login(email, password);
            console.log('Login successful:', data);

            if (data.access_token) {
                await signIn(data.access_token);
            } else {
                throw new Error('No access token received');
            }
        } catch (error: any) {
            setLoading(false);
            Alert.alert('Login Failed', error.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
                            <ThemedText style={styles.logoText}>CTP</ThemedText>
                        </View>
                        <ThemedText type="title" style={styles.title}>Welcome Back</ThemedText>
                        <ThemedText style={styles.subtitle}>Sign in to manage your sites and tasks</ThemedText>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Email Address</ThemedText>
                            <TextInput
                                style={[styles.input, { borderColor: theme.neutral + '40', color: theme.text, backgroundColor: theme.background }]}
                                placeholder="email@ctp.eu"
                                placeholderTextColor={theme.icon + '80'}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Password</ThemedText>
                            <TextInput
                                style={[styles.input, { borderColor: theme.neutral + '40', color: theme.text, backgroundColor: theme.background }]}
                                placeholder="••••••••"
                                placeholderTextColor={theme.icon + '80'}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity style={styles.forgotBtn}>
                            <ThemedText style={{ color: theme.primary, fontWeight: 'bold' }}>Forgot Password?</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginBtn, { backgroundColor: theme.primary }]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <ThemedText style={styles.loginBtnText}>Sign In</ThemedText>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <ThemedText style={styles.footerText}>Don't have an account? </ThemedText>
                            <TouchableOpacity onPress={() => router.push('/register')}>
                                <ThemedText style={[styles.linkText, { color: theme.primary }]}>Sign Up</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    logoText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
    },
    title: {
        fontSize: 28,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.6,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        opacity: 0.8,
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 32,
    },
    loginBtn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    footerText: {
        fontSize: 16,
        opacity: 0.6,
    },
    linkText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
