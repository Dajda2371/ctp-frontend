import { StyleSheet, FlatList, TouchableOpacity, View, TextInput, Alert, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSite, getTasks, createTask, updateTask, deleteTask, getUsers, updateTaskStatus, updateTaskPriority } from '@/constants/api';
import { TaskCard } from '@/components/TaskCard';
import { SelectModal } from '@/components/SelectModal';
import { DatePickerModal } from '@/components/DatePickerModal';

import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { uploadTaskPhoto, deleteTaskPhoto, getTaskPhotos, API_BASE_URL } from '@/constants/api';
import { PhotoEditorModal } from '@/components/PhotoEditorModal';
import { TaskPhotoItem } from '@/components/TaskPhotoItem';

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
}

interface Site {
    id: number;
    name: string;
    address: string;
    facility_manager: number | null;
    property_manager: number | null;
    latitude: number;
    longitude: number;
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
    const [dueDate, setDueDate] = useState('');

    const [submitting, setSubmitting] = useState(false);

    // Photo Management State
    const [existingPhotos, setExistingPhotos] = useState<{ id: number; url: string }[]>([]);
    const [newPhotos, setNewPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [deletedPhotoIds, setDeletedPhotoIds] = useState<number[]>([]);

    // Photo Editor State
    const [editorVisible, setEditorVisible] = useState(false);
    const [editingPhotoUri, setEditingPhotoUri] = useState<string | null>(null);
    const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null); // To track which photo is being edited (if new)

    // Custom Picker Modal State
    const [statusPickerVisible, setStatusPickerVisible] = useState(false);
    const [priorityPickerVisible, setPriorityPickerVisible] = useState(false);
    const [assigneePickerVisible, setAssigneePickerVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);

    // Quick Edit States
    const [quickEditTask, setQuickEditTask] = useState<Task | null>(null);
    const [quickStatusPickerVisible, setQuickStatusPickerVisible] = useState(false);
    const [quickPriorityPickerVisible, setQuickPriorityPickerVisible] = useState(false);

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    const fetchData = useCallback(async () => {
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
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useAutoRefresh(fetchData);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const openModal = (task?: Task) => {
        setModalVisible(true);
        if (task) {
            setEditingTask(task);
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
            setPriority(REVERSE_PRIORITY_MAP[task.priority] || 'MEDIUM');
            setAssignee(task.assignee || '');
            setDueDate(task.due_date ? task.due_date.split('T')[0] : '');

            // Initialize empty first, then fetch
            setExistingPhotos([]);
            setNewPhotos([]);
            setDeletedPhotoIds([]);

            getTaskPhotos(task.id).then(data => {
                setExistingPhotos(data.photos);
            }).catch(() => { });
        } else {
            setEditingTask(null);
            setTitle('');
            setDescription('');
            setStatus('TODO');
            setPriority('MEDIUM');
            setAssignee('');
            setDueDate('');
            setExistingPhotos([]);
            setNewPhotos([]);
            setDeletedPhotoIds([]);
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingTask(null);
        setTitle('');
        setDescription('');
        setStatus('TODO');
        setPriority('MEDIUM');
        setAssignee('');
        setDueDate('');
        setExistingPhotos([]);
        setNewPhotos([]);
        setDeletedPhotoIds([]);
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
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
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
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
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
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleRemoveNewPhoto = (index: number) => {
        setNewPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleMarkPhotoForDeletion = (photoId: number) => {
        setDeletedPhotoIds([...deletedPhotoIds, photoId]);
        setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
    };

    const handleEditNewPhoto = (index: number) => {
        const asset = newPhotos[index];
        setEditingPhotoUri(asset.uri);
        setEditingPhotoIndex(index);
        setEditorVisible(true);
    };

    const handleSaveEditedPhoto = async (newUri: string) => {
        if (editingPhotoIndex !== null) {
            const updatedPhotos = [...newPhotos];
            updatedPhotos[editingPhotoIndex] = {
                ...updatedPhotos[editingPhotoIndex],
                uri: newUri
            };
            setNewPhotos(updatedPhotos);
        }
        setEditorVisible(false);
        setEditingPhotoUri(null);
        setEditingPhotoIndex(null);
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

    const handleQuickStatusChange = async (newStatus: string) => {
        if (!quickEditTask) return;
        try {
            await updateTaskStatus(quickEditTask.id, newStatus);
            setTasks(prev => prev.map(t => t.id === quickEditTask.id ? { ...t, status: newStatus } : t));
            setQuickStatusPickerVisible(false);
            setQuickEditTask(null);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update status');
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
            Alert.alert('Error', error.message || 'Failed to update priority');
        }
    };

    const renderTaskItem = ({ item }: { item: Task }) => (
        <TaskCard
            task={item}
            siteName={site?.name || ''}
            onEdit={openModal}
            onStatusPress={() => {
                setQuickEditTask(item);
                setQuickStatusPickerVisible(true);
            }}
            onPriorityPress={() => {
                setQuickEditTask(item);
                setQuickPriorityPickerVisible(true);
            }}
            onTaskUpdate={fetchData}
        />
    );

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
                <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <IconSymbol name="wrench.fill" size={14} color="rgba(255, 255, 255, 0.7)" />
                        <ThemedText style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13 }}>
                            FM: {users.find(u => u.id === site?.facility_manager)?.name || 'None'}
                        </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <IconSymbol name="house.fill" size={14} color="rgba(255, 255, 255, 0.7)" />
                        <ThemedText style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13 }}>
                            PM: {users.find(u => u.id === site?.property_manager)?.name || 'None'}
                        </ThemedText>
                    </View>
                </View>

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
                                                <option value="TODO">To Do</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="DONE">Done</option>
                                            </select>
                                        ) : (
                                            <TouchableOpacity
                                                style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                                                onPress={() => setStatusPickerVisible(true)}
                                            >
                                                <ThemedText style={{ color: theme.text }}>
                                                    {status === 'TODO' ? 'To Do' : status === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                    <ThemedText style={styles.label}>Priority</ThemedText>
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
                                                <option value="LOWEST">Lowest</option>
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                                <option value="HIGHEST">Highest</option>
                                            </select>
                                        ) : (
                                            <TouchableOpacity
                                                style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                                                onPress={() => setPriorityPickerVisible(true)}
                                            >
                                                <ThemedText style={{ color: theme.text }}>
                                                    {priority.charAt(0) + priority.slice(1).toLowerCase()}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>Due Date</ThemedText>
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
                                                {dueDate || 'Select Date'}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.label}>Assignee</ThemedText>
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
                                            <option value="">Unassigned</option>
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
                                                {assignee || 'Unassigned'}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>


                            {/* Photo Upload Section */}
                            <View style={styles.formGroup}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <ThemedText style={styles.label}>Photos</ThemedText>
                                    <TouchableOpacity onPress={handlePickImage} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <IconSymbol name="plus.circle.fill" size={20} color={theme.primary} />
                                        <ThemedText style={{ color: theme.primary, fontWeight: 'bold' }}>Add Photo</ThemedText>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                                    {/* Existing Photos */}
                                    {/* Existing Photos */}
                                    {existingPhotos.map(photo => (
                                        <TaskPhotoItem
                                            key={photo.id}
                                            photo={photo}
                                            onDelete={handleMarkPhotoForDeletion}
                                        />
                                    ))}


                                    {/* New Photos */}
                                    {newPhotos.map((asset, index) => (
                                        <View key={`new-${index}`} style={{ marginRight: 10, position: 'relative' }}>
                                            <TouchableOpacity onPress={() => handleEditNewPhoto(index)}>
                                                <Image
                                                    source={{ uri: asset.uri }}
                                                    style={{ width: 80, height: 80, borderRadius: 8 }}
                                                    contentFit="cover"
                                                />
                                            </TouchableOpacity>
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
                                </ScrollView>
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

            {/* Photo Editor Modal */}
            <PhotoEditorModal
                visible={editorVisible}
                imageUri={editingPhotoUri}
                onClose={() => setEditorVisible(false)}
                onSave={handleSaveEditedPhoto}
            />

            {/* Custom Picker Modals */}
            <SelectModal
                visible={statusPickerVisible}
                onClose={() => setStatusPickerVisible(false)}
                onSelect={setStatus}
                options={[
                    { label: 'To Do', value: 'TODO' },
                    { label: 'In Progress', value: 'IN_PROGRESS' },
                    { label: 'Done', value: 'DONE' },
                ]}
                selectedValue={status}
                title="Select Status"
            />

            <SelectModal
                visible={priorityPickerVisible}
                onClose={() => setPriorityPickerVisible(false)}
                onSelect={setPriority}
                options={Object.keys(PRIORITY_MAP).map(p => ({
                    label: p.charAt(0) + p.slice(1).toLowerCase(),
                    value: p
                }))}
                selectedValue={priority}
                title="Select Priority"
            />

            <DatePickerModal
                visible={datePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                onSelect={setDueDate}
                selectedDate={dueDate}
                title="Select Due Date"
            />

            <SelectModal
                visible={assigneePickerVisible}
                onClose={() => setAssigneePickerVisible(false)}
                onSelect={setAssignee}
                options={[
                    { label: 'Unassigned', value: '' },
                    ...users.map(u => ({ label: u.name, value: u.name }))
                ]}
                selectedValue={assignee}
                title="Select Assignee"
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
                    { label: 'To Do', value: 'TODO' },
                    { label: 'In Progress', value: 'IN_PROGRESS' },
                    { label: 'Done', value: 'DONE' },
                ]}
                selectedValue={quickEditTask?.status || 'TODO'}
                title="Update Status"
            />

            <SelectModal
                visible={quickPriorityPickerVisible}
                onClose={() => {
                    setQuickPriorityPickerVisible(false);
                    setQuickEditTask(null);
                }}
                onSelect={handleQuickPriorityChange}
                options={Object.keys(PRIORITY_MAP).map(p => ({
                    label: p.charAt(0) + p.slice(1).toLowerCase(),
                    value: p // We pass string key here but will convert to number map in handler
                }))}
                selectedValue={quickEditTask ? REVERSE_PRIORITY_MAP[quickEditTask.priority] : 'MEDIUM'}
                title="Update Priority"
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
                            Are you sure you want to delete &quot;{taskToDelete?.title}&quot;? This action cannot be undone.
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
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.3)',
            },
        }),
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
