import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getChatGroups, ChatGroup } from '@/constants/api';
import i18n from '@/i18n';

export default function ChatListScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [groups, setGroups] = useState<ChatGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchGroups = async () => {
        try {
            const data = await getChatGroups();
            setGroups(data);
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchGroups();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchGroups();
    };

    const renderItem = ({ item }: { item: ChatGroup }) => (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: theme.neutral + '20' }]}
            onPress={() => router.push(`/chat/${item.id}`)}
        >
            <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                <IconSymbol
                    name={item.is_group ? "person.2.fill" : "person.fill"}
                    size={24}
                    color={theme.primary}
                />
            </View>
            <View style={styles.content}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={{ color: theme.icon }} numberOfLines={1}>
                    {item.is_group ? `${item.members_count} members` : 'Direct Message'}
                </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={theme.icon} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <ThemedView style={styles.center}>
                <ActivityIndicator size="large" color={theme.primary} />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={groups}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                refreshing={refreshing}
                onRefresh={onRefresh}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <ThemedText>No conversations yet</ThemedText>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/chat/create')}
            >
                <IconSymbol name="plus" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});
