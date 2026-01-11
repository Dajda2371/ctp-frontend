import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, DateData } from 'react-native-calendars';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PlannerEvent, PlannerSettings, getPlannerEvents, getPlannerSettings } from '@/constants/api';
import { PlannerSettingsModal } from '@/components/PlannerSettingsModal';
import { PlannerEventModal } from '@/components/PlannerEventModal';
import i18n from '@/i18n';

export default function PlannerScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [events, setEvents] = useState<PlannerEvent[]>([]);
    const [settings, setSettings] = useState<PlannerSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [eventModalVisible, setEventModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadSettings();
            loadEvents();
        }, [selectedDate])
    );

    const loadSettings = async () => {
        try {
            const data = await getPlannerSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const loadEvents = async () => {
        setLoading(true);
        try {
            // Load events for the entire month
            const date = new Date(selectedDate);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const start = startOfMonth.toISOString().split('T')[0];
            const end = endOfMonth.toISOString().split('T')[0];

            const data = await getPlannerEvents(start, end);
            setEvents(data);
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const getEventTypeColor = (eventType: string) => {
        switch (eventType) {
            case 'work': return BrandColors.ctpBlue;
            case 'time_off': return BrandColors.ctpRed;
            case 'task': return '#73A580';
            default: return theme.primary;
        }
    };

    const getMarkedDates = () => {
        const marked: Record<string, any> = {};

        events.forEach(event => {
            const date = event.start_datetime.split('T')[0];
            if (!marked[date]) {
                marked[date] = { dots: [] };
            }
            marked[date].dots.push({
                color: getEventTypeColor(event.event_type),
            });
        });

        // Highlight selected date
        if (marked[selectedDate]) {
            marked[selectedDate].selected = true;
            marked[selectedDate].selectedColor = theme.tint + '40';
        } else {
            marked[selectedDate] = {
                selected: true,
                selectedColor: theme.tint + '40',
            };
        }

        return marked;
    };

    const getDayEvents = () => {
        return events.filter(event => {
            const eventDate = event.start_datetime.split('T')[0];
            return eventDate === selectedDate;
        }).sort((a, b) => {
            return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
        });
    };

    const handleDayPress = (day: DateData) => {
        setSelectedDate(day.dateString);
    };

    const handleEventPress = (event: PlannerEvent) => {
        setSelectedEvent(event);
        setEventModalVisible(true);
    };

    const handleCreateEvent = () => {
        setSelectedEvent(null);
        setEventModalVisible(true);
    };

    const formatTime = (datetime: string) => {
        const date = new Date(datetime);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const dayEvents = getDayEvents();

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.neutral + '20' }]}>
                <ThemedText type="title">{i18n.t('planner.title')}</ThemedText>
                <TouchableOpacity
                    style={[styles.settingsButton, { backgroundColor: theme.primary }]}
                    onPress={() => setSettingsModalVisible(true)}
                >
                    <IconSymbol name="calendar" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Calendar */}
            <Calendar
                current={selectedDate}
                onDayPress={handleDayPress}
                markedDates={getMarkedDates()}
                markingType="multi-dot"
                theme={{
                    backgroundColor: theme.background,
                    calendarBackground: theme.card,
                    textSectionTitleColor: theme.text,
                    selectedDayBackgroundColor: theme.tint,
                    selectedDayTextColor: '#FFF',
                    todayTextColor: theme.primary,
                    dayTextColor: theme.text,
                    textDisabledColor: theme.icon + '40',
                    monthTextColor: theme.text,
                    textMonthFontWeight: 'bold',
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                }}
            />

            {/* Day View */}
            <View style={styles.dayViewHeader}>
                <ThemedText type="subtitle">
                    {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </ThemedText>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={handleCreateEvent}
                >
                    <IconSymbol name="plus" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Events List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <ScrollView style={styles.eventsList} contentContainerStyle={styles.eventsListContent}>
                    {dayEvents.length === 0 ? (
                        <View style={styles.emptyState}>
                            <ThemedText style={{ opacity: 0.6 }}>{i18n.t('planner.noEvents')}</ThemedText>
                        </View>
                    ) : (
                        dayEvents.map(event => (
                            <TouchableOpacity
                                key={event.id}
                                style={[
                                    styles.eventCard,
                                    {
                                        backgroundColor: theme.card,
                                        borderLeftColor: getEventTypeColor(event.event_type),
                                        borderColor: theme.neutral + '20',
                                    }
                                ]}
                                onPress={() => handleEventPress(event)}
                            >
                                <View style={styles.eventTime}>
                                    <ThemedText style={styles.eventTimeText}>
                                        {formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}
                                    </ThemedText>
                                </View>
                                <View style={styles.eventContent}>
                                    <View style={styles.eventHeader}>
                                        <ThemedText style={styles.eventTitle}>
                                            {event.title || i18n.t(`planner.${event.event_type}`)}
                                        </ThemedText>
                                        <View style={[styles.eventTypeBadge, { backgroundColor: getEventTypeColor(event.event_type) + '20' }]}>
                                            <ThemedText style={[styles.eventTypeText, { color: getEventTypeColor(event.event_type) }]}>
                                                {i18n.t(`planner.${event.event_type}`)}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    {event.description && (
                                        <ThemedText style={styles.eventDescription} numberOfLines={2}>
                                            {event.description}
                                        </ThemedText>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Modals */}
            <PlannerSettingsModal
                visible={settingsModalVisible}
                onClose={() => setSettingsModalVisible(false)}
                onSave={() => {
                    loadSettings();
                    loadEvents();
                }}
            />

            <PlannerEventModal
                visible={eventModalVisible}
                event={selectedEvent}
                initialDate={new Date(selectedDate)}
                onClose={() => {
                    setEventModalVisible(false);
                    setSelectedEvent(null);
                }}
                onSave={() => {
                    loadEvents();
                }}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayViewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventsList: {
        flex: 1,
    },
    eventsListContent: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    eventCard: {
        flexDirection: 'row',
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderLeftWidth: 4,
        overflow: 'hidden',
    },
    eventTime: {
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    eventTimeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    eventContent: {
        flex: 1,
        padding: 12,
        paddingLeft: 0,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    eventTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8,
    },
    eventTypeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    eventDescription: {
        fontSize: 14,
        opacity: 0.7,
    },
});
