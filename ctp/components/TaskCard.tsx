import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAddressFromCoordinates } from '@/utils/geocoding';
import { LocationPicker } from '@/components/LocationPicker';
import { PhotoGalleryModal } from '@/components/PhotoGalleryModal';
import { TaskPhotoItem } from '@/components/TaskPhotoItem';
import { deleteTaskPhoto, uploadTaskPhoto, getTaskPhotos } from '@/constants/api';

// Define Task Interface locally if not exported, or better, import from central types
// For now, mirroring the structure
export interface Task {
    id: number;
    site_id: number;
    title: string;
    description: string | null;
    status: string;
    priority: number;
    assignee: string | null;
    due_date: string | null;
    photos: (string | { id: number; url: string } | { url: string })[]; // Allow both for robustness
    latitude?: number;
    longitude?: number;
}

interface TaskCardProps {
    task: Task;
    siteName: string;
    onEdit: (task: Task) => void;
    onStatusPress?: () => void;
    onPriorityPress?: () => void;
    onTaskUpdate?: () => void;
}

const REVERSE_PRIORITY_MAP: Record<number, string> = {
    1: 'LOWEST',
    2: 'LOW',
    3: 'MEDIUM',
    4: 'HIGH',
    5: 'HIGHEST',
};

export function TaskCard({ task, siteName, onEdit, onStatusPress, onPriorityPress, onTaskUpdate }: TaskCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const [address, setAddress] = useState<string | null>(null);
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [galleryVisible, setGalleryVisible] = useState(false);
    const [detailedPhotos, setDetailedPhotos] = useState<{ id: number; url: string }[]>([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [savingPhoto, setSavingPhoto] = useState(false);

    useEffect(() => {
        if (task.latitude && task.longitude) {
            getAddressFromCoordinates(task.latitude, task.longitude).then(setAddress);
        }
    }, [task.latitude, task.longitude]);

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
            case 1: return '#8E8E93';
            case 2: return '#32ADE6';
            case 3: return '#FF9500';
            case 4: return '#FF2D55';
            case 5: return '#AF52DE';
            default: return theme.text;
        }
    };

    const openInMaps = () => {
        if (!task.latitude || !task.longitude) return;
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${task.latitude},${task.longitude}`;
        const label = task.title;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url);
        } else {
            // Fallback to Google Maps web
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${task.latitude},${task.longitude}`);
        }
    };

    const handleOpenGallery = async () => {
        setLoadingPhotos(true);
        try {
            // Fetch latest photos to ensure we have IDs
            const data = await getTaskPhotos(task.id);
            setDetailedPhotos(data.photos || []);
            setGalleryVisible(true);
        } catch (error) {
            console.error("Failed to fetch photos", error);
            Alert.alert("Error", "Could not load photos.");
        } finally {
            setLoadingPhotos(false);
        }
    };

    const handlePhotoSave = async (originalUrl: string, newUri: string) => {
        try {
            setSavingPhoto(true);
            const originalPhoto = detailedPhotos.find(p => p.url === originalUrl);

            if (originalPhoto) {
                // 1. Delete original photo
                await deleteTaskPhoto(task.id, originalPhoto.id);
            }

            // 2. Upload new photo
            const fileName = `edited-${Date.now()}.jpg`;
            await uploadTaskPhoto(task.id, {
                uri: newUri,
                type: 'image/jpeg',
                name: fileName
            });

            // 3. Refresh
            if (onTaskUpdate) {
                onTaskUpdate();
            } else {
                // Even if no global refresh, refresh local gallery
                const data = await getTaskPhotos(task.id);
                setDetailedPhotos(data.photos || []);
            }
            Alert.alert("Success", "Photo updated successfully.");
        } catch (error) {
            console.error("Failed to update photo", error);
            Alert.alert("Error", "Failed to update photo.");
        } finally {
            setSavingPhoto(false);
            setGalleryVisible(false);
        }
    };

    // Helper to get photo URL safely
    const getPhotoUrl = (photo: string | { url: string }): string => {
        if (typeof photo === 'string') return photo;
        return photo.url;
    };

    return (
        <ThemedView style={[styles.card, { borderColor: theme.neutral + '20', backgroundColor: 'rgba(100, 120, 140, 0.08)' }]}>
            <View style={styles.cardHeader}>
                <View style={styles.taskBadges}>
                    <TouchableOpacity onPress={onStatusPress} disabled={!onStatusPress}>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                            <ThemedText style={[styles.badgeText, { color: getStatusColor(task.status) }]}>
                                {task.status.replace('_', ' ')}
                            </ThemedText>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onPriorityPress} disabled={!onPriorityPress}>
                        <View style={[styles.badge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                            <ThemedText style={[styles.badgeText, { color: getPriorityColor(task.priority) }]}>
                                {REVERSE_PRIORITY_MAP[task.priority] || 'MEDIUM'}
                            </ThemedText>
                        </View>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => onEdit(task)} style={styles.actionButton}>
                    <IconSymbol name="pencil" size={20} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ThemedText style={styles.cardTitle}>{task.title}</ThemedText>

            {task.description && (
                <ThemedText numberOfLines={2} style={styles.cardDescription}>
                    {task.description}
                </ThemedText>
            )}

            {/* Address Row */}
            {task.latitude && task.longitude && (
                <View style={styles.locationRow}>
                    <TouchableOpacity onPress={() => setMapModalVisible(true)} style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <IconSymbol name="mappin.and.ellipse" size={16} color={theme.text} />
                            <ThemedText style={[styles.addressText, { color: theme.text }]} numberOfLines={1}>
                                {address || `${task.latitude.toFixed(4)}, ${task.longitude.toFixed(4)}`}
                            </ThemedText>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={openInMaps} style={styles.mapButton}>
                        <IconSymbol name="map" size={18} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Photo Thumbnail */}
            {task.photos && task.photos.length > 0 && (
                <View style={styles.photoRow}>
                    <TouchableOpacity onPress={handleOpenGallery} disabled={loadingPhotos}>
                        <TaskPhotoItem
                            photo={{ id: 0, url: getPhotoUrl(task.photos[0]) }}
                            onPress={handleOpenGallery}
                        // No onDelete here
                        />
                        {loadingPhotos && (
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
                                <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>...</ThemedText>
                            </View>
                        )}
                        {task.photos.length > 1 && (
                            <View style={[styles.photoBadge, { backgroundColor: theme.primary }]}>
                                <ThemedText style={styles.photoBadgeText}>+{task.photos.length - 1}</ThemedText>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <View style={[styles.cardFooter, { borderTopColor: theme.neutral + '15' }]}>
                <View style={styles.footerItem}>
                    <IconSymbol name="building.2.fill" size={14} color={theme.text} style={{ opacity: 0.6 }} />
                    <ThemedText style={styles.footerText}>
                        {siteName}
                    </ThemedText>
                </View>

                {task.assignee && (
                    <View style={styles.footerItem}>
                        <IconSymbol name="person.fill" size={14} color={theme.text} style={{ opacity: 0.6 }} />
                        <ThemedText style={styles.footerText}>
                            {task.assignee}
                        </ThemedText>
                    </View>
                )}

                {task.due_date && (
                    <View style={styles.footerItem}>
                        <IconSymbol name="calendar" size={14} color={theme.text} style={{ opacity: 0.6 }} />
                        <ThemedText style={styles.footerText}>
                            {new Date(task.due_date).toLocaleDateString()}
                        </ThemedText>
                    </View>
                )}
            </View>

            <LocationPicker
                visible={mapModalVisible}
                onClose={() => setMapModalVisible(false)}
                onLocationSelect={() => { }} // Read-only mode, essentially
                initialLatitude={task.latitude}
                initialLongitude={task.longitude}
                readOnly={true}
            // We don't need site location fallback here as we are viewing a specific task location
            />

            <PhotoGalleryModal
                visible={galleryVisible}
                photos={detailedPhotos}
                onClose={() => setGalleryVisible(false)}
                onSavePhoto={handlePhotoSave}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        gap: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    taskBadges: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    actionButton: {
        padding: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardDescription: {
        opacity: 0.7,
        fontSize: 14,
        lineHeight: 20,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
    },
    addressText: {
        fontSize: 13,
        textDecorationLine: 'underline',
    },
    mapButton: {
        padding: 6,
    },
    photoRow: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    photoBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    photoBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
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
});
