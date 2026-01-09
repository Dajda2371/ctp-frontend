import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserRole, ROLE_LABELS } from '@/constants/roles';
import { getUsers } from '@/constants/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export default function UsersScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUsers();
    }, []);

    const renderUserItem = ({ item }: { item: User }) => (
        <ThemedView style={[styles.userCard, { borderColor: theme.neutral + '20' }]}>
            <View style={styles.userInfo}>
                <ThemedText style={styles.userName}>{item.name || 'Unknown Name'}</ThemedText>
                <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
                <View style={[styles.roleBadge, { backgroundColor: theme.primary + '20' }]}>
                    <ThemedText style={[styles.roleText, { color: theme.primary }]}>
                        {ROLE_LABELS[item.role] || item.role}
                    </ThemedText>
                </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
                <IconSymbol name="chevron.right" size={20} color={theme.icon} />
            </TouchableOpacity>
        </ThemedView>
    );

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'User Management', headerShown: true }} />

            <View style={styles.header}>
                <ThemedText type="title">Users</ThemedText>
                <ThemedText style={styles.subtitle}>Manage platform users and roles</ThemedText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <ThemedText>No users found.</ThemedText>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => {/* TODO: Invite user modal */ }}
            >
                <IconSymbol name="plus" size={24} color="#fff" />
            </TouchableOpacity>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 60,
    },
    subtitle: {
        opacity: 0.6,
        marginTop: 4,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
        flexGrow: 1,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    userEmail: {
        fontSize: 14,
        opacity: 0.6,
        marginVertical: 4,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 4,
    },
    roleText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    editButton: {
        padding: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});
