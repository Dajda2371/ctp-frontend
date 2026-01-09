import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { register } from '@/constants/api';

export default function RegisterScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await register(email, password);
            // Assuming direct login or navigation to login after success.
            // The implementation plan mentioned navigating to home or login. 
            // "login.tsx navigates to `/` (Home) on success. I'll do the same for register."
            setLoading(false);
            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => router.replace('/') }
            ]);
        } catch (error: any) {
            setLoading(false);
            Alert.alert('Registration Failed', error.message || 'Something went wrong. Please try again.');
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
                        <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
                        <ThemedText style={styles.subtitle}>Sign up to get started</ThemedText>
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

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Confirm Password</ThemedText>
                            <TextInput
                                style={[styles.input, { borderColor: theme.neutral + '40', color: theme.text, backgroundColor: theme.background }]}
                                placeholder="••••••••"
                                placeholderTextColor={theme.icon + '80'}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.loginBtn, { backgroundColor: theme.primary, marginTop: 12 }]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <ThemedText style={styles.loginBtnText}>Sign Up</ThemedText>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
                            <TouchableOpacity onPress={() => router.back()}>
                                <ThemedText style={[styles.linkText, { color: theme.primary }]}>Sign In</ThemedText>
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
        marginBottom: 24,
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
