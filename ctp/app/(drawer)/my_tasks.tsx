import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Alert, RefreshControl, Modal, TextInput, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMyTasks, getSites, getSite, createTask, updateTask, deleteTask } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { LocationPicker } from '@/components/LocationPicker';
import { TaskCard } from '@/components/TaskCard';

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
    due_date: string | null;
    photos: string[];
    latitude?: number;
    longitude?: number;
}

interface Site {
    id: number;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
}


export default function MyTasksScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user } = useAuth();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
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
    const [taskLatitude, setTaskLatitude] = useState<number | undefined>(undefined);
    const [taskLongitude, setTaskLongitude] = useState<number | undefined>(undefined);
    const [locationPickerVisible, setLocationPickerVisible] = useState(false);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [dueDate, setDueDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    const fetchTasks = async () => {
        try {
            const data = await getMyTasks();
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


    useEffect(() => {
        fetchTasks();
        fetchSites();
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
            setPriority(REVERSE_PRIORITY_MAP[task.priority] || 'MEDIUM');
            setAssignee(task.assignee || '');
            setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
            setTaskLatitude(task.latitude);
            setTaskLongitude(task.longitude);
            if (task.site_id) {
                getSite(task.site_id).then(setSelectedSite).catch(console.error);
            }
        } else {
            setEditingTask(null);
            setSiteId('');
            setTitle('');
            setDescription('');
            setStatus('TODO');
            setPriority('MEDIUM');
            setAssignee('');
            setDueDate('');
            setTaskLatitude(undefined);
            setTaskLongitude(undefined);
            setSelectedSite(null);
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
        setDueDate('');
        setTaskLatitude(undefined);
        setTaskLongitude(undefined);
        setSelectedSite(null);
    };

    const handleSiteChange = async (newSiteId: string) => {
        setSiteId(newSiteId);
        if (newSiteId) {
            try {
                const siteData = await getSite(newSiteId);
                setSelectedSite(siteData);
            } catch (error) {
                console.error("Failed to fetch site details", error);
                setSelectedSite(null);
            }
        } else {
            setSelectedSite(null);
        }
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
                priority: PRIORITY_MAP[priority] || 3,
                assignee: user?.name || undefined,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                latitude: taskLatitude,
                longitude: taskLongitude,
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

    const getSiteName = (siteId: number) => {
        const site = sites.find(s => s.id === siteId);
        return site ? site.name : `Site #${siteId}`;
    };

    const renderTaskItem = ({ item }: { item: Task }) => (
        <TaskCard
            task={item}
            siteName={getSiteName(item.site_id)}
            onEdit={openModal}
        />
    );

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">My Tasks</ThemedText>
                <ThemedText style={styles.subtitle}>Tasks assigned specifically to you</ThemedText>
            </View>

            <FlatList
                data={tasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <ThemedText>No tasks assigned to you.</ThemedText>
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
                                            onChange={(e) => handleSiteChange(e.target.value)}
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
                                <ThemedText style={styles.label}>Due Date</ThemedText>
                                <View style={[styles.picker, { borderColor: theme.neutral + '40', padding: 0 }]}>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: 'none',
                                            background: 'transparent',
                                            color: theme.text,
                                            fontSize: 16,
                                            padding: '0 16px',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>Assignee</ThemedText>
                                <ThemedText style={{ opacity: 0.6 }}>Assigned to you ({user?.name})</ThemedText>
                            </View>
                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>Location</ThemedText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.locationButton,
                                            {
                                                borderColor: theme.primary,
                                                opacity: !siteId ? 0.5 : 1
                                            }
                                        ]}
                                        onPress={() => setLocationPickerVisible(true)}
                                        disabled={!siteId}
                                    >
                                        <IconSymbol name="map" size={20} color={theme.primary} />
                                        <ThemedText style={{ color: theme.primary, fontWeight: '600' }}>
                                            {taskLatitude && taskLongitude ? 'Change Location' : 'Set Location'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                    {taskLatitude && taskLongitude && (
                                        <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                                            {taskLatitude.toFixed(4)}, {taskLongitude.toFixed(4)}
                                        </ThemedText>
                                    )}
                                </View>
                                {!siteId && (
                                    <ThemedText style={{ fontSize: 12, color: theme.danger, marginTop: 4 }}>
                                        Select a site first to set location.
                                    </ThemedText>
                                )}
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

            <LocationPicker
                visible={locationPickerVisible}
                onClose={() => setLocationPickerVisible(false)}
                onLocationSelect={(loc) => {
                    setTaskLatitude(loc.latitude);
                    setTaskLongitude(loc.longitude);
                }}
                initialLatitude={taskLatitude}
                initialLongitude={taskLongitude}
                siteLatitude={selectedSite?.latitude}
                siteLongitude={selectedSite?.longitude}
            />

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
        </ThemedView >
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
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderRadius: 8,
        gap: 8,
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
