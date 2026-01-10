import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, Text, Dimensions, Platform, Linking, TextInput } from 'react-native';
// Remove native import that crashes Expo Go
// import MapLibreGL from '@maplibre/maplibre-react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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

    const [lat, setLat] = useState(startLat.toString());
    const [long, setLong] = useState(startLong.toString());

    useEffect(() => {
        setLat((initialLatitude || siteLatitude || defaultLat).toString());
        setLong((initialLongitude || siteLongitude || defaultLong).toString());
    }, [visible, initialLatitude, initialLongitude, siteLatitude, siteLongitude]);

    const handleConfirm = () => {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(long);
        if (!isNaN(latitude) && !isNaN(longitude)) {
            onLocationSelect({ latitude, longitude });
            onClose();
        }
    };

    const openInMaps = () => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${long}`;
        const label = 'Location';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });
        if (url) {
            Linking.openURL(url);
        } else {
            window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${long}`, '_blank');
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <View style={[styles.content, styles.modalContent, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.button}>
                            <IconSymbol name="xmark" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: theme.text }]}>
                            {readOnly ? 'View Location' : 'Set Location'}
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.body}>
                        <View style={styles.infoBox}>
                            <IconSymbol name="info.circle" size={20} color={theme.icon} />
                            <Text style={[styles.infoText, { color: theme.icon }]}>
                                In-app maps are not available in Expo Go. Please use coordinates or open in external maps.
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Latitude</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.neutral + '40', backgroundColor: readOnly ? theme.neutral + '10' : 'transparent' }]}
                                value={lat}
                                onChangeText={setLat}
                                keyboardType="numeric"
                                editable={!readOnly}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Longitude</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.neutral + '40', backgroundColor: readOnly ? theme.neutral + '10' : 'transparent' }]}
                                value={long}
                                onChangeText={setLong}
                                keyboardType="numeric"
                                editable={!readOnly}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.mapButton, { borderColor: theme.primary }]}
                            onPress={openInMaps}
                        >
                            <IconSymbol name="map" size={20} color={theme.primary} />
                            <Text style={[styles.mapButtonText, { color: theme.primary }]}>View in Maps App</Text>
                        </TouchableOpacity>
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
    content: {
        borderRadius: 12,
        overflow: 'hidden',
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalContent: {
        maxHeight: 600,
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
    body: {
        padding: 20,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 10,
        alignItems: 'center'
    },
    infoText: {
        fontSize: 13,
        flex: 1,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    mapButtonText: {
        fontWeight: '600',
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
