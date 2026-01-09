import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserRole, ROLE_LABELS, getManageableRoles, canEditUser } from '@/constants/roles';
import { getUsers, createUser, updateUser, deleteUser } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

interface User {
    id: string | number; // Handle both string and number IDs from API
    name: string;
    email: string;
    role: UserRole;
}

export default function UsersScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user: currentUser, isLoading: isAuthLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.TECHNICIAN);
    const [submitting, setSubmitting] = useState(false);
    const [rawData, setRawData] = useState<any>(null);

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const manageableRoles = getManageableRoles(currentUser?.role);

    const fetchUsers = async () => {
        if (!currentUser) return; // Wait for auth

        try {
            console.log('Fetching users, current user email:', currentUser?.email, 'role:', currentUser?.role);
            const data = await getUsers();
            setRawData(data);

            // Filter users to only show those the current user can manage
            const filteredUsers = Array.isArray(data) ? data.filter((u: User) => {
                const canEdit = canEditUser(currentUser?.role, u.role);
                console.log(`Checking user ${u.email} (role: ${u.role}): canEdit=${canEdit}`);
                return canEdit;
            }) : [];
            setUsers(filteredUsers);
        } catch (error: any) {
            console.error('fetchUsers error:', error);
            Alert.alert('Error', error.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading) {
            fetchUsers();
        }
    }, [currentUser, isAuthLoading]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUsers();
    }, []);

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setName(user.name || '');
            setEmail(user.email);
            setRole(user.role);
            setPassword('');
        } else {
            setEditingUser(null);
            setName('');
            setEmail('');
            setPassword('');
            setRole(manageableRoles[0] || UserRole.TECHNICIAN);
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingUser(null);
        setName('');
        setEmail('');
        setPassword('');
        setRole(UserRole.TECHNICIAN);
    };

    const handleSubmit = async () => {
        if (!email) {
            Alert.alert('Validation Error', 'Email is required.');
            return;
        }
        if (!editingUser && !password) {
            Alert.alert('Validation Error', 'Password is required for new users.');
            return;
        }

        setSubmitting(true);
        try {
            if (editingUser) {
                await updateUser(editingUser.id, { name, email, role });
                Alert.alert('Success', 'User updated successfully');
            } else {
                await createUser({ email, password, name, role });
                Alert.alert('Success', 'User created successfully');
            }
            closeModal();
            fetchUsers();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (user: User) => {
        setUserToDelete(user);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            await deleteUser(userToDelete.id);
            fetchUsers();
            setDeleteModalVisible(false);
            setUserToDelete(null);
            closeModal();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete user');
        }
    };

    const renderUserItem = ({ item }: { item: User }) => (
        <TouchableOpacity onPress={() => openModal(item)}>
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
                <IconSymbol name="chevron.right" size={20} color={theme.icon} />
            </ThemedView>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={styles.container}>
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
                    keyExtractor={(item) => item.id.toString()}
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
                onPress={() => openModal()}
            >
                <IconSymbol name="plus" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <ThemedView style={[styles.modalContent, {
                        backgroundColor: theme.background,
                        borderColor: theme.neutral + '20'
                    }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText type="subtitle">{editingUser ? 'Edit User' : 'Add New User'}</ThemedText>
                            <TouchableOpacity onPress={closeModal}>
                                <IconSymbol name="xmark" size={24} color={theme.icon} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formScroll}>
                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>Name</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.neutral + '40' }]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Full Name"
                                    placeholderTextColor={theme.icon + '80'}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>Email *</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.neutral + '40' }]}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="email@example.com"
                                    placeholderTextColor={theme.icon + '80'}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {!editingUser && (
                                <View style={styles.formGroup}>
                                    <ThemedText style={styles.label}>Password *</ThemedText>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.neutral + '40' }]}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="Password"
                                        placeholderTextColor={theme.icon + '80'}
                                        secureTextEntry
                                    />
                                </View>
                            )}

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>Role</ThemedText>
                                <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as UserRole)}
                                        style={{
                                            width: '100%',
                                            height: 50,
                                            border: 'none',
                                            background: 'transparent',
                                            color: theme.text,
                                            fontSize: 16,
                                        }}
                                    >
                                        {manageableRoles.map(r => (
                                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                        ))}
                                    </select>
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <ThemedText style={styles.submitButtonText}>{submitting ? 'Saving...' : 'Save User'}</ThemedText>
                        </TouchableOpacity>

                        {editingUser && (
                            <TouchableOpacity
                                style={[styles.deleteButton, { backgroundColor: '#ff4444' }]}
                                onPress={() => handleDelete(editingUser)}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Delete User</ThemedText>
                            </TouchableOpacity>
                        )}
                    </ThemedView>
                </KeyboardAvoidingView>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.alertOverlay}>
                    <ThemedView style={[styles.alertContent, { backgroundColor: theme.background, borderColor: theme.neutral + '20' }]}>
                        <ThemedText type="subtitle" style={styles.alertTitle}>Delete User</ThemedText>
                        <ThemedText style={styles.alertMessage}>
                            Are you sure you want to delete "{userToDelete?.name || userToDelete?.email}"? This action cannot be undone.
                        </ThemedText>

                        <View style={styles.alertActions}>
                            <TouchableOpacity
                                style={styles.alertButton}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <ThemedText style={{ color: theme.text }}>Cancel</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.alertButton, { backgroundColor: '#ff4444' }]}
                                onPress={confirmDelete}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Delete</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </ThemedView>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        borderWidth: 1,
        borderBottomWidth: 0,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    formScroll: {
        maxHeight: 350,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        fontWeight: 'bold',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    picker: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    submitButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    deleteButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        alignItems: 'center',
    },
    alertTitle: {
        marginBottom: 12,
        textAlign: 'center',
    },
    alertMessage: {
        textAlign: 'center',
        marginBottom: 24,
        opacity: 0.7,
        lineHeight: 20,
    },
    alertActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    alertButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
    },
});
