import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getUsers, createChatGroup } from '@/constants/api'; // user interface inferred
import i18n from '@/i18n';

interface User {
    id: number;
    name: string;
    email: string;
}

export default function CreateChatScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleUser = (id: number) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const handleCreate = async () => {
        if (selectedUserIds.length === 0) {
            Alert.alert('Error', 'Please select at least one user');
            return;
        }

        const isGroup = selectedUserIds.length > 1;
        if (isGroup && !groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        setCreating(true);
        try {
            await createChatGroup({
                name: isGroup ? groupName : undefined, // Check if backend requires name for DM
                user_ids: selectedUserIds,
                is_group: isGroup
            });
            router.back();
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message);
        } finally {
            setCreating(false);
        }
    };

    const renderItem = ({ item }: { item: User }) => {
        const isSelected = selectedUserIds.includes(item.id);
        return (
            <TouchableOpacity
                style={[styles.item, { borderBottomColor: theme.neutral + '20' }]}
                onPress={() => toggleUser(item.id)}
            >
                <View style={[styles.avatar, { backgroundColor: isSelected ? theme.primary : theme.neutral + '20' }]}>
                    <IconSymbol
                        name="person.fill"
                        size={24}
                        color={isSelected ? '#FFFFFF' : theme.icon}
                    />
                </View>
                <ThemedText>{item.name}</ThemedText>
                {isSelected && (
                    <View style={styles.checkIcon}>
                        <IconSymbol name="checkmark" size={20} color={theme.primary} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={styles.container}>
            {selectedUserIds.length > 1 && (
                <View style={[styles.inputContainer, { borderColor: theme.neutral + '40' }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Group Name"
                        placeholderTextColor={theme.icon}
                        value={groupName}
                        onChangeText={setGroupName}
                    />
                </View>
            )}

            <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
            />

            <View style={[styles.footer, { borderTopColor: theme.neutral + '20', backgroundColor: theme.background }]}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary, opacity: creating ? 0.7 : 1 }]}
                    onPress={handleCreate}
                    disabled={creating}
                >
                    {creating ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <ThemedText style={styles.buttonText}>
                            {selectedUserIds.length > 1 ? 'Create Group' : 'Start Chat'}
                        </ThemedText>
                    )}
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkIcon: {
        marginLeft: 'auto',
    },
    inputContainer: {
        margin: 16,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 50,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    button: {
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
