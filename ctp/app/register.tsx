import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { register } from '@/constants/api';
import i18n from '@/i18n';

export default function RegisterScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert(i18n.t('register.error'), i18n.t('register.missingFields'));
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(i18n.t('register.error'), i18n.t('register.passwordMismatch'));
            return;
        }

        setLoading(true);
        try {
            await register(email, password, name);
            // Assuming direct login or navigation to login after success.
            // The implementation plan mentioned navigating to home or login. 
            // "login.tsx navigates to `/` (Home) on success. I'll do the same for register."
            setLoading(false);
            Alert.alert(i18n.t('register.success'), i18n.t('register.accountCreated'), [
                { text: i18n.t('common.ok'), onPress: () => router.replace('/') }
            ]);
        } catch (error: any) {
            setLoading(false);
            Alert.alert(i18n.t('register.failed'), error.message || i18n.t('common.somethingWentWrong'));
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
                        <ThemedText type="title" style={styles.title}>{i18n.t('register.createAccount')}</ThemedText>
                        <ThemedText style={styles.subtitle}>{i18n.t('register.subtitle')}</ThemedText>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>{i18n.t('users.name')}</ThemedText>
                            <TextInput
                                style={[styles.input, { borderColor: theme.neutral + '40', color: theme.text, backgroundColor: theme.background }]}
                                placeholder={i18n.t('users.namePlaceholder')}
                                placeholderTextColor={theme.icon + '80'}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>{i18n.t('login.email')}</ThemedText>
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
                            <ThemedText style={styles.label}>{i18n.t('login.password')}</ThemedText>
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
                            <ThemedText style={styles.label}>{i18n.t('register.confirmPassword')}</ThemedText>
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
                                <ThemedText style={styles.loginBtnText}>{i18n.t('register.signUp')}</ThemedText>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <ThemedText style={styles.footerText}>{i18n.t('register.alreadyHaveAccount')} </ThemedText>
                            <TouchableOpacity onPress={() => router.back()}>
                                <ThemedText style={[styles.linkText, { color: theme.primary }]}>{i18n.t('login.signIn')}</ThemedText>
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
