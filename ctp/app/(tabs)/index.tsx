import { StyleSheet, FlatList, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MOCK_SITES, Site } from '@/constants/mockData';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SitesScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

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
                <View style={styles.coordinatorInfo}>
                    <IconSymbol name="person.fill" size={14} color={theme.icon} />
                    <ThemedText style={styles.footerText}>Coordinator: {item.coordinator}</ThemedText>
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

            <FlatList
                data={MOCK_SITES}
                renderItem={renderSiteItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => {/* TODO: Add Site */ }}
            >
                <IconSymbol name="plus" size={30} color="#fff" />
            </TouchableOpacity>
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
    coordinatorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        marginLeft: 6,
        opacity: 0.7,
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
