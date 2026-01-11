import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Alert, RefreshControl, Modal, TextInput, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getTasks, getSites, getSite, createTask, updateTask, deleteTask, getUsers, updateTaskStatus, updateTaskPriority, getTaskPhotos, uploadTaskPhoto, deleteTaskPhoto } from '@/constants/api';
import { LocationPicker } from '@/components/LocationPicker';
import { TaskCard } from '@/components/TaskCard';
import { SelectModal } from '@/components/SelectModal';
import { DatePickerModal } from '@/components/DatePickerModal';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import i18n from '@/i18n';

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
    photos: (string | { id: number; url: string } | { url: string })[];
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
    const [taskLatitude, setTaskLatitude] = useState<number | undefined>(undefined);
    const [taskLongitude, setTaskLongitude] = useState<number | undefined>(undefined);
    const [locationPickerVisible, setLocationPickerVisible] = useState(false);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [dueDate, setDueDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Photo Management State
    const [existingPhotos, setExistingPhotos] = useState<{ id: number; url: string }[]>([]);
    const [newPhotos, setNewPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [deletedPhotoIds, setDeletedPhotoIds] = useState<number[]>([]);

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    // Custom Picker Modal States
    const [sitePickerVisible, setSitePickerVisible] = useState(false);
    const [statusPickerVisible, setStatusPickerVisible] = useState(false);
    const [priorityPickerVisible, setPriorityPickerVisible] = useState(false);
    const [assigneePickerVisible, setAssigneePickerVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);

    // Quick Edit States
    const [quickEditTask, setQuickEditTask] = useState<Task | null>(null);
    const [quickStatusPickerVisible, setQuickStatusPickerVisible] = useState(false);
    const [quickPriorityPickerVisible, setQuickPriorityPickerVisible] = useState(false);

    const fetchTasks = useCallback(async () => {
        try {
            const data = await getTasks();
            setTasks(data);
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message || i18n.t('tasks.fetchFailed'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

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
    }, [fetchTasks]);

    useAutoRefresh(fetchTasks);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTasks();
    }, [fetchTasks]);

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
            // Fetch site details to have fallback coordinates if needed
            if (task.site_id) {
                getSite(task.site_id).then(setSelectedSite).catch(console.error);
            }
            // Fetch existing photos
            getTaskPhotos(task.id).then(data => {
                setExistingPhotos(data.photos || []);
            }).catch(console.error);
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
            setTaskLongitude(undefined);
            setSelectedSite(null);
            setExistingPhotos([]);
            setNewPhotos([]);
            setDeletedPhotoIds([]);
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
        setTaskLongitude(undefined);
        setSelectedSite(null);
        setExistingPhotos([]);
        setNewPhotos([]);
        setDeletedPhotoIds([]);
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setNewPhotos([...newPhotos, result.assets[0]]);
            }
        } catch (error) {
            Alert.alert(i18n.t('common.error'), i18n.t('tasks.pickImageFailed'));
        }
    };

    const handleRemoveNewPhoto = (index: number) => {
        setNewPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleMarkPhotoDeleted = (id: number) => {
        setDeletedPhotoIds(prev => [...prev, id]);
        setExistingPhotos(prev => prev.filter(p => p.id !== id));
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
            Alert.alert(i18n.t('common.validationError'), i18n.t('tasks.titleRequired'));
            return;
        }

        setSubmitting(true);
        setSubmitting(true);
        try {
            const assignedUser = users.find(u => u.name === assignee);
            const taskData = {
                site_id: parseInt(siteId),
                title,
                description: description || undefined,
                status,
                priority: PRIORITY_MAP[priority] || 2,
                assigned_user_id: assignedUser ? assignedUser.id : undefined,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                latitude: taskLatitude,
                longitude: taskLongitude,
            };

            let targetTaskId = editingTask ? editingTask.id : 0;

            if (editingTask) {
                await updateTask(editingTask.id, taskData);
                targetTaskId = editingTask.id;
            } else {
                const newTask = await createTask(taskData);
                if (newTask && newTask.id) {
                    targetTaskId = newTask.id;
                }
            }

            // Handle Photo Operations using targetTaskId
            if (targetTaskId) {
                // 1. Delete marked photos
                for (const photoId of deletedPhotoIds) {
                    await deleteTaskPhoto(targetTaskId, photoId);
                }

                // 2. Upload new photos
                for (const asset of newPhotos) {
                    const fileName = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg';
                    const file = {
                        uri: asset.uri,
                        type: asset.mimeType || 'image/jpeg',
                        name: fileName,
                    };
                    await uploadTaskPhoto(targetTaskId, file);
                }
            }


            closeModal();
            fetchTasks();
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message || i18n.t('common.operationFailed'));
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
            Alert.alert(i18n.t('common.error'), error.message || i18n.t('tasks.deleteTaskFailed'));
        }
    };

    const handleQuickStatusChange = async (newStatus: string) => {
        if (!quickEditTask) return;
        try {
            await updateTaskStatus(quickEditTask.id, newStatus);
            setTasks(prev => prev.map(t => t.id === quickEditTask.id ? { ...t, status: newStatus } : t));
            setQuickStatusPickerVisible(false);
            setQuickEditTask(null);
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message || i18n.t('common.operationFailed'));
        }
    };

    const handleQuickPriorityChange = async (newPriorityStr: string) => {
        if (!quickEditTask) return;
        const newPriority = PRIORITY_MAP[newPriorityStr];
        try {
            await updateTaskPriority(quickEditTask.id, newPriority);
            setTasks(prev => prev.map(t => t.id === quickEditTask.id ? { ...t, priority: newPriority } : t));
            setQuickPriorityPickerVisible(false);
            setQuickEditTask(null);
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message || i18n.t('common.operationFailed'));
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
            case 1: return '#8E8E93'; // LOWEST - Grey
            case 2: return '#32ADE6'; // LOW - Blue
            case 3: return '#FF9500'; // MEDIUM - Orange
            case 4: return '#FF2D55'; // HIGH - Pinkish Red
            case 5: return '#AF52DE'; // HIGHEST - Purple
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
            onStatusPress={() => {
                setQuickEditTask(item);
                setQuickStatusPickerVisible(true);
            }}
            onPriorityPress={() => {
                setQuickEditTask(item);
                setQuickPriorityPickerVisible(true);
            }}
            onTaskUpdate={fetchTasks}
        />
    );

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">{i18n.t('tasks.allTasksTitle')}</ThemedText>
                <ThemedText style={styles.subtitle}>{i18n.t('tasks.allTasksSubtitle')}</ThemedText>
            </View>

            <FlatList
                data={tasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <ThemedText>{i18n.t('tasks.noTasksFound')}</ThemedText>
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
                            <ThemedText type="subtitle">{editingTask ? i18n.t('tasks.editTask') : i18n.t('tasks.addTask')}</ThemedText>
                            <TouchableOpacity onPress={closeModal}>
                                <IconSymbol name="xmark" size={24} color={theme.icon} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formScroll}>
                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>{i18n.t('tasks.site')} *</ThemedText>
                                <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                    {sites.length > 0 ? (
                                        Platform.OS === 'web' ? (
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
                                                <option value="">{i18n.t('tasks.selectSite')}</option>
                                                {sites.map(site => (
                                                    <option key={site.id} value={site.id}>{site.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <TouchableOpacity
                                                style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                                                onPress={() => setSitePickerVisible(true)}
                                            >
                                                <ThemedText style={{ color: siteId ? theme.text : (theme.icon + '80') }}>
                                                    {sites.find(s => String(s.id) === siteId)?.name || i18n.t('tasks.selectSite')}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        )
                                    ) : (
                                        <ThemedText>{i18n.t('common.loading')}</ThemedText>
                                    )}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>{i18n.t('tasks.taskTitle')} *</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.neutral + '40' }]}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder={i18n.t('tasks.taskTitlePlaceholder')}
                                    placeholderTextColor={theme.icon + '80'}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>{i18n.t('tasks.description')}</ThemedText>
                                <TextInput
                                    style={[styles.textArea, { color: theme.text, borderColor: theme.neutral + '40' }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder={i18n.t('tasks.descriptionPlaceholder')}
                                    placeholderTextColor={theme.icon + '80'}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                    <ThemedText style={styles.label}>{i18n.t('tasks.status')}</ThemedText>
                                    <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                        {Platform.OS === 'web' ? (
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
                                                <option value="TODO">{i18n.t('tasks.statusOptions.todo')}</option>
                                                <option value="IN_PROGRESS">{i18n.t('tasks.statusOptions.inProgress')}</option>
                                                <option value="DONE">{i18n.t('tasks.statusOptions.done')}</option>
                                            </select>
                                        ) : (
                                            <TouchableOpacity
                                                style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                                                onPress={() => setStatusPickerVisible(true)}
                                            >
                                                <ThemedText style={{ color: theme.text }}>
                                                    {i18n.t(`tasks.statusOptions.${status === 'TODO' ? 'todo' : status === 'IN_PROGRESS' ? 'inProgress' : 'done'}`)}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                    <ThemedText style={styles.label}>{i18n.t('tasks.priority')}</ThemedText>
                                    <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                        {Platform.OS === 'web' ? (
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
                                                <option value="LOWEST">{i18n.t('tasks.priorityOptions.lowest')}</option>
                                                <option value="LOW">{i18n.t('tasks.priorityOptions.low')}</option>
                                                <option value="MEDIUM">{i18n.t('tasks.priorityOptions.medium')}</option>
                                                <option value="HIGH">{i18n.t('tasks.priorityOptions.high')}</option>
                                                <option value="HIGHEST">{i18n.t('tasks.priorityOptions.highest')}</option>
                                            </select>
                                        ) : (
                                            <TouchableOpacity
                                                style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                                                onPress={() => setPriorityPickerVisible(true)}
                                            >
                                                <ThemedText style={{ color: theme.text }}>
                                                    {i18n.t(`tasks.priorityOptions.${priority.toLowerCase()}`)}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>{i18n.t('tasks.dueDate')}</ThemedText>
                                <View style={[styles.picker, { borderColor: theme.neutral + '40', padding: 0 }]}>
                                    {Platform.OS === 'web' ? (
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
                                    ) : (
                                        <TouchableOpacity
                                            style={{ width: '100%', height: '100%', justifyContent: 'center', paddingHorizontal: 16 }}
                                            onPress={() => setDatePickerVisible(true)}
                                        >
                                            <ThemedText style={{ color: dueDate ? theme.text : (theme.icon + '80') }}>
                                                {dueDate || i18n.t('common.selectDate')}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>{i18n.t('tasks.assignee')}</ThemedText>
                                <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                    {Platform.OS === 'web' ? (
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
                                            <option value="">{i18n.t('common.unassigned')}</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.name}>{u.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <TouchableOpacity
                                            style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                                            onPress={() => setAssigneePickerVisible(true)}
                                        >
                                            <ThemedText style={{ color: assignee ? theme.text : (theme.icon + '80') }}>
                                                {assignee || i18n.t('common.unassigned')}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>{i18n.t('common.location')}</ThemedText>
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
                                            {taskLatitude && taskLongitude ? i18n.t('common.changeLocation') : i18n.t('common.setLocation')}
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
                                        {i18n.t('tasks.validation.locationRequired')}
                                    </ThemedText>
                                )}
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>{i18n.t('tasks.photos')}</ThemedText>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 10 }}>
                                    {/* Existing Photos */}
                                    {existingPhotos.map(photo => (
                                        <View key={photo.id} style={{ marginRight: 10, position: 'relative' }}>
                                            <Image source={{ uri: photo.url }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                                            <TouchableOpacity
                                                style={{
                                                    position: 'absolute',
                                                    top: -5,
                                                    right: -5,
                                                    backgroundColor: 'red',
                                                    borderRadius: 10,
                                                    width: 20,
                                                    height: 20,
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}
                                                onPress={() => handleMarkPhotoDeleted(photo.id)}
                                            >
                                                <IconSymbol name="xmark" size={12} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    {/* New Photos */}
                                    {newPhotos.map((asset, index) => (
                                        <View key={`new-${index}`} style={{ marginRight: 10, position: 'relative' }}>
                                            <Image source={{ uri: asset.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                                            <TouchableOpacity
                                                style={{
                                                    position: 'absolute',
                                                    top: -5,
                                                    right: -5,
                                                    backgroundColor: 'red',
                                                    borderRadius: 10,
                                                    width: 20,
                                                    height: 20,
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}
                                                onPress={() => handleRemoveNewPhoto(index)}
                                            >
                                                <IconSymbol name="xmark" size={12} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    <TouchableOpacity
                                        style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: theme.neutral + '40',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderStyle: 'dashed'
                                        }}
                                        onPress={handlePickImage}
                                    >
                                        <IconSymbol name="plus" size={24} color={theme.icon} />
                                        <ThemedText style={{ fontSize: 10, marginTop: 4 }}>{i18n.t('common.add')}</ThemedText>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <ThemedText style={styles.submitButtonText}>{submitting ? i18n.t('common.saving') : i18n.t('tasks.saveTask')}</ThemedText>
                        </TouchableOpacity>

                        {editingTask && (
                            <TouchableOpacity
                                style={[styles.deleteButton, { backgroundColor: '#ff4444', borderColor: '#ff4444' }]}
                                onPress={() => handleDelete(editingTask)}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>{i18n.t('tasks.deleteTask')}</ThemedText>
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
                        <ThemedText type="subtitle" style={styles.alertTitle}>{i18n.t('tasks.deleteConfirmTitle')}</ThemedText>
                        <ThemedText style={styles.alertMessage}>
                            {i18n.t('tasks.deleteConfirm', { title: taskToDelete?.title })}
                        </ThemedText>

                        <View style={styles.alertActions}>
                            <TouchableOpacity
                                style={styles.alertButton}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <ThemedText style={{ color: theme.text }}>{i18n.t('common.cancel')}</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.alertButton, { backgroundColor: '#ff4444' }]}
                                onPress={confirmDelete}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>{i18n.t('common.delete')}</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </ThemedView>
                </View>
            </Modal>

            {/* Custom Picker Modals */}
            <SelectModal
                visible={sitePickerVisible}
                onClose={() => setSitePickerVisible(false)}
                onSelect={(value) => handleSiteChange(value)}
                options={[
                    { label: i18n.t('tasks.selectSite'), value: '' },
                    ...sites.map(s => ({ label: s.name, value: String(s.id) }))
                ]}
                selectedValue={siteId}
                title={i18n.t('tasks.selectSite')}
            />

            <SelectModal
                visible={statusPickerVisible}
                onClose={() => setStatusPickerVisible(false)}
                onSelect={setStatus}
                options={[
                    { label: i18n.t('tasks.statusOptions.todo'), value: 'TODO' },
                    { label: i18n.t('tasks.statusOptions.inProgress'), value: 'IN_PROGRESS' },
                    { label: i18n.t('tasks.statusOptions.done'), value: 'DONE' },
                ]}
                selectedValue={status}
                title={i18n.t('tasks.selectStatus')}
            />

            <SelectModal
                visible={priorityPickerVisible}
                onClose={() => setPriorityPickerVisible(false)}
                onSelect={setPriority}
                options={Object.keys(PRIORITY_MAP).map(p => ({
                    label: i18n.t(`tasks.priorityOptions.${p.toLowerCase()}`),
                    value: p
                }))}
                selectedValue={priority}
                title={i18n.t('tasks.selectPriority')}
            />

            <SelectModal
                visible={assigneePickerVisible}
                onClose={() => setAssigneePickerVisible(false)}
                onSelect={setAssignee}
                options={[
                    { label: i18n.t('common.unassigned'), value: '' },
                    ...users.map(u => ({ label: u.name, value: u.name }))
                ]}
                selectedValue={assignee}
                title={i18n.t('tasks.selectAssignee')}
            />

            <DatePickerModal
                visible={datePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                onSelect={setDueDate}
                selectedDate={dueDate}
                title={i18n.t('tasks.selectDueDate')}
            />

            {/* Quick Edit Modals */}
            <SelectModal
                visible={quickStatusPickerVisible}
                onClose={() => {
                    setQuickStatusPickerVisible(false);
                    setQuickEditTask(null);
                }}
                onSelect={handleQuickStatusChange}
                options={[
                    { label: i18n.t('tasks.statusOptions.todo'), value: 'TODO' },
                    { label: i18n.t('tasks.statusOptions.inProgress'), value: 'IN_PROGRESS' },
                    { label: i18n.t('tasks.statusOptions.done'), value: 'DONE' },
                ]}
                selectedValue={quickEditTask?.status || 'TODO'}
                title={i18n.t('tasks.updateStatus')}
            />

            <SelectModal
                visible={quickPriorityPickerVisible}
                onClose={() => {
                    setQuickPriorityPickerVisible(false);
                    setQuickEditTask(null);
                }}
                onSelect={handleQuickPriorityChange}
                options={Object.keys(PRIORITY_MAP).map(p => ({
                    label: i18n.t(`tasks.priorityOptions.${p.toLowerCase()}`),
                    value: p
                }))}
                selectedValue={quickEditTask ? REVERSE_PRIORITY_MAP[quickEditTask.priority] : 'MEDIUM'}
                title={i18n.t('tasks.updatePriority')}
            />
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
    // Card styles removed as they are now in TaskCard component
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
