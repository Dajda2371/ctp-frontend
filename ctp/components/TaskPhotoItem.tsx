import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_BASE_URL, getToken } from '@/constants/api';



export function TaskPhotoItem({ photo, onDelete, onPress }: { photo: { id: number; url: string }; onDelete?: (id: number) => void; onPress?: (photo: { id: number; url: string }) => void }) {
    const [imageSource, setImageSource] = useState<{ uri: string; headers?: Record<string, string> } | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchImage = async () => {
            const url = photo.url.startsWith('http') ? photo.url : `${API_BASE_URL}${photo.url}`;

            if (Platform.OS === 'web') {
                try {
                    const token = await getToken();
                    const response = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (!response.ok) throw new Error('Failed to load image');

                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);

                    if (isMounted) {
                        setImageSource({ uri: objectUrl });
                    }
                } catch (e) {
                    if (isMounted) setImageSource({ uri: url }); // Fallback
                }
            } else {
                // Native
                try {
                    const token = await getToken();
                    if (isMounted) {
                        setImageSource({
                            uri: url,
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    }
                } catch (e) {
                    if (isMounted) setImageSource({ uri: url });
                }
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
        };
    }, [photo.url]);

    if (!imageSource) {
        return <View style={styles.loadingPlaceholder} />;
    }

    const imageComponent = (
        <Image
            source={imageSource}
            style={styles.image}
            contentFit="cover"
        />
    );

    return (
        <View style={styles.container}>
            {onPress ? (
                <TouchableOpacity onPress={() => onPress(photo)}>
                    {imageComponent}
                </TouchableOpacity>
            ) : (
                imageComponent
            )}

            {onDelete && (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => onDelete(photo.id)}
                >
                    <IconSymbol name="xmark" size={12} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginRight: 10,
        position: 'relative',
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    loadingPlaceholder: {
        width: 80,
        height: 80,
        marginRight: 10,
        backgroundColor: '#eee',
        borderRadius: 8,
    },
    deleteButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
