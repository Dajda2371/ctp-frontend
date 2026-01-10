import React, { useRef, useEffect, useState } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const marker = useRef<maplibregl.Marker | null>(null);

    const [isFullScreen, setIsFullScreen] = useState(false);

    // Default to Europe/Prague roughly
    const defaultLat = 50.0755;
    const defaultLong = 14.4378;

    const startLat = initialLatitude || siteLatitude || defaultLat;
    const startLong = initialLongitude || siteLongitude || defaultLong;

    useEffect(() => {
        if (!visible) return;

        // Wait for modal to render content
        const timer = setTimeout(() => {
            if (map.current) return;
            if (!mapContainer.current) return;

            const osmStyle = {
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
            };

            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: osmStyle as any,
                center: [startLong, startLat],
                zoom: 14
            });

            // Add initial marker
            marker.current = new maplibregl.Marker({ color: 'red' })
                .setLngLat([startLong, startLat])
                .addTo(map.current);

            map.current.on('click', (e) => {
                if (readOnly) return; // Don't allow changes in read-only mode
                if (marker.current) {
                    marker.current.setLngLat(e.lngLat);
                }
            });

        }, 100);

        return () => clearTimeout(timer);
    }, [visible]);

    const handleConfirm = () => {
        if (marker.current) {
            const { lng, lat } = marker.current.getLngLat();
            onLocationSelect({ longitude: lng, latitude: lat });
        }
        onClose();
    };

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
                        {/* Web Map Container */}
                        <div
                            ref={mapContainer}
                            style={{
                                width: '100%',
                                height: '100%'
                            }}
                        />
                        <style>
                            {`
                                .maplibregl-map {
                                    font-family: inherit;
                                }
                            `}
                        </style>
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
        width: '90%',
        maxWidth: 600
    },
    fullScreenContent: {
        flex: 1,
        borderRadius: 0,
        width: '100%'
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
        overflow: 'hidden',
        backgroundColor: '#eee'
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
});
