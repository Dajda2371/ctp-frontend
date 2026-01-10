import { StyleSheet, FlatList, TouchableOpacity, View, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSites, getUsers } from '@/constants/api'; // Import API call
import { Site } from '@/components/SiteCard'; // Use Site type with manager names

interface User {
    id: number;
    name: string;
}

export default function SitesScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSites = async () => {
        try {
            const [sitesData, usersData] = await Promise.all([
                getSites(),
                getUsers()
            ]);

            const usersMap = new Map((usersData as User[]).map(u => [u.id, u.name]));

            const enrichedSites = (sitesData as Site[]).map(site => ({
                ...site,
                facility_manager_name: site.facility_manager ? usersMap.get(site.facility_manager) : null,
                property_manager_name: site.property_manager ? usersMap.get(site.property_manager) : null,
            }));

            setSites(enrichedSites);
        } catch (error: any) {
            console.error(error);
            // Optional: Alert.alert('Error', 'Failed to fetch sites');
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

    const renderSiteItem = ({ item }: { item: Site }) => (
        <TouchableOpacity
            style={[styles.siteCard, { backgroundColor: theme.background, borderColor: theme.neutral + '40' }]}
            onPress={() => router.push(`/sites/${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                    <IconSymbol name="building.2.fill" size={24} color={theme.primary} />
                </View>
                <View style={styles.headerText}>
                    <ThemedText type="subtitle" style={{ color: theme.text }}>{item.name}</ThemedText>
                    <ThemedText style={{ color: theme.icon, fontSize: 14 }}>{item.address}</ThemedText>
                </View>
                <IconSymbol name="chevron.right" size={20} color={theme.icon} />
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.managerRow}>
                    <View style={styles.managerInfo}>
                        <IconSymbol name="wrench.fill" size={12} color={theme.icon} />
                        <ThemedText style={styles.footerText}>FM: {item.facility_manager_name || 'Unassigned'}</ThemedText>
                    </View>
                    <View style={[styles.managerInfo, { marginLeft: 16 }]}>
                        <IconSymbol name="house.fill" size={12} color={theme.icon} />
                        <ThemedText style={styles.footerText}>PM: {item.property_manager_name || 'Unassigned'}</ThemedText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { backgroundColor: theme.secondary }]}>
                <ThemedText type="title" style={styles.headerTitle}>Sites</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Manage buildings and technical tasks</ThemedText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={sites}
                    renderItem={renderSiteItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <ThemedText>No sites found.</ThemedText>
                        </View>
                    }
                />
            )}


        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
    },
    headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        marginTop: 4,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
        flexGrow: 1,
    },
    siteCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    cardFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    managerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    managerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        marginLeft: 6,
        opacity: 0.7,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
});
