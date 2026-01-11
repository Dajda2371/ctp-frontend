import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TaskPhotoItem } from './TaskPhotoItem';
import { PhotoEditorModal } from './PhotoEditorModal';

interface PhotoGalleryModalProps {
    visible: boolean;
    photos: { id: number; url: string }[];
    onClose: () => void;
    onSavePhoto: (originalUri: string, newUri: string) => void;
}

export function PhotoGalleryModal({ visible, photos, onClose, onSavePhoto }: PhotoGalleryModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const handlePhotoPress = (photoUrl: string) => {
        setSelectedPhoto(photoUrl);
    };

    const handleCloseEditor = () => {
        setSelectedPhoto(null);
    };

    const handleSaveEditor = (newUri: string) => {
        if (selectedPhoto) {
            onSavePhoto(selectedPhoto, newUri);
        }
        setSelectedPhoto(null);
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <ThemedText type="subtitle">Task Photos</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <IconSymbol name="xmark" size={28} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {photos.length === 0 ? (
                        <View style={styles.emptyState}>
                            <ThemedText>No photos attached to this task.</ThemedText>
                        </View>
                    ) : (
                        <FlatList
                            data={photos}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={3}
                            renderItem={({ item }) => (
                                <View style={styles.gridItem}>
                                    <TaskPhotoItem
                                        photo={item}
                                        onPress={(p) => handlePhotoPress(p.url)}
                                    />
                                </View>
                            )}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </View>
            </View>

            <PhotoEditorModal
                visible={!!selectedPhoto}
                imageUri={selectedPhoto}
                onClose={handleCloseEditor}
                onSave={handleSaveEditor}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    closeButton: {
        padding: 5,
    },
    listContent: {
        padding: 10,
    },
    gridItem: {
        flex: 1 / 3,
        aspectRatio: 1,
        padding: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
