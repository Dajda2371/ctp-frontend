import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAddressFromCoordinates } from '@/utils/geocoding';
import { LocationPicker } from '@/components/LocationPicker';

export interface Site {
    id: number;
    name: string;
    address: string;
    level?: string;
    facility_manager: number | null;
    property_manager: number | null;
    facility_manager_name?: string | null;
    property_manager_name?: string | null;
    latitude: number;
    longitude: number;
}

interface SiteCardProps {
    site: Site;
    onEdit: (site: Site) => void;
}

export function SiteCard({ site, onEdit }: SiteCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const [geoAddress, setGeoAddress] = useState<string | null>(null);
    const [mapModalVisible, setMapModalVisible] = useState(false);

    useEffect(() => {
        if (site.latitude && site.longitude) {
            getAddressFromCoordinates(site.latitude, site.longitude).then(setGeoAddress);
        }
    }, [site.latitude, site.longitude]);

    const openInMaps = () => {
        if (!site.latitude || !site.longitude) return;
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${site.latitude},${site.longitude}`;
        const label = site.name;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url);
        } else {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`);
        }
    };

    return (
        <ThemedView style={[styles.card, { borderColor: theme.neutral + '20', backgroundColor: 'rgba(100, 120, 140, 0.08)' }]}>
            <View style={styles.cardContent}>
                <ThemedText style={styles.cardTitle}>{site.name}</ThemedText>
                <ThemedText style={styles.cardSubtitle}>{site.address}</ThemedText>
                <View style={styles.managerInfo}>
                    <IconSymbol name="wrench.fill" size={12} color={theme.icon} />
                    <ThemedText style={styles.cardDetail}>FM: {site.facility_manager_name || 'None'}</ThemedText>
                </View>
                <View style={styles.managerInfo}>
                    <IconSymbol name="house.fill" size={12} color={theme.icon} />
                    <ThemedText style={styles.cardDetail}>PM: {site.property_manager_name || 'None'}</ThemedText>
                </View>

                {/* Location Row */}
                {site.latitude && site.longitude && (
                    <View style={styles.locationRow}>
                        <TouchableOpacity onPress={() => setMapModalVisible(true)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <IconSymbol name="mappin.and.ellipse" size={14} color={theme.text} />
                                <ThemedText style={styles.geoAddressText} numberOfLines={1}>
                                    {geoAddress || `${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)}`}
                                </ThemedText>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={openInMaps} style={[styles.mapButton, { backgroundColor: theme.primary }]}>
                            <IconSymbol name="mappin" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => onEdit(site)} style={styles.actionButton}>
                    <IconSymbol name="pencil" size={20} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <LocationPicker
                visible={mapModalVisible}
                onClose={() => setMapModalVisible(false)}
                onLocationSelect={() => { }}
                initialLatitude={site.latitude}
                initialLongitude={site.longitude}
                readOnly={true}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    cardContent: {
        flex: 1,
        gap: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        fontSize: 14,
        opacity: 0.7,
    },
    cardDetail: {
        fontSize: 12,
        opacity: 0.6,
    },
    managerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    geoAddressText: {
        fontSize: 12,
        textDecorationLine: 'underline',
        opacity: 0.7,
    },
    mapButton: {
        padding: 10,
        borderRadius: 8,
    },
    cardActions: {
        marginLeft: 12,
    },
    actionButton: {
        padding: 8,
    },
});
