import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { IconSymbol } from './ui/icon-symbol';
import { Colors, BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PlannerEvent, createPlannerEvent, deletePlannerEvent, getTasks } from '@/constants/api';
import { SelectModal } from './SelectModal';
import { DatePickerModal } from './DatePickerModal';
import i18n from '@/i18n';

interface PlannerEventModalProps {
    visible: boolean;
    event?: PlannerEvent | null;
    initialDate?: Date;
    initialStartTime?: string;
    onClose: () => void;
    onSave?: () => void;
}

export function PlannerEventModal({ visible, event, initialDate, initialStartTime, onClose, onSave }: PlannerEventModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [eventType, setEventType] = useState<'work' | 'time_off' | 'task'>('work');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(initialDate || new Date());
    const [startTime, setStartTime] = useState(initialStartTime || '09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [taskId, setTaskId] = useState<number | undefined>();
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);

    const [showEventTypePicker, setShowEventTypePicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [showTaskPicker, setShowTaskPicker] = useState(false);

    useEffect(() => {
        if (visible) {
            if (event) {
                // Edit mode
                setEventType(event.event_type);
                setTitle(event.title || '');
                setDescription(event.description || '');
                const start = new Date(event.start_datetime);
                setStartDate(start);
                setStartTime(`${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`);
                const end = new Date(event.end_datetime);
                setEndTime(`${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`);
                setTaskId(event.task_id || undefined);
            } else {
                // Create mode
                reset();
            }
            loadTasks();
        }
    }, [visible, event]);

    const reset = () => {
        setEventType('work');
        setTitle('');
        setDescription('');
        setStartDate(initialDate || new Date());
        setStartTime(initialStartTime || '09:00');
        setEndTime('17:00');
        setTaskId(undefined);
    };

    const loadTasks = async () => {
        try {
            const data = await getTasks();
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    };

    const handleSave = async () => {
        if (!title.trim() && eventType !== 'task') {
            Alert.alert(i18n.t('common.error'), 'Please enter a title');
            return;
        }

        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startDateTime = new Date(startDate);
        startDateTime.setHours(startHour, startMin, 0, 0);

        const endDateTime = new Date(startDate);
        endDateTime.setHours(endHour, endMin, 0, 0);

        if (endDateTime <= startDateTime) {
            Alert.alert(i18n.t('common.error'), 'End time must be after start time');
            return;
        }

        setLoading(true);
        try {
            await createPlannerEvent({
                start_datetime: startDateTime.toISOString(),
                end_datetime: endDateTime.toISOString(),
                event_type: eventType,
                title: title.trim() || undefined,
                description: description.trim() || undefined,
                task_id: eventType === 'task' ? taskId : undefined,
            });
            if (onSave) onSave();
            onClose();
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!event) return;

        Alert.alert(
            i18n.t('common.confirm'),
            i18n.t('planner.deleteEventConfirm'),
            [
                { text: i18n.t('common.cancel'), style: 'cancel' },
                {
                    text: i18n.t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await deletePlannerEvent(event.id);
                            if (onSave) onSave();
                            onClose();
                        } catch (error: any) {
                            Alert.alert(i18n.t('common.error'), error.message);
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const generateTimeOptions = () => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 15) {
                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                options.push({ label: timeStr, value: timeStr });
            }
        }
        return options;
    };

    const getEventTypeColor = () => {
        switch (eventType) {
            case 'work': return BrandColors.ctpBlue;
            case 'time_off': return BrandColors.ctpRed;
            case 'task': return '#73A580';
            default: return theme.primary;
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <ThemedView style={[styles.modalContent, { backgroundColor: theme.card }]}>
                    <View style={styles.modalHeader}>
                        <ThemedText type="title">{event ? i18n.t('planner.editEvent') : i18n.t('planner.createEvent')}</ThemedText>
                        <TouchableOpacity onPress={onClose}>
                            <IconSymbol name="xmark" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {/* Event Type */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>{i18n.t('planner.eventType')}</ThemedText>
                            <TouchableOpacity
                                style={[styles.picker, { borderColor: getEventTypeColor(), backgroundColor: theme.background }]}
                                onPress={() => setShowEventTypePicker(true)}
                                disabled={!!event}
                            >
                                <ThemedText style={{ color: getEventTypeColor(), fontWeight: 'bold' }}>
                                    {i18n.t(`planner.${eventType}`)}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Title */}
                        {eventType !== 'task' && (
                            <View style={styles.section}>
                                <ThemedText style={styles.label}>{i18n.t('planner.eventTitle')}</ThemedText>
                                <TextInput
                                    style={[styles.input, { borderColor: theme.neutral, color: theme.text, backgroundColor: theme.background }]}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder={i18n.t('planner.titlePlaceholder')}
                                    placeholderTextColor={theme.icon + '80'}
                                />
                            </View>
                        )}

                        {/* Task Selector */}
                        {eventType === 'task' && (
                            <View style={styles.section}>
                                <ThemedText style={styles.label}>{i18n.t('planner.selectTask')}</ThemedText>
                                <TouchableOpacity
                                    style={[styles.picker, { borderColor: theme.neutral, backgroundColor: theme.background }]}
                                    onPress={() => setShowTaskPicker(true)}
                                >
                                    <ThemedText>
                                        {taskId ? (tasks.find(t => t.id === taskId)?.title || 'Select Task') : 'Select Task'}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Date */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>{i18n.t('planner.date')}</ThemedText>
                            <TouchableOpacity
                                style={[styles.picker, { borderColor: theme.neutral, backgroundColor: theme.background }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <ThemedText>{startDate.toLocaleDateString()}</ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Start Time */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>{i18n.t('planner.startTime')}</ThemedText>
                            <TouchableOpacity
                                style={[styles.picker, { borderColor: theme.neutral, backgroundColor: theme.background }]}
                                onPress={() => setShowStartTimePicker(true)}
                            >
                                <ThemedText>{startTime}</ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* End Time */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>{i18n.t('planner.endTime')}</ThemedText>
                            <TouchableOpacity
                                style={[styles.picker, { borderColor: theme.neutral, backgroundColor: theme.background }]}
                                onPress={() => setShowEndTimePicker(true)}
                            >
                                <ThemedText>{endTime}</ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Description */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>{i18n.t('planner.description')} ({i18n.t('common.optional')})</ThemedText>
                            <TextInput
                                style={[styles.textarea, { borderColor: theme.neutral, color: theme.text, backgroundColor: theme.background }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder={i18n.t('planner.descriptionPlaceholder')}
                                placeholderTextColor={theme.icon + '80'}
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actions}>
                        {event && (
                            <TouchableOpacity
                                style={[styles.deleteButton, { backgroundColor: theme.danger }]}
                                onPress={handleDelete}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <IconSymbol name="trash" size={20} color="#FFF" />
                                )}
                            </TouchableOpacity>
                        )}
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
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <ThemedText style={{ color: '#FFF' }}>{i18n.t('common.save')}</ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Modals */}
                    <SelectModal
                        visible={showEventTypePicker}
                        onClose={() => setShowEventTypePicker(false)}
                        onSelect={(value) => {
                            setEventType(value as 'work' | 'time_off' | 'task');
                            setShowEventTypePicker(false);
                        }}
                        options={[
                            { label: i18n.t('planner.work'), value: 'work' },
                            { label: i18n.t('planner.timeOff'), value: 'time_off' },
                            { label: i18n.t('planner.task'), value: 'task' },
                        ]}
                        selectedValue={eventType}
                        title={i18n.t('planner.eventType')}
                    />

                    <DatePickerModal
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        onSelect={(date) => {
                            setStartDate(new Date(date));
                            setShowDatePicker(false);
                        }}
                        selectedDate={startDate.toISOString().split('T')[0]}
                    />

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

                    <SelectModal
                        visible={showTaskPicker}
                        onClose={() => setShowTaskPicker(false)}
                        onSelect={(value) => {
                            setTaskId(parseInt(value));
                            setShowTaskPicker(false);
                        }}
                        options={tasks.map(t => ({ label: t.title, value: t.id.toString() }))}
                        selectedValue={taskId?.toString()}
                        title={i18n.t('planner.selectTask')}
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
        maxHeight: '85%',
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
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    textarea: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    picker: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        justifyContent: 'center',
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
    deleteButton: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
