import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Alert, RefreshControl, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSites, createSite, updateSite, deleteSite, getPossiblePropertyManagers, getPossibleFacilityManagers, getUsers } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { canManageSites } from '@/constants/roles';
import { LocationPicker } from '@/components/LocationPicker';
import { getAddressFromCoordinates } from '@/utils/geocoding';
import { Linking } from 'react-native';
import { SiteCard, Site } from '@/components/SiteCard';
import { SelectModal } from '@/components/SelectModal';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import i18n from '@/i18n';



interface User {
    id: number;
    name: string;
    role: string;
}

export default function ManageSitesScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user } = useAuth();

    const [sites, setSites] = useState<Site[]>([]);
    const [facilityManagers, setFacilityManagers] = useState<User[]>([]);
    const [propertyManagers, setPropertyManagers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSite, setEditingSite] = useState<Site | null>(null);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [selectedFacilityManager, setSelectedFacilityManager] = useState<string>('');
    const [selectedPropertyManager, setSelectedPropertyManager] = useState<string>('');
    const [siteLatitude, setSiteLatitude] = useState<number | undefined>(undefined);
    const [siteLongitude, setSiteLongitude] = useState<number | undefined>(undefined);
    const [locationPickerVisible, setLocationPickerVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);

    // Custom Picker Modal States
    const [fmPickerVisible, setFmPickerVisible] = useState(false);
    const [pmPickerVisible, setPmPickerVisible] = useState(false);

    const fetchSites = useCallback(async () => {
        try {
            const sitesData = await getSites();
            const [facilityManagersData, propertyManagersData] = await Promise.all([
                getPossibleFacilityManagers(),
                getPossiblePropertyManagers(),
            ]);

            let usersData: User[] = [];
            // Try to fetch users, but don't fail the whole operation if it fails
            try {
                usersData = await getUsers() as User[];
            } catch (userError) {
                console.error('Failed to fetch users for manager names:', userError);
                // Continue with empty users array
            }

            const usersMap = new Map(usersData.map(u => [u.id, u.name]));

            const enrichedSites = (sitesData as Site[]).map(site => ({
                ...site,
                facility_manager_name: site.facility_manager ? usersMap.get(site.facility_manager) : null,
                property_manager_name: site.property_manager ? usersMap.get(site.property_manager) : null,
            }));

            setSites(enrichedSites);
            setFacilityManagers(facilityManagersData);
            setPropertyManagers(propertyManagersData);
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message || i18n.t('sites.fetchFailed'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchSites();
    }, [fetchSites]);

    useAutoRefresh(fetchSites);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSites();
    }, [fetchSites]);

    const openModal = (site?: Site) => {
        if (site) {
            setEditingSite(site);
            setName(site.name);
            setAddress(site.address);
            // Pre-select managers using IDs directly
            setSelectedFacilityManager(site.facility_manager ? site.facility_manager.toString() : '');
            setSelectedPropertyManager(site.property_manager ? site.property_manager.toString() : '');
            setSiteLatitude(site.latitude);
            setSiteLongitude(site.longitude);
        } else {
            setEditingSite(null);
            setName('');
            setAddress('');
            setSelectedFacilityManager('');
            setSelectedPropertyManager('');
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
        setSelectedFacilityManager('');
        setSelectedPropertyManager('');
        setSiteLatitude(undefined);
        setSiteLongitude(undefined);
    };

    const handleSubmit = async () => {
        if (!name || !address) {
            Alert.alert(i18n.t('common.validationError'), i18n.t('manageSites.validation.nameAddressRequired'));
            return;
        }

        const fmId = selectedFacilityManager ? parseInt(selectedFacilityManager) : null;
        const pmId = selectedPropertyManager ? parseInt(selectedPropertyManager) : null;

        setSubmitting(true);
        try {
            let siteId: number;

            if (editingSite) {
                const siteData = {
                    name,
                    address,
                    latitude: siteLatitude,
                    longitude: siteLongitude,
                    facility_manager: fmId,
                    property_manager: pmId
                };
                await updateSite(editingSite.id, siteData);
                siteId = editingSite.id;
                Alert.alert(i18n.t('common.success'), i18n.t('manageSites.updated'));
            } else {
                // For create, coordinates and both managers are required
                if (siteLatitude === undefined || siteLongitude === undefined) {
                    Alert.alert(i18n.t('common.validationError'), i18n.t('manageSites.validation.locationRequired'));
                    setSubmitting(false);
                    return;
                }
                if (!fmId || !pmId) {
                    Alert.alert(i18n.t('common.validationError'), i18n.t('manageSites.validation.managersRequired'));
                    setSubmitting(false);
                    return;
                }
                const siteData = {
                    name,
                    address,
                    latitude: siteLatitude,
                    longitude: siteLongitude,
                    facility_manager: fmId,
                    property_manager: pmId
                };
                const newSite = await createSite(siteData);
                siteId = newSite.id;
                Alert.alert(i18n.t('common.success'), i18n.t('manageSites.created'));
            }

            closeModal();
            fetchSites();
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message || i18n.t('common.operationFailed'));
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
            Alert.alert(i18n.t('common.error'), error.message || i18n.t('manageSites.deleteFailed'));
        }
    };

    if (!canManageSites(user?.role)) {
        return (
            <ThemedView style={styles.center}>
                <ThemedText>{i18n.t('manageSites.permissionDenied')}</ThemedText>
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
                <ThemedText type="title">{i18n.t('manageSites.title')}</ThemedText>
                <ThemedText style={styles.subtitle}>{i18n.t('manageSites.subtitle')}</ThemedText>
            </View>

            <FlatList
                data={sites}
                renderItem={renderSiteItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <ThemedText>{i18n.t('sites.noSites')}</ThemedText>
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
                            <ThemedText type="subtitle">{editingSite ? i18n.t('manageSites.editSite') : i18n.t('manageSites.addSite')}</ThemedText>
                            <TouchableOpacity onPress={closeModal}>
                                <IconSymbol name="xmark" size={24} color={theme.icon} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <ThemedText style={styles.label}>{i18n.t('manageSites.name')}</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.neutral + '40' }]}
                                value={name}
                                onChangeText={setName}
                                placeholder={i18n.t('manageSites.namePlaceholder')}
                                placeholderTextColor={theme.icon + '80'}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <ThemedText style={styles.label}>{i18n.t('manageSites.address')}</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.neutral + '40' }]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder={i18n.t('manageSites.addressPlaceholder')}
                                placeholderTextColor={theme.icon + '80'}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <ThemedText style={styles.label}>{i18n.t('manageSites.facilityManager')}</ThemedText>
                            <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                {Platform.OS === 'web' ? (
                                    <select
                                        value={selectedFacilityManager}
                                        onChange={(e) => setSelectedFacilityManager(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: 50,
                                            border: 'none',
                                            background: 'transparent',
                                            color: theme.text,
                                            fontSize: 16,
                                        }}
                                    >
                                        <option value="">{i18n.t('common.none')}</option>
                                        {facilityManagers.map(u => (
                                            <option key={u.id} value={u.id.toString()}>{u.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <TouchableOpacity
                                        style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                                        onPress={() => setFmPickerVisible(true)}
                                    >
                                        <ThemedText style={{ color: selectedFacilityManager ? theme.text : (theme.icon + '80') }}>
                                            {facilityManagers.find(u => u.id.toString() === selectedFacilityManager)?.name || i18n.t('manageSites.selectManager')}
                                        </ThemedText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <ThemedText style={styles.label}>{i18n.t('manageSites.propertyManager')}</ThemedText>
                            <View style={[styles.picker, { borderColor: theme.neutral + '40' }]}>
                                {Platform.OS === 'web' ? (
                                    <select
                                        value={selectedPropertyManager}
                                        onChange={(e) => setSelectedPropertyManager(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: 50,
                                            border: 'none',
                                            background: 'transparent',
                                            color: theme.text,
                                            fontSize: 16,
                                        }}
                                    >
                                        <option value="">{i18n.t('common.none')}</option>
                                        {propertyManagers.map(u => (
                                            <option key={u.id} value={u.id.toString()}>{u.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <TouchableOpacity
                                        style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                                        onPress={() => setPmPickerVisible(true)}
                                    >
                                        <ThemedText style={{ color: selectedPropertyManager ? theme.text : (theme.icon + '80') }}>
                                            {propertyManagers.find(u => u.id.toString() === selectedPropertyManager)?.name || i18n.t('manageSites.selectManager')}
                                        </ThemedText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <ThemedText style={styles.label}>{i18n.t('common.location')}</ThemedText>
                            {siteLatitude && siteLongitude ? (
                                <View style={styles.locationRow}>
                                    <TouchableOpacity onPress={() => setLocationPickerVisible(true)} style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <IconSymbol name="mappin.and.ellipse" size={16} color={theme.text} />
                                            <ThemedText style={[styles.addressText, { color: theme.text }]} numberOfLines={1}>
                                                {siteLatitude.toFixed(4)}, {siteLongitude.toFixed(4)}
                                            </ThemedText>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => setLocationPickerVisible(true)} style={styles.mapButton}>
                                        <IconSymbol name="map" size={18} color={theme.primary} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        styles.locationButton,
                                        { borderColor: theme.primary }
                                    ]}
                                    onPress={() => setLocationPickerVisible(true)}
                                >
                                    <IconSymbol name="map" size={20} color={theme.primary} />
                                    <ThemedText style={{ color: theme.primary, fontWeight: '600' }}>
                                        {i18n.t('common.setLocation')}
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <ThemedText style={styles.submitButtonText}>{submitting ? i18n.t('common.saving') : i18n.t('manageSites.saveSite')}</ThemedText>
                        </TouchableOpacity>

                        {editingSite && (
                            <TouchableOpacity
                                style={[styles.deleteButton, { backgroundColor: '#ff4444', borderColor: '#ff4444' }]}
                                onPress={() => handleDelete(editingSite)}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>{i18n.t('manageSites.deleteSite')}</ThemedText>
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
                        <ThemedText type="subtitle" style={styles.alertTitle}>{i18n.t('manageSites.deleteSite')}</ThemedText>
                        <ThemedText style={styles.alertMessage}>
                            {i18n.t('manageSites.deleteConfirm', { name: siteToDelete?.name })}
                        </ThemedText>

                        <View style={styles.alertActions}>
                            <TouchableOpacity
                                style={styles.alertButton}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <ThemedText style={{ color: theme.text }}>{i18n.t('common.cancel')}</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.alertButton, { backgroundColor: '#ff4444' }]}
                                onPress={confirmDelete}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>{i18n.t('common.delete')}</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </ThemedView>
                </View>
            </Modal>

            {/* Custom Picker Modals */}
            <SelectModal
                visible={fmPickerVisible}
                onClose={() => setFmPickerVisible(false)}
                onSelect={setSelectedFacilityManager}
                options={[
                    { label: i18n.t('common.none'), value: '' },
                    ...facilityManagers.map(u => ({ label: u.name, value: u.id.toString() }))
                ]}
                selectedValue={selectedFacilityManager}
                title={i18n.t('manageSites.selectFm')}
            />

            <SelectModal
                visible={pmPickerVisible}
                onClose={() => setPmPickerVisible(false)}
                onSelect={setSelectedPropertyManager}
                options={[
                    { label: i18n.t('common.none'), value: '' },
                    ...propertyManagers.map(u => ({ label: u.name, value: u.id.toString() }))
                ]}
                selectedValue={selectedPropertyManager}
                title={i18n.t('manageSites.selectPm')}
            />
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
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
    },
    addressText: {
        fontSize: 14,
        textDecorationLine: 'underline',
        opacity: 0.8,
    },
    mapButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
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
