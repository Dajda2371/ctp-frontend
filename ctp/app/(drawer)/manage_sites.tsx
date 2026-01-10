import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Alert, RefreshControl, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSites, createSite, updateSite, deleteSite } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { canManageSites } from '@/constants/roles';
import { LocationPicker } from '@/components/LocationPicker';
import { getAddressFromCoordinates } from '@/utils/geocoding';
import { Linking } from 'react-native';
import { SiteCard } from '@/components/SiteCard';

interface Site {
    id: number;
    name: string;
    address: string;
    coordinator: string;
    latitude?: number;
    longitude?: number;
}

export default function ManageSitesScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user } = useAuth();

    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSite, setEditingSite] = useState<Site | null>(null);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [coordinator, setCoordinator] = useState('');
    const [siteLatitude, setSiteLatitude] = useState<number | undefined>(undefined);
    const [siteLongitude, setSiteLongitude] = useState<number | undefined>(undefined);
    const [locationPickerVisible, setLocationPickerVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);

    const fetchSites = async () => {
        try {
            const data = await getSites();
            setSites(data);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to fetch sites');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSites();
    }, []);

    const openModal = (site?: Site) => {
        if (site) {
            setEditingSite(site);
            setName(site.name);
            setAddress(site.address);
            setCoordinator(site.coordinator);
            setSiteLatitude(site.latitude);
            setSiteLongitude(site.longitude);
        } else {
            setEditingSite(null);
            setName('');
            setAddress('');
            setCoordinator('');
            setSiteLatitude(undefined);
            setSiteLongitude(undefined);
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingSite(null);
        setName('');
        setAddress('');
        setCoordinator('');
        setSiteLatitude(undefined);
        setSiteLongitude(undefined);
    };

    const handleSubmit = async () => {
        if (!name || !address) {
            Alert.alert('Validation Error', 'Name and Address are required.');
            return;
        }

        setSubmitting(true);
        try {
            const siteData = {
                name,
                address,
                coordinator: coordinator || null, // Send null if empty
                latitude: siteLatitude,
                longitude: siteLongitude
            };
            if (editingSite) {
                await updateSite(editingSite.id, siteData);
                Alert.alert('Success', 'Site updated successfully');
            } else {
                await createSite(siteData);
                Alert.alert('Success', 'Site created successfully');
            }
            closeModal();
            fetchSites(); // Refresh list
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (site: Site) => {
        setSiteToDelete(site);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!siteToDelete) return;

        try {
            await deleteSite(siteToDelete.id);
            fetchSites();
            setDeleteModalVisible(false);
            setSiteToDelete(null);
            closeModal(); // Close the edit modal as well
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete site');
        }
    };

    if (!canManageSites(user?.role)) {
        return (
            <ThemedView style={styles.center}>
                <ThemedText>You do not have permission to view this page.</ThemedText>
            </ThemedView>
        );
    }

    const renderSiteItem = ({ item }: { item: Site }) => (
        <SiteCard site={item} onEdit={openModal} />
    );

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Manage Sites', headerShown: true }} />

            <View style={styles.header}>
                <ThemedText type="title">Manage Sites</ThemedText>
                <ThemedText style={styles.subtitle}>Add, edit, or remove sites</ThemedText>
            </View>

            <FlatList
                data={sites}
                renderItem={renderSiteItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <ThemedText>No sites found.</ThemedText>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => openModal()}
            >
                <IconSymbol name="plus" size={24} color="#fff" />
            </TouchableOpacity>

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
                            <ThemedText type="subtitle">{editingSite ? 'Edit Site' : 'Add New Site'}</ThemedText>
                            <TouchableOpacity onPress={closeModal}>
                                <IconSymbol name="xmark" size={24} color={theme.icon} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <ThemedText style={styles.label}>Name</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.neutral + '40' }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Site Name"
                                placeholderTextColor={theme.icon + '80'}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <ThemedText style={styles.label}>Address</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.neutral + '40' }]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Site Address"
                                placeholderTextColor={theme.icon + '80'}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <ThemedText style={styles.label}>Coordinator Role</ThemedText>
                            <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                <select
                                    value={coordinator}
                                    onChange={(e) => setCoordinator(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: 50,
                                        border: 'none',
                                        background: 'transparent',
                                        color: theme.text,
                                        fontSize: 16,
                                    }}
                                >
                                    <option value="">None</option>
                                    <option value="admin">Admin</option>
                                    <option value="property_manager">Property Manager</option>
                                    <option value="facility_manager">Facility Manager</option>
                                </select>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <ThemedText style={styles.label}>Location</ThemedText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <TouchableOpacity
                                    style={[
                                        styles.locationButton,
                                        { borderColor: theme.primary }
                                    ]}
                                    onPress={() => setLocationPickerVisible(true)}
                                >
                                    <IconSymbol name="map" size={20} color={theme.primary} />
                                    <ThemedText style={{ color: theme.primary, fontWeight: '600' }}>
                                        {siteLatitude && siteLongitude ? 'Change Location' : 'Set Location'}
                                    </ThemedText>
                                </TouchableOpacity>
                                {siteLatitude && siteLongitude && (
                                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                                        {siteLatitude.toFixed(4)}, {siteLongitude.toFixed(4)}
                                    </ThemedText>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <ThemedText style={styles.submitButtonText}>{submitting ? 'Saving...' : 'Save Site'}</ThemedText>
                        </TouchableOpacity>

                        {editingSite && (
                            <TouchableOpacity
                                style={[styles.deleteButton, { backgroundColor: '#ff4444', borderColor: '#ff4444' }]}
                                onPress={() => handleDelete(editingSite)}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Delete Site</ThemedText>
                            </TouchableOpacity>
                        )}
                    </ThemedView>
                </KeyboardAvoidingView>
            </Modal>

            <LocationPicker
                visible={locationPickerVisible}
                onClose={() => setLocationPickerVisible(false)}
                onLocationSelect={(loc) => {
                    setSiteLatitude(loc.latitude);
                    setSiteLongitude(loc.longitude);
                }}
                initialLatitude={siteLatitude}
                initialLongitude={siteLongitude}
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
                        <ThemedText type="subtitle" style={styles.alertTitle}>Delete Site</ThemedText>
                        <ThemedText style={styles.alertMessage}>
                            Are you sure you want to delete "{siteToDelete?.name}"? This action cannot be undone.
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
        </ThemedView>
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
    card: {
        flexDirection: 'row',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        opacity: 0.7,
    },
    cardDetail: {
        fontSize: 12,
        opacity: 0.5,
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
        marginLeft: 12,
    },
    actionButton: {
        padding: 8,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderRadius: 8,
        gap: 8,
    },
    picker: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
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
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    formGroup: {
        marginBottom: 16,
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
    submitButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
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
        backgroundColor: 'transparent',
    },
    // Custom Alert Styles
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
