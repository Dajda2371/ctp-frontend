import React, { useState, useRef } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Dimensions, Text, PanResponder, TextInput } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PhotoEditorModalProps {
    visible: boolean;
    imageUri: string | null;
    onClose: () => void;
    onSave: (newUri: string) => void;
}

export function PhotoEditorModal({ visible, imageUri, onClose, onSave }: PhotoEditorModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const viewShotRef = useRef<ViewShot>(null);

    const [paths, setPaths] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState('');
    const [color, setColor] = useState('red');
    const [strokeWidth, setStrokeWidth] = useState(5);
    const [mode, setMode] = useState<'view' | 'draw' | 'text'>('view');
    const [textInputs, setTextInputs] = useState<{ id: number, x: number, y: number, text: string }[]>([]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => mode === 'draw',
            onMoveShouldSetPanResponder: () => mode === 'draw',
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                setCurrentPath(`M ${locationX} ${locationY}`);
            },
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                setCurrentPath((prev) => `${prev} L ${locationX} ${locationY}`);
            },
            onPanResponderRelease: () => {
                setPaths((prev) => [...prev, currentPath]);
                setCurrentPath('');
            },
        })
    ).current;

    const handleSave = async () => {
        try {
            if (viewShotRef.current && viewShotRef.current.capture) {
                const uri = await viewShotRef.current.capture();
                onSave(uri);
            }
        } catch (error) {
            console.error("Failed to save image", error);
        }
    };

    const handleAddText = () => {
        setTextInputs([...textInputs, { id: Date.now(), x: 100, y: 100, text: 'Text' }]);
        setMode('text');
    };

    if (!imageUri) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                {/* Visual Content */}
                <ViewShot ref={viewShotRef} style={styles.canvas} options={{ format: "jpg", quality: 0.9 }}>
                    <View style={styles.imageContainer} {...panResponder.panHandlers}>
                        <Image source={{ uri: imageUri }} style={styles.image} contentFit="contain" />

                        <Svg style={StyleSheet.absoluteFill}>
                            {paths.map((d, index) => (
                                <Path
                                    key={index}
                                    d={d}
                                    stroke={color}
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                />
                            ))}
                            {currentPath ? (
                                <Path
                                    d={currentPath}
                                    stroke={color}
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                />
                            ) : null}
                        </Svg>

                        {textInputs.map((input) => (
                            <View key={input.id} style={{ position: 'absolute', top: input.y, left: input.x }}>
                                <TextInput
                                    value={input.text}
                                    onChangeText={(txt) => setTextInputs(prev => prev.map(i => i.id === input.id ? { ...i, text: txt } : i))}
                                    style={{ color: color, fontSize: 24, fontWeight: 'bold' }}
                                />
                            </View>
                        ))}
                    </View>
                </ViewShot>

                {/* Toolbar */}
                <View style={[styles.toolbar, { backgroundColor: theme.background }]}>
                    <TouchableOpacity onPress={onClose} style={styles.toolButton}>
                        <IconSymbol name="xmark" size={24} color={theme.text} />
                        <Text style={{ color: theme.text, fontSize: 12 }}>Close</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setMode(mode === 'draw' ? 'view' : 'draw')} style={[styles.toolButton, mode === 'draw' && styles.activeTool]}>
                        <IconSymbol name="pencil" size={24} color={mode === 'draw' ? theme.primary : theme.text} />
                        <Text style={{ color: mode === 'draw' ? theme.primary : theme.text, fontSize: 12 }}>Draw</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleAddText} style={styles.toolButton}>
                        <IconSymbol name="textformat" size={24} color={theme.text} />
                        <Text style={{ color: theme.text, fontSize: 12 }}>Text</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setPaths([])} style={styles.toolButton}>
                        <IconSymbol name="trash" size={24} color={theme.text} />
                        <Text style={{ color: theme.text, fontSize: 12 }}>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleSave} style={styles.toolButton}>
                        <IconSymbol name="checkmark" size={24} color={theme.primary} />
                        <Text style={{ color: theme.primary, fontSize: 12 }}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    canvas: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    toolbar: {
        height: 100,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 20,
    },
    toolButton: {
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    activeTool: {
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
});
