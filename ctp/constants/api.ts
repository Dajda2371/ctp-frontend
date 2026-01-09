export const API_BASE_URL = process.env.EXPO_PUBLIC_BACKED_URL || '';

export async function login(email: string, password: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Login API error:', error);
        throw error;
    }
}

export async function register(email: string, password: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Register API error:', error);
        throw error;
    }
}

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function saveToken(token: string) {
    if (Platform.OS === 'web') {
        try {
            localStorage.setItem('access_token', token);
        } catch (e) {
            console.error('Local storage is not available:', e);
        }
    } else {
        await SecureStore.setItemAsync('access_token', token);
    }
}

export async function getToken() {
    if (Platform.OS === 'web') {
        try {
            return localStorage.getItem('access_token');
        } catch (e) {
            console.error('Local storage is not available:', e);
            return null;
        }
    } else {
        return await SecureStore.getItemAsync('access_token');
    }
}

export async function getUsers() {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch users');
        }

        return await response.json();
    } catch (error) {
        console.error('getUsers API error:', error);
        throw error;
    }
}

export async function getSites() {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch sites');
        }

        return await response.json();
    } catch (error) {
        console.error('getSites API error:', error);
        throw error;
    }
}
