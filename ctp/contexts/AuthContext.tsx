import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getToken, getMe, saveToken, logout } from '@/constants/api';
import { UserRole } from '@/constants/roles';
import { useRouter, useSegments } from 'expo-router';

interface User {
    id: number;
    email: string;
    name: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    const fetchUser = async () => {
        try {
            const token = await getToken();
            if (token) {
                const userData = await getMe();
                // Ensure role is valid, default to technician if not
                if (!Object.values(UserRole).includes(userData.role)) {
                    console.warn(`Unknown role received: ${userData.role}`);
                }
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // If fetch fails (likely 401), clear user
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    // Protect routes
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

        if (!user && !inAuthGroup) {
            // Redirect to login if not authenticated
            // router.replace('/login'); // Handled in RootLayout mostly, but valid here too
        } else if (user && inAuthGroup) {
            // Redirect to home if authenticated
            router.replace('/');
        }
    }, [user, isLoading, segments]);

    const signIn = async (token: string) => {
        setIsLoading(true);
        await saveToken(token);
        await fetchUser();
        setIsLoading(false);
        router.replace('/');
    };

    const signOut = async () => {
        setIsLoading(true);
        try {
            await logout();
        } catch (e) {
            console.error('Logout failed:', e);
        }
        await saveToken(''); // Clear token
        setUser(null);
        setIsLoading(false);
        router.replace('/login');
    };

    const refreshUser = async () => {
        await fetchUser();
    };


    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
