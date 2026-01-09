import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MOCK_SITES } from '@/constants/mockData';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CreateTaskScreen() {
    const { siteId } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedSiteId, setSelectedSiteId] = useState((siteId as string) || '');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

    const selectedSite = MOCK_SITES.find(s => s.id === selectedSiteId);

    const handleCreate = () => {
        if (!title || !description || !selectedSiteId) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }

        // In a real app, we would save to a database here
        Alert.alert('Success', 'Task created successfully!', [
            { text: 'OK', onPress: () => router.back() }
        ]);
    };

    const Priorities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Report Problem',
                    headerStyle: { backgroundColor: theme.secondary },
                    headerTintColor: '#fff',
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Building / Site *</ThemedText>
                    <TouchableOpacity
                        style={[styles.pickerBtn, { borderColor: theme.neutral + '40', backgroundColor: theme.background }]}
                        onPress={() => {/* In a real app, open a site picker */ }}
                    >
                        <ThemedText style={selectedSite ? styles.pickerText : styles.placeholderText}>
                            {selectedSite ? selectedSite.name : 'Select a site...'}
                        </ThemedText>
                        <IconSymbol name="chevron.right" size={20} color={theme.icon} />
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Problem Title *</ThemedText>
                    <TextInput
                        style={[styles.input, { borderColor: theme.neutral + '40', color: theme.text, backgroundColor: theme.background }]}
                        placeholder="e.g., Leaking pipe in Hall B"
                        placeholderTextColor={theme.icon + '80'}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Description *</ThemedText>
                    <TextInput
                        style={[styles.textArea, { borderColor: theme.neutral + '40', color: theme.text, backgroundColor: theme.background }]}
                        placeholder="Provide details about the issue..."
                        placeholderTextColor={theme.icon + '80'}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Priority</ThemedText>
                    <View style={styles.priorityContainer}>
                        {Priorities.map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[
                                    styles.priorityBtn,
                                    { borderColor: theme.neutral + '40' },
                                    priority === p && { backgroundColor: theme.primary, borderColor: theme.primary }
                                ]}
                                onPress={() => setPriority(p)}
                            >
                                <ThemedText style={[styles.priorityBtnText, priority === p && { color: '#fff' }]}>
                                    {p}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Photos</ThemedText>
                    <View style={styles.photoActions}>
                        <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.secondary + '15' }]}>
                            <IconSymbol name="paperplane.fill" size={24} color={theme.secondary} />
                            <ThemedText style={{ color: theme.secondary, fontWeight: 'bold' }}>Take Photo</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.secondary + '15' }]}>
                            <IconSymbol name="plus" size={24} color={theme.secondary} />
                            <ThemedText style={{ color: theme.secondary, fontWeight: 'bold' }}>Gallery</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.neutral + '20' }]}>
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={handleCreate}>
                    <ThemedText style={styles.submitBtnText}>Create Task</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    textArea: {
        height: 120,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingTop: 12,
        fontSize: 16,
    },
    pickerBtn: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    pickerText: {
        fontSize: 16,
    },
    placeholderText: {
        fontSize: 16,
        opacity: 0.5,
    },
    priorityContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    priorityBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 80,
        alignItems: 'center',
    },
    priorityBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    photoActions: {
        flexDirection: 'row',
        gap: 12,
    },
    photoBtn: {
        flex: 1,
        height: 80,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
    },
    submitBtn: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
