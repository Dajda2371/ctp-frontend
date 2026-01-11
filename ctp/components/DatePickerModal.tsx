
import React, { useState, useEffect } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DatePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: string) => void;
    selectedDate?: string;
    title?: string;
}

export function DatePickerModal({
    visible,
    onClose,
    onSelect,
    selectedDate,
    title = 'Select Date',
}: DatePickerModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    // Parse the date or use today
    const parseDate = (dateStr?: string) => {
        if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [y, m, d] = dateStr.split('-').map(Number);
            return { year: y, month: m, day: d };
        }
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    };

    const [date, setDate] = useState(parseDate(selectedDate));

    useEffect(() => {
        if (visible) {
            setDate(parseDate(selectedDate));
        }
    }, [visible, selectedDate]);

    const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

    const handleConfirm = () => {
        const formatted = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
        onSelect(formatted);
        onClose();
    };

    const adjustMonth = (delta: number) => {
        let newMonth = date.month + delta;
        let newYear = date.year;
        if (newMonth > 12) { newMonth = 1; newYear++; }
        if (newMonth < 1) { newMonth = 12; newYear--; }
        const maxDay = daysInMonth(newYear, newMonth);
        setDate({ year: newYear, month: newMonth, day: Math.min(date.day, maxDay) });
    };

    const adjustYear = (delta: number) => {
        const newYear = date.year + delta;
        const maxDay = daysInMonth(newYear, date.month);
        setDate({ ...date, year: newYear, day: Math.min(date.day, maxDay) });
    };

    const renderDays = () => {
        const days = [];
        const maxDay = daysInMonth(date.year, date.month);
        const firstDayOfWeek = new Date(date.year, date.month - 1, 1).getDay();

        // Empty slots for days before the 1st
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(<View key={`empty - ${i} `} style={styles.dayCell} />);
        }

        for (let d = 1; d <= maxDay; d++) {
            const isSelected = d === date.day;
            days.push(
                <TouchableOpacity
                    key={d}
                    style={[
                        styles.dayCell,
                        isSelected && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => setDate({ ...date, day: d })}
                >
                    <ThemedText style={[
                        styles.dayText,
                        isSelected && { color: '#fff', fontWeight: '700' }
                    ]}>
                        {d}
                    </ThemedText>
                </TouchableOpacity>
            );
        }

        return days;
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <ThemedView style={[
                    styles.container,
                    { backgroundColor: theme.background },
                    Platform.select({
                        ios: {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                        },
                        android: {},
                        web: {
                            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
                        },
                    })
                ]}>
                    <View style={[styles.header, { borderBottomColor: theme.neutral + '30' }]}>
                        <ThemedText type="subtitle">{title}</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <IconSymbol name="xmark" size={22} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    {/* Month/Year Selector */}
                    <View style={styles.monthYearRow}>
                        <View style={styles.selector}>
                            <TouchableOpacity onPress={() => adjustYear(-1)} style={styles.arrowBtn}>
                                <IconSymbol name="chevron.left" size={16} color={theme.icon} />
                            </TouchableOpacity>
                            <ThemedText style={styles.selectorText}>{date.year}</ThemedText>
                            <TouchableOpacity onPress={() => adjustYear(1)} style={styles.arrowBtn}>
                                <IconSymbol name="chevron.right" size={16} color={theme.icon} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.selector}>
                            <TouchableOpacity onPress={() => adjustMonth(-1)} style={styles.arrowBtn}>
                                <IconSymbol name="chevron.left" size={16} color={theme.icon} />
                            </TouchableOpacity>
                            <ThemedText style={styles.selectorText}>{monthNames[date.month - 1]}</ThemedText>
                            <TouchableOpacity onPress={() => adjustMonth(1)} style={styles.arrowBtn}>
                                <IconSymbol name="chevron.right" size={16} color={theme.icon} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Day Headers */}
                    <View style={styles.dayHeaderRow}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <View key={day} style={styles.dayHeaderCell}>
                                <ThemedText style={[styles.dayHeaderText, { color: theme.icon }]}>{day}</ThemedText>
                            </View>
                        ))}
                    </View>

                    {/* Days Grid */}
                    <View style={styles.daysGrid}>
                        {renderDays()}
                    </View>

                    {/* Confirm Button */}
                    <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                        onPress={handleConfirm}
                    >
                        <ThemedText style={styles.confirmText}>Confirm</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: 4,
    },
    monthYearRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectorText: {
        fontSize: 16,
        fontWeight: '600',
        minWidth: 50,
        textAlign: 'center',
    },
    arrowBtn: {
        padding: 8,
    },
    dayHeaderRow: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
    dayHeaderCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    dayHeaderText: {
        fontSize: 12,
        fontWeight: '600',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    dayCell: {
        width: '14.28%',  // 7 columns
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    dayText: {
        fontSize: 14,
    },
    confirmButton: {
        margin: 16,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    confirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
