import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    getTask,
    getSite,
    uploadTaskPhoto,
    getTaskPhotos,
    deleteTaskPhoto,
    API_BASE_URL,
    TaskPhoto
} from '@/constants/api';

// Define types locally for the real API response
interface Task {
    id: number;
    site_id: number;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assignee?: string;
    due_date?: string;
    created_at?: string;
}

interface Site {
    id: number;
    name: string;
    address: string;
}

export default function TaskDetailScreen() {
    const { id } = useLocalSearchParams();
    // Ensure id is a string and parse it to number
    const taskIdRaw = Array.isArray(id) ? id[0] : id;
    const taskId = parseInt(taskIdRaw, 10);

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [task, setTask] = useState<Task | null>(null);
    const [site, setSite] = useState<Site | null>(null);
    const [photos, setPhotos] = useState<TaskPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [taskId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [taskData, photosData] = await Promise.all([
                getTask(taskId),
                getTaskPhotos(taskId)
            ]);
            setTask(taskData);
            setPhotos(photosData.photos);

            if (taskData.site_id) {
                const siteData = await getSite(taskData.site_id);
                setSite(siteData);
            }
        } catch (error) {
            console.error('Failed to load task details:', error);
            Alert.alert('Error', 'Failed to load task details');
        } finally {
            setLoading(false);
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
                const asset = result.assets[0];
                const file = {
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: asset.fileName || `photo_${Date.now()}.jpg`,
                };

                // Show preview immediately
                setPreviewImage(asset.uri);
                setUploading(true);

                // Upload
                try {
                    await uploadTaskPhoto(taskId, file);
                    // Refresh photos
                    const updatedPhotos = await getTaskPhotos(taskId);
                    setPhotos(updatedPhotos.photos);
                    setPreviewImage(null);
                } catch (uploadError) {
                    console.error('Upload failed', uploadError);
                    Alert.alert('Upload Failed', 'There was an error uploading the photo.');
                    setPreviewImage(null);
                } finally {
                    setUploading(false);
                }
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleDeletePhoto = (photoId: number) => {
        Alert.alert(
            'Delete Photo',
            'Are you sure you want to delete this photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTaskPhoto(taskId, photoId);
                            setPhotos(prev => prev.filter(p => p.id !== photoId));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete photo');
                        }
                    }
                }
            ]
        );
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DONE': return { color: '#4CAF50', bg: '#E8F5E9', icon: 'checkmark.circle.fill' as const };
            case 'IN_PROGRESS': return { color: theme.primary, bg: theme.primary + '15', icon: 'clock.fill' as const };
            case 'BLOCKED': return { color: theme.danger, bg: theme.danger + '15', icon: 'minus.circle.fill' as const };
            default: return { color: theme.icon, bg: theme.neutral + '20', icon: 'checklist' as const };
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'CRITICAL': return theme.danger;
            case 'HIGH': return '#FF9800';
            case 'MEDIUM': return theme.primary;
            default: return theme.icon;
        }
    };

    if (loading) {
        return (
            <ThemedView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </ThemedView>
        );
    }

    if (!task) {
        return (
            <ThemedView style={[styles.container, styles.center]}>
                <ThemedText>Task not found</ThemedText>
            </ThemedView>
        );
    }

    const statusStyle = getStatusStyle(task.status);

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Task Details',
                    headerStyle: { backgroundColor: theme.secondary },
                    headerTintColor: '#fff',
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(task.priority) }]}>
                        <ThemedText style={styles.tagText}>{task.priority} PRIORITY</ThemedText>
                    </View>
                    <ThemedText type="title" style={styles.title}>{task.title}</ThemedText>

                    {site && (
                        <TouchableOpacity
                            style={styles.siteLink}
                            onPress={() => router.push(`/sites/${site.id}`)}
                        >
                            <IconSymbol name="building.2.fill" size={16} color={theme.primary} />
                            <ThemedText style={[styles.siteName, { color: theme.primary }]}>{site.name}</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[styles.statusBox, { backgroundColor: statusStyle.bg, borderColor: statusStyle.color + '40' }]}>
                    <View style={styles.statusInfo}>
                        <IconSymbol name={statusStyle.icon} size={24} color={statusStyle.color} />
                        <View>
                            <ThemedText style={[styles.statusLabel, { color: statusStyle.color }]}>Current Status</ThemedText>
                            <ThemedText style={[styles.statusValue, { color: statusStyle.color }]}>{task.status.replace('_', ' ')}</ThemedText>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: statusStyle.color }]}>
                        <ThemedText style={styles.actionBtnText}>Update</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Description</ThemedText>
                    <ThemedText style={styles.description}>{task.description || 'No description provided.'}</ThemedText>
                </View>

                <View style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Assignee</ThemedText>
                    <View style={styles.assigneeRow}>
                        <View style={[styles.avatarLarge, { backgroundColor: theme.secondary + '20' }]}>
                            <ThemedText style={[styles.avatarTextLarge, { color: theme.secondary }]}>
                                {task.assignee ? task.assignee[0] : '?'}
                            </ThemedText>
                        </View>
                        <View>
                            <ThemedText style={styles.assigneeName}>{task.assignee || 'Unassigned'}</ThemedText>
                            <ThemedText style={styles.assigneeRole}>Technical Personnel</ThemedText>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>Photos</ThemedText>
                        <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImage} disabled={uploading}>
                            <IconSymbol name="plus" size={20} color={theme.primary} />
                            <ThemedText style={{ color: theme.primary, fontWeight: 'bold' }}>Add</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.photosGrid}>
                        {photos.map(photo => (
                            <View key={photo.id} style={styles.photoContainer}>
                                <Image
                                    source={{ uri: photo.url.startsWith('http') ? photo.url : `${API_BASE_URL}${photo.url}` }}
                                    style={styles.photo}
                                    contentFit="cover"
                                    transition={200}
                                />
                                <TouchableOpacity
                                    style={styles.deletePhotoBtn}
                                    onPress={() => handleDeletePhoto(photo.id)}
                                >
                                    <IconSymbol name="trash.fill" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {uploading && previewImage && (
                            <View style={styles.photoContainer}>
                                <Image
                                    source={{ uri: previewImage }}
                                    style={[styles.photo, { opacity: 0.5 }]}
                                    contentFit="cover"
                                />
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator size="small" color="#fff" />
                                </View>
                            </View>
                        )}
                    </View>

                    {photos.length === 0 && !uploading && (
                        <View style={styles.photoPlaceholder}>
                            <IconSymbol name="paperplane.fill" size={40} color={theme.neutral} />
                            <ThemedText style={styles.photoPlaceholderText}>No photos attached to this task.</ThemedText>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.neutral + '20' }]}>
                <TouchableOpacity style={[styles.completeBtn, { backgroundColor: '#4CAF50' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                    <ThemedText style={styles.completeBtnText}>Mark as Done</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    priorityTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    tagText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 26,
        lineHeight: 32,
        marginBottom: 8,
    },
    siteLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    siteName: {
        fontSize: 16,
        fontWeight: '500',
    },
    statusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    statusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusLabel: {
        fontSize: 12,
        opacity: 0.8,
    },
    statusValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        opacity: 0.8,
    },
    assigneeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarLarge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarTextLarge: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    assigneeName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    assigneeRole: {
        fontSize: 14,
        opacity: 0.6,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addPhotoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
    },
    photoPlaceholder: {
        height: 120,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    photoPlaceholderText: {
        fontSize: 14,
        opacity: 0.5,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    photoContainer: {
        width: 100,
        height: 100,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    deletePhotoBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
    },
    completeBtn: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    completeBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
