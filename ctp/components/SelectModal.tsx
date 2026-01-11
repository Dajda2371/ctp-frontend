import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SelectOption {
    label: string;
    value: string;
}

interface SelectModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (value: string) => void;
    options: SelectOption[];
    selectedValue?: string;
    title: string;
}

export function SelectModal({
    visible,
    onClose,
    onSelect,
    options,
    selectedValue,
    title,
}: SelectModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const handleSelect = (value: string) => {
        onSelect(value);
        onClose();
    };

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
                        <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <IconSymbol name="xmark" size={22} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                        {options.map((option, index) => {
                            const isSelected = option.value === selectedValue;
                            const isLast = index === options.length - 1;

                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionItem,
                                        !isLast && { borderBottomColor: theme.neutral + '20', borderBottomWidth: 1 },
                                        isSelected && { backgroundColor: theme.primary + '15' }
                                    ]}
                                    onPress={() => handleSelect(option.value)}
                                >
                                    <ThemedText style={[
                                        styles.optionText,
                                        isSelected && { color: theme.primary, fontWeight: '600' }
                                    ]}>
                                        {option.label}
                                    </ThemedText>
                                    {isSelected && (
                                        <IconSymbol name="checkmark" size={20} color={theme.primary} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </ThemedView>
            </View>
        </Modal>
    );
}

const { height } = Dimensions.get('window');

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
        maxWidth: 400,
        maxHeight: height * 0.6,
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
    title: {
        fontSize: 18,
    },
    closeButton: {
        padding: 4,
    },
    optionsList: {
        maxHeight: height * 0.5,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    optionText: {
        fontSize: 16,
    },
});
