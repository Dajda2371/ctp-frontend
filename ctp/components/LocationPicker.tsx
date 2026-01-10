import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, Text, Dimensions } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Set access token to null if using self-hosted or open tiles
MapLibreGL.setAccessToken(null);

interface LocationPickerProps {
    visible: boolean;
    onClose: () => void;
    onLocationSelect: (location: { latitude: number; longitude: number }) => void;
    initialLatitude?: number;
    initialLongitude?: number;
    siteLatitude?: number;
    siteLongitude?: number;
    readOnly?: boolean;
}

export function LocationPicker({
    visible,
    onClose,
    onLocationSelect,
    initialLatitude,
    initialLongitude,
    siteLatitude,
    siteLongitude,
    readOnly = false,
}: LocationPickerProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    // Default to Europe/Prague roughly if nothing provided
    const defaultLat = 50.0755;
    const defaultLong = 14.4378;

    const startLat = initialLatitude || siteLatitude || defaultLat;
    const startLong = initialLongitude || siteLongitude || defaultLong;

    const [coordinates, setCoordinates] = useState<[number, number]>([startLong, startLat]);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        setCoordinates([
            initialLongitude || siteLongitude || defaultLong,
            initialLatitude || siteLatitude || defaultLat
        ]);
    }, [visible, initialLatitude, initialLongitude, siteLatitude, siteLongitude]);

    const handleMapPress = (feature: any) => {
        if (readOnly) return; // Don't allow changes in read-only mode
        const coords = feature.geometry.coordinates;
        setCoordinates(coords);
    };

    const handleConfirm = () => {
        onLocationSelect({
            longitude: coordinates[0],
            latitude: coordinates[1],
        });
        onClose();
    };

    const osmStyleJSON = JSON.stringify({
        "version": 8,
        "sources": {
            "osm": {
                "type": "raster",
                "tiles": ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                "tileSize": 256,
                "attribution": "&copy; OpenStreetMap Contributors",
                "maxzoom": 19
            }
        },
        "layers": [
            {
                "id": "osm",
                "type": "raster",
                "source": "osm"
            }
        ]
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={!isFullScreen}
            onRequestClose={onClose}
        >
            <View style={[
                styles.container,
                isFullScreen ? styles.fullScreenContainer : styles.modalContainer,
                { backgroundColor: isFullScreen ? theme.background : 'rgba(0,0,0,0.5)' }
            ]}>
                <View style={[
                    styles.content,
                    isFullScreen ? styles.fullScreenContent : styles.modalContent,
                    { backgroundColor: theme.background }
                ]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.button}>
                            <IconSymbol name="xmark" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: theme.text }]}>
                            {readOnly ? 'View Location' : 'Set Location'}
                        </Text>
                        <TouchableOpacity onPress={() => setIsFullScreen(!isFullScreen)} style={styles.button}>
                            <IconSymbol
                                name={isFullScreen ? "arrow.down.right.and.arrow.up.left" : "arrow.up.left.and.arrow.down.right"}
                                size={20}
                                color={theme.text}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.mapContainer}>
                        <MapLibreGL.MapView
                            style={styles.map}
                            styleJSON={osmStyleJSON}
                            onPress={handleMapPress}
                        >
                            <MapLibreGL.Camera
                                centerCoordinate={coordinates}
                                zoomLevel={14}
                                animationMode="flyTo"
                                animationDuration={1000}
                            />
                            <MapLibreGL.PointAnnotation
                                id="marker"
                                coordinate={coordinates}
                            >
                                <View style={styles.marker} />
                            </MapLibreGL.PointAnnotation>
                        </MapLibreGL.MapView>
                    </View>

                    {!readOnly && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                                onPress={handleConfirm}
                            >
                                <Text style={styles.confirmText}>Confirm Location</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        justifyContent: 'center',
        padding: 20,
    },
    fullScreenContainer: {
        padding: 0,
    },
    content: {
        borderRadius: 12,
        overflow: 'hidden',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalContent: {
        height: '70%',
        maxHeight: 600,
    },
    fullScreenContent: {
        flex: 1,
        borderRadius: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    button: {
        padding: 8,
    },
    mapContainer: {
        flex: 1,
        overflow: 'hidden', // Ensure map stays within bounds
    },
    map: {
        flex: 1,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        alignItems: 'center',
    },
    confirmButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    confirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    marker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'red',
        borderColor: 'white',
        borderWidth: 2,
    },
});
