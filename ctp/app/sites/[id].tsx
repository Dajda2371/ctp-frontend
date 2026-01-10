import { StyleSheet, FlatList, TouchableOpacity, View, TextInput, Alert, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSite, getTasks, createTask, updateTask, deleteTask, getUsers } from '@/constants/api';

const PRIORITY_MAP: Record<string, number> = {
    'LOWEST': 1,
    'LOW': 2,
    'MEDIUM': 3,
    'HIGH': 4,
    'HIGHEST': 5,
};

const REVERSE_PRIORITY_MAP: Record<number, string> = {
    1: 'LOWEST',
    2: 'LOW',
    3: 'MEDIUM',
    4: 'HIGH',
    5: 'HIGHEST',
};

interface Task {
    id: number;
    site_id: number;
    title: string;
    description: string | null;
    status: string;
    priority: number;
    assignee: string | null;
    photos: string[];
}

interface Site {
    id: number;
    name: string;
    address: string;
    coordinator: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

export default function SiteTasksScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [site, setSite] = useState<Site | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('TODO');
    const [priority, setPriority] = useState('MEDIUM');
    const [assignee, setAssignee] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    const fetchData = async () => {
        try {
            const [siteData, tasksData, usersData] = await Promise.all([
                getSite(id as string),
                getTasks(parseInt(id as string)),
                getUsers()
            ]);
            setSite(siteData);
            setTasks(tasksData);
            setUsers(usersData);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [id]);

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const openModal = (task?: Task) => {
        if (task) {
            setEditingTask(task);
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
            setPriority(REVERSE_PRIORITY_MAP[task.priority] || 'MEDIUM');
            setAssignee(task.assignee || '');
        } else {
            setEditingTask(null);
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
        setTitle('');
        setDescription('');
        setStatus('TODO');
        setPriority('MEDIUM');
        setAssignee('');
    };

    const handleSubmit = async () => {
        if (!title) {
            Alert.alert('Validation Error', 'Title is required.');
            return;
        }

        setSubmitting(true);
        try {
            const taskData = {
                site_id: parseInt(id as string),
                title,
                description: description || undefined,
                status,
                priority: PRIORITY_MAP[priority] || 3,
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
            fetchData();
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
            fetchData();
            setDeleteModalVisible(false);
            setTaskToDelete(null);
            closeModal();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete task');
        }
    };

    const getStatusStyle = (status: Task['status']) => {
        switch (status) {
            case 'DONE': return { color: '#34C759', bg: '#34C759' + '20', icon: 'checkmark.circle.fill' as const };
            case 'IN_PROGRESS': return { color: '#007AFF', bg: '#007AFF' + '20', icon: 'clock.fill' as const };
            case 'TODO': return { color: '#FF9500', bg: '#FF9500' + '20', icon: 'circle' as const };
            default: return { color: theme.icon, bg: theme.neutral + '20', icon: 'circle' as const };
        }
    };

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 1: return '#8E8E93'; // LOWEST
            case 2: return '#32ADE6'; // LOW
            case 3: return '#FF9500'; // MEDIUM
            case 4: return '#FF2D55'; // HIGH
            case 5: return '#AF52DE'; // HIGHEST
            default: return theme.text;
        }
    };

    const renderTaskItem = ({ item }: { item: Task }) => {
        const statusStyle = getStatusStyle(item.status);

        return (
            <TouchableOpacity
                style={[styles.taskCard, { backgroundColor: theme.background, borderColor: theme.neutral + '30' }]}
                onPress={() => openModal(item)}
            >
                <View style={styles.taskTop}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <IconSymbol name={statusStyle.icon} size={14} color={statusStyle.color} />
                        <ThemedText style={[styles.statusText, { color: statusStyle.color }]}>{item.status.replace('_', ' ')}</ThemedText>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                        <ThemedText style={[styles.statusText, { color: getPriorityColor(item.priority) }]}>
                            {REVERSE_PRIORITY_MAP[item.priority] || 'MEDIUM'}
                        </ThemedText>
                    </View>
                </View>

                <ThemedText type="subtitle" style={styles.taskTitle}>{item.title}</ThemedText>
                {item.description && (
                    <ThemedText style={styles.taskDesc} numberOfLines={2}>{item.description}</ThemedText>
                )}

                <View style={styles.taskFooter}>
                    <View style={styles.assigneeInfo}>
                        <View style={[styles.avatar, { backgroundColor: theme.secondary + '20' }]}>
                            <IconSymbol name="person.fill" size={12} color={theme.secondary} />
                        </View>
                        <ThemedText style={styles.footerText}>{item.assignee || 'Unassigned'}</ThemedText>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (!site && !loading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText>Site not found</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    title: site?.name || 'Site Details',
                    headerStyle: { backgroundColor: theme.secondary },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />

            <View style={[styles.header, { backgroundColor: theme.secondary }]}>
                <ThemedText type="title" style={styles.headerTitle}>{site?.name}</ThemedText>
                <ThemedText style={styles.headerSubtitle}>{site?.address}</ThemedText>

                <View style={styles.searchContainer}>
                    <View style={[styles.searchBar, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                        <IconSymbol name="magnifyingglass" size={18} color="#fff" />
                        <TextInput
                            placeholder="Search site tasks..."
                            placeholderTextColor="rgba(255, 255, 255, 0.6)"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>
            </View>

            <FlatList
                data={filteredTasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <IconSymbol name="checklist" size={48} color={theme.icon} />
                        <ThemedText style={styles.emptyText}>No tasks found for this site.</ThemedText>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => openModal()}
            >
                <IconSymbol name="plus" size={30} color="#fff" />
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
                                            <option value="LOWEST">Lowest</option>
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="HIGHEST">Highest</option>
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
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
    },
    headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        marginTop: 4,
    },
    searchContainer: {
        marginTop: 16,
    },
    searchBar: {
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        marginLeft: 8,
        fontSize: 16,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    taskCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    taskTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    taskTitle: {
        fontSize: 18,
        marginBottom: 8,
    },
    taskDesc: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 16,
        lineHeight: 20,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 12,
    },
    assigneeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        opacity: 0.7,
    },
    dateText: {
        fontSize: 12,
        opacity: 0.5,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        opacity: 0.5,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    // Modal Styles
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
    // Alert Styles
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
