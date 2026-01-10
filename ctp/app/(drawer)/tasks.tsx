import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Alert, RefreshControl, Modal, TextInput, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getTasks, getSites, createTask, updateTask, deleteTask, getUsers } from '@/constants/api';

interface Task {
    id: number;
    site_id: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assignee: string | null;
    photos: string[];
}

interface Site {
    id: number;
    name: string;
    address: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

export default function TasksScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [tasks, setTasks] = useState<Task[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [siteId, setSiteId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('TODO');
    const [priority, setPriority] = useState('MEDIUM');
    const [assignee, setAssignee] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    const fetchTasks = async () => {
        try {
            const data = await getTasks();
            setTasks(data);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to fetch tasks');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchSites = async () => {
        try {
            const data = await getSites();
            setSites(data);
        } catch (error: any) {
            console.error('Failed to fetch sites:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error: any) {
            console.error('Failed to fetch users:', error);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchSites();
        fetchUsers();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTasks();
    }, []);

    const openModal = (task?: Task) => {
        if (task) {
            setEditingTask(task);
            setSiteId(task.site_id.toString());
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
            setPriority(task.priority);
            setAssignee(task.assignee || '');
        } else {
            setEditingTask(null);
            setSiteId('');
            setTitle('');
            setDescription('');
            setStatus('TODO');
            setPriority('MEDIUM');
            setAssignee('');
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingTask(null);
        setSiteId('');
        setTitle('');
        setDescription('');
        setStatus('TODO');
        setPriority('MEDIUM');
        setAssignee('');
    };

    const handleSubmit = async () => {
        if (!title || !siteId) {
            Alert.alert('Validation Error', 'Title and Site are required.');
            return;
        }

        setSubmitting(true);
        try {
            const taskData = {
                site_id: parseInt(siteId),
                title,
                description: description || undefined,
                status,
                priority,
                assignee: assignee || undefined,
            };

            if (editingTask) {
                await updateTask(editingTask.id, taskData);
                Alert.alert('Success', 'Task updated successfully');
            } else {
                await createTask(taskData);
                Alert.alert('Success', 'Task created successfully');
            }
            closeModal();
            fetchTasks();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (task: Task) => {
        setTaskToDelete(task);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!taskToDelete) return;

        try {
            await deleteTask(taskToDelete.id);
            fetchTasks();
            setDeleteModalVisible(false);
            setTaskToDelete(null);
            closeModal();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete task');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'TODO': return '#FF9500';
            case 'IN_PROGRESS': return '#007AFF';
            case 'DONE': return '#34C759';
            default: return theme.text;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'LOW': return '#8E8E93';
            case 'MEDIUM': return '#FF9500';
            case 'HIGH': return '#FF3B30';
            default: return theme.text;
        }
    };

    const getSiteName = (siteId: number) => {
        const site = sites.find(s => s.id === siteId);
        return site ? site.name : `Site #${siteId}`;
    };

    const renderTaskItem = ({ item }: { item: Task }) => (
        <ThemedView style={[styles.card, { borderColor: theme.neutral + '20' }]}>
            <View style={styles.cardHeader}>
                <View style={styles.taskBadges}>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <ThemedText style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                            {item.status.replace('_', ' ')}
                        </ThemedText>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                        <ThemedText style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>
                            {item.priority}
                        </ThemedText>
                    </View>
                </View>
                <TouchableOpacity onPress={() => openModal(item)} style={styles.actionButton}>
                    <IconSymbol name="pencil" size={20} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>

            {item.description && (
                <ThemedText style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                </ThemedText>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <IconSymbol name="building.2.fill" size={14} color={theme.icon} />
                    <ThemedText style={styles.footerText}>{getSiteName(item.site_id)}</ThemedText>
                </View>
                {item.assignee && (
                    <View style={styles.footerItem}>
                        <IconSymbol name="person.fill" size={14} color={theme.icon} />
                        <ThemedText style={styles.footerText}>{item.assignee}</ThemedText>
                    </View>
                )}
            </View>
        </ThemedView>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">Tasks</ThemedText>
                <ThemedText style={styles.subtitle}>Manage site tasks</ThemedText>
            </View>

            <FlatList
                data={tasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <ThemedText>No tasks found.</ThemedText>
                    </View>
                }
            />

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
                            <ThemedText type="subtitle">{editingTask ? 'Edit Task' : 'Add New Task'}</ThemedText>
                            <TouchableOpacity onPress={closeModal}>
                                <IconSymbol name="xmark" size={24} color={theme.icon} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formScroll}>
                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>Site *</ThemedText>
                                <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                    {sites.length > 0 ? (
                                        <select
                                            value={siteId}
                                            onChange={(e) => setSiteId(e.target.value)}
                                            style={{
                                                width: '100%',
                                                height: 50,
                                                border: 'none',
                                                background: 'transparent',
                                                color: theme.text,
                                                fontSize: 16,
                                            }}
                                        >
                                            <option value="">Select Site</option>
                                            {sites.map(site => (
                                                <option key={site.id} value={site.id}>{site.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <ThemedText>Loading sites...</ThemedText>
                                    )}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>Title *</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.neutral + '40' }]}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Task Title"
                                    placeholderTextColor={theme.icon + '80'}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>Description</ThemedText>
                                <TextInput
                                    style={[styles.textArea, { color: theme.text, borderColor: theme.neutral + '40' }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Task Description"
                                    placeholderTextColor={theme.icon + '80'}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                    <ThemedText style={styles.label}>Status</ThemedText>
                                    <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            style={{
                                                width: '100%',
                                                height: 50,
                                                border: 'none',
                                                background: 'transparent',
                                                color: theme.text,
                                                fontSize: 16,
                                            }}
                                        >
                                            <option value="TODO">To Do</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="DONE">Done</option>
                                        </select>
                                    </View>
                                </View>

                                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                    <ThemedText style={styles.label}>Priority</ThemedText>
                                    <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            style={{
                                                width: '100%',
                                                height: 50,
                                                border: 'none',
                                                background: 'transparent',
                                                color: theme.text,
                                                fontSize: 16,
                                            }}
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>Assignee</ThemedText>
                                <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                    <select
                                        value={assignee}
                                        onChange={(e) => setAssignee(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: 50,
                                            border: 'none',
                                            background: 'transparent',
                                            color: theme.text,
                                            fontSize: 16,
                                        }}
                                    >
                                        <option value="">Unassigned</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.name}>{u.name}</option>
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
                            <ThemedText style={styles.submitButtonText}>{submitting ? 'Saving...' : 'Save Task'}</ThemedText>
                        </TouchableOpacity>

                        {editingTask && (
                            <TouchableOpacity
                                style={[styles.deleteButton, { backgroundColor: '#ff4444', borderColor: '#ff4444' }]}
                                onPress={() => handleDelete(editingTask)}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Delete Task</ThemedText>
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
                        <ThemedText type="subtitle" style={styles.alertTitle}>Delete Task</ThemedText>
                        <ThemedText style={styles.alertMessage}>
                            Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskBadges: {
        flexDirection: 'row',
        gap: 8,
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    actionButton: {
        padding: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        gap: 16,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        opacity: 0.6,
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
        maxHeight: 400,
    },
    formGroup: {
        marginBottom: 16,
    },
    formRow: {
        flexDirection: 'row',
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
    textArea: {
        minHeight: 100,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        textAlignVertical: 'top',
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
        borderWidth: 1,
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
