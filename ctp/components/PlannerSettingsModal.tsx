import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView, Platform, Alert } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { IconSymbol } from './ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PlannerSettings, getPlannerSettings, updatePlannerSettings } from '@/constants/api';
import { SelectModal } from './SelectModal';
import i18n from '@/i18n';

interface PlannerSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave?: () => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function PlannerSettingsModal({ visible, onClose, onSave }: PlannerSettingsModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [workDays, setWorkDays] = useState<number[]>([0, 1, 2, 3, 4]); // Mon-Fri
    const [loading, setLoading] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    useEffect(() => {
        if (visible) {
            loadSettings();
        }
    }, [visible]);

    const loadSettings = async () => {
        try {
            const settings: PlannerSettings = await getPlannerSettings();
            setStartTime(settings.start_time);
            setEndTime(settings.end_time);
            const days = settings.work_days.split(',').map(d => parseInt(d));
            setWorkDays(days);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const handleSave = async () => {
        if (startTime >= endTime) {
            Alert.alert(i18n.t('common.error'), 'Start time must be before end time');
            return;
        }

        setLoading(true);
        try {
            await updatePlannerSettings({
                start_time: startTime,
                end_time: endTime,
                work_days: workDays.join(','),
            });
            if (onSave) onSave();
            onClose();
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleWorkDay = (dayIndex: number) => {
        if (workDays.includes(dayIndex)) {
            setWorkDays(workDays.filter(d => d !== dayIndex));
        } else {
            setWorkDays([...workDays, dayIndex].sort());
        }
    };

    const generateTimeOptions = () => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                options.push({ label: timeStr, value: timeStr });
            }
        }
        return options;
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <ThemedView style={[styles.modalContent, { backgroundColor: theme.card }]}>
                    <View style={styles.modalHeader}>
                        <ThemedText type="title">{i18n.t('planner.officeHours')}</ThemedText>
                        <TouchableOpacity onPress={onClose}>
                            <IconSymbol name="xmark" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {/* Start Time */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>{i18n.t('planner.startTime')}</ThemedText>
                            <TouchableOpacity
                                style={[styles.timeButton, { borderColor: theme.neutral, backgroundColor: theme.background }]}
                                onPress={() => setShowStartTimePicker(true)}
                            >
                                <ThemedText>{startTime}</ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* End Time */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>{i18n.t('planner.endTime')}</ThemedText>
                            <TouchableOpacity
                                style={[styles.timeButton, { borderColor: theme.neutral, backgroundColor: theme.background }]}
                                onPress={() => setShowEndTimePicker(true)}
                            >
                                <ThemedText>{endTime}</ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Work Days */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>{i18n.t('planner.workDays')}</ThemedText>
                            <View style={styles.daysContainer}>
                                {DAY_NAMES.map((day, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.dayButton,
                                            { borderColor: theme.neutral },
                                            workDays.includes(index) && { backgroundColor: theme.primary, borderColor: theme.primary }
                                        ]}
                                        onPress={() => toggleWorkDay(index)}
                                    >
                                        <ThemedText style={[
                                            styles.dayText,
                                            workDays.includes(index) && { color: '#FFF' }
                                        ]}>
                                            {day}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { borderColor: theme.neutral }]}
                            onPress={onClose}
                        >
                            <ThemedText>{i18n.t('common.cancel')}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <ThemedText style={{ color: '#FFF' }}>
                                {loading ? i18n.t('common.saving') : i18n.t('common.save')}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    <SelectModal
                        visible={showStartTimePicker}
                        onClose={() => setShowStartTimePicker(false)}
                        onSelect={(value) => {
                            setStartTime(value);
                            setShowStartTimePicker(false);
                        }}
                        options={generateTimeOptions()}
                        selectedValue={startTime}
                        title={i18n.t('planner.startTime')}
                    />

                    <SelectModal
                        visible={showEndTimePicker}
                        onClose={() => setShowEndTimePicker(false)}
                        onSelect={(value) => {
                            setEndTime(value);
                            setShowEndTimePicker(false);
                        }}
                        options={generateTimeOptions()}
                        selectedValue={endTime}
                        title={i18n.t('planner.endTime')}
                    />
                </ThemedView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxWidth: 500,
        maxHeight: '80%',
        borderRadius: 16,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 16,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    timeButton: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayButton: {
        width: 50,
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    saveButton: {
        // Background set dynamically
    },
});
