import { StyleSheet, FlatList, TouchableOpacity, View, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MOCK_TASKS, Task, MOCK_SITES } from '@/constants/mockData';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SiteTasksScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const [searchQuery, setSearchQuery] = useState('');

    const site = MOCK_SITES.find(s => s.id === id);
    const siteTasks = MOCK_TASKS.filter(t => t.siteId === id && (
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    ));

    const getStatusStyle = (status: Task['status']) => {
        switch (status) {
            case 'DONE': return { color: '#4CAF50', bg: '#E8F5E9', icon: 'checkmark.circle.fill' as const };
            case 'IN_PROGRESS': return { color: theme.primary, bg: theme.primary + '15', icon: 'clock.fill' as const };
            case 'BLOCKED': return { color: theme.danger, bg: theme.danger + '15', icon: 'minus.circle.fill' as const };
            default: return { color: theme.icon, bg: theme.neutral + '20', icon: 'checklist' as const };
        }
    };

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'CRITICAL': return theme.danger;
            case 'HIGH': return '#FF9800';
            case 'MEDIUM': return theme.primary;
            default: return theme.icon;
        }
    };

    const renderTaskItem = ({ item }: { item: Task }) => {
        const statusStyle = getStatusStyle(item.status);

        return (
            <TouchableOpacity
                style={[styles.taskCard, { backgroundColor: theme.background, borderColor: theme.neutral + '30' }]}
                onPress={() => router.push(`/tasks/${item.id}`)}
            >
                <View style={styles.taskTop}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <IconSymbol name={statusStyle.icon} size={14} color={statusStyle.color} />
                        <ThemedText style={[styles.statusText, { color: statusStyle.color }]}>{item.status.replace('_', ' ')}</ThemedText>
                    </View>
                    <View style={[styles.priorityLine, { backgroundColor: getPriorityColor(item.priority) }]} />
                </View>

                <ThemedText type="subtitle" style={styles.taskTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.taskDesc} numberOfLines={2}>{item.description}</ThemedText>

                <View style={styles.taskFooter}>
                    <View style={styles.assigneeInfo}>
                        <View style={[styles.avatar, { backgroundColor: theme.secondary + '20' }]}>
                            <ThemedText style={[styles.avatarText, { color: theme.secondary }]}>{item.assignee[0]}</ThemedText>
                        </View>
                        <ThemedText style={styles.footerText}>{item.assignee}</ThemedText>
                    </View>
                    <ThemedText style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</ThemedText>
                </View>
            </TouchableOpacity>
        );
    };

    if (!site) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText>Site not found</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    title: site.name,
                    headerStyle: { backgroundColor: theme.secondary },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />

            <View style={[styles.header, { backgroundColor: theme.secondary }]}>
                <ThemedText type="title" style={styles.headerTitle}>{site.name}</ThemedText>
                <ThemedText style={styles.headerSubtitle}>{site.address}</ThemedText>

                <View style={styles.searchContainer}>
                    <View style={[styles.searchBar, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                        <IconSymbol name="magnifyingglass" size={18} color="#fff" />
                        <TextInput
                            placeholder="Search site tasks..."
                            placeholderTextColor="rgba(255, 255, 255, 0.6)"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>
            </View>

            <FlatList
                data={siteTasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <IconSymbol name="checklist" size={48} color={theme.icon} />
                        <ThemedText style={styles.emptyText}>No tasks found for this site.</ThemedText>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => router.push({ pathname: '/tasks/create', params: { siteId: id } })}
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
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
    },
    headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        marginTop: 4,
    },
    searchContainer: {
        marginTop: 16,
    },
    searchBar: {
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        marginLeft: 8,
        fontSize: 16,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    taskCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    taskTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    priorityLine: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    taskTitle: {
        fontSize: 18,
        marginBottom: 8,
    },
    taskDesc: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 16,
        lineHeight: 20,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 12,
    },
    assigneeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    footerText: {
        fontSize: 13,
        opacity: 0.7,
    },
    dateText: {
        fontSize: 12,
        opacity: 0.5,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        opacity: 0.5,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
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
