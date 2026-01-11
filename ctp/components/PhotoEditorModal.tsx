import React, { useState, useRef, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, TextInput, Dimensions, KeyboardAvoidingView, Platform, Text, Alert } from 'react-native';
import { Image } from 'expo-image';
import ViewShot from 'react-native-view-shot';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';

import { API_BASE_URL, getToken } from '@/constants/api';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

interface PhotoEditorModalProps {
    visible: boolean;
    imageUri: string | null;
    onClose: () => void;
    onSave: (newUri: string) => void;
}

interface TextElement {
    id: number;
    x: number;
    y: number;
    text: string;
    color: string;
}

export function PhotoEditorModal({ visible, imageUri, onClose, onSave }: PhotoEditorModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const viewShotRef = useRef<ViewShot>(null);

    // State
    // State
    const [color, setColor] = useState('red');
    const [mode, setMode] = useState<'view' | 'text'>('view');
    const [textElements, setTextElements] = useState<TextElement[]>([]);
    const [resolvedSource, setResolvedSource] = useState<{ uri: string; headers?: Record<string, string> } | null>(null);


    // Resolve Image Source
    useEffect(() => {
        if (!imageUri) return;

        const resolve = async () => {
            const url = imageUri.startsWith('http') || imageUri.startsWith('file') ? imageUri : `${API_BASE_URL}${imageUri}`;
            if (Platform.OS === 'web') {
                // Web: Fetch blob to bypass auth/cors for img tag if needed
                try {
                    const token = await getToken();
                    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                    const blob = await response.blob();
                    setResolvedSource({ uri: URL.createObjectURL(blob) });
                } catch (e) {
                    setResolvedSource({ uri: url });
                }
            } else {
                const token = await getToken();
                setResolvedSource({
                    uri: url,
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        };
        resolve();
    }, [imageUri]);


    // Reanimated Shared Values for Zoom/Pan
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Reset transform helper
    const resetTransform = () => {
        'worklet';
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
    };

    // Gestures for View Mode
    const panGesture = Gesture.Pan()
        .enabled(mode === 'view')
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX;
            translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const pinchGesture = Gesture.Pinch()
        .enabled(mode === 'view')
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const compositedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ]
    }));

    // Handlers
    const handleSwitchMode = (newMode: 'view' | 'text') => {
        if (newMode !== 'view') {
            runOnJS(resetTransform)();
        }
        setMode(newMode);
    };

    const handleSave = async (saveToDevice: boolean = false) => {
        try {
            // Ensure we are at 1x scale before capturing
            resetTransform();

            // Allow re-render
            // Allow re-render
            setTimeout(async () => {
                try {
                    let uri = null;
                    try {
                        if (viewShotRef.current && viewShotRef.current.capture) {
                            if (Platform.OS !== 'web') {
                                uri = await viewShotRef.current.capture();
                            }
                            // On web, viewShot capture often fails with findNodeHandle. 
                            // We can try it, but be ready to fallback.
                        }
                    } catch (captureError) {
                        console.warn("ViewShot capture failed, falling back to original image", captureError);
                    }

                    if (!uri && resolvedSource) {
                        uri = resolvedSource.uri;
                    }

                    if (uri) {
                        if (saveToDevice) {
                            if (Platform.OS === 'web') {
                                const link = document.createElement('a');
                                link.href = uri;
                                link.download = `photo-${Date.now()}.jpg`;
                                link.click();
                                Alert.alert("Saved", "Photo downloaded successfully.");
                            } else {
                                // Try Saving to Media Library First
                                try {
                                    const { status } = await MediaLibrary.requestPermissionsAsync(true);
                                    if (status === MediaLibrary.PermissionStatus.GRANTED) {
                                        await MediaLibrary.createAssetAsync(uri);
                                        Alert.alert("Saved", "Photo saved to your gallery.");
                                    } else {
                                        throw new Error("Permission not granted");
                                    }
                                } catch (e) {
                                    console.error("MediaLibrary failed", e);
                                    Alert.alert("Error", "Could not save photo to gallery. Please check permissions.");
                                }
                            }
                        } else {
                            onSave(uri);
                        }
                    } else {
                        throw new Error("No URI available to save");
                    }
                } catch (error) {
                    console.error("Failed to save image", error);
                    Alert.alert("Error", "Failed to save image.");
                }
            }, 500); // Increased timeout to ensure render
        } catch (error) {
            console.error("Failed to initiate save", error);
        }
    };

    const handleAddText = () => {
        handleSwitchMode('text');
        // Add text to the center 
        setTextElements([...textElements, { id: Date.now(), x: 100, y: 300, text: 'Text', color: color }]);
    };

    const updateText = (id: number, text: string) => {
        setTextElements(prev => prev.map(t => t.id === id ? { ...t, text } : t));
    };

    const moveText = (id: number, dx: number, dy: number) => {
        // Simple text drag implementation could go here
    };

    if (!imageUri || !resolvedSource) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={[styles.container, { backgroundColor: '#000' }]}>

                    {/* Main Canvas Area */}
                    <View style={styles.canvasContainer}>
                        <GestureDetector gesture={compositedGesture}>
                            <Animated.View style={[styles.imageWrapper, animatedStyle]}>
                                <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={{ flex: 1 }}>
                                    <View style={{ flex: 1 }}>
                                        {/* Image Layer */}
                                        <Image
                                            source={resolvedSource}
                                            style={styles.image}
                                            contentFit="contain"
                                        />

                                        {/* Text Layer */}
                                        {textElements.map((el) => (
                                            <View key={el.id} style={{ position: 'absolute', top: el.y, left: el.x }}>
                                                <TextInput
                                                    value={el.text}
                                                    onChangeText={(txt) => updateText(el.id, txt)}
                                                    style={{ color: el.color, fontSize: 24, fontWeight: 'bold' }}
                                                    editable={mode === 'text'}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                </ViewShot>
                            </Animated.View>
                        </GestureDetector>
                    </View>

                    {/* Toolbar */}
                    <View style={[styles.toolbar, { backgroundColor: theme.background }]}>
                        <TouchableOpacity onPress={onClose} style={styles.toolButton}>
                            <IconSymbol name="xmark" size={24} color={theme.text} />
                            <Text style={[styles.toolText, { color: theme.text }]}>Close</Text>
                        </TouchableOpacity>

                        <View style={styles.modeGroup}>
                            <TouchableOpacity onPress={() => handleSwitchMode('view')} style={[styles.toolButton, mode === 'view' && styles.activeTool]}>
                                <IconSymbol name="magnifyingglass" size={24} color={mode === 'view' ? theme.primary : theme.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddText} style={[styles.toolButton, mode === 'text' && styles.activeTool]}>
                                <IconSymbol name="textformat" size={24} color={mode === 'text' ? theme.primary : theme.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleSave(true)} style={styles.toolButton}>
                                <IconSymbol name="square.and.arrow.down" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>


                    </View>

                    {/* Color Picker (conditionally visible) */}
                    {(mode === 'text') && (
                        <View style={styles.colorPicker}>
                            {['red', 'blue', 'green', 'white', 'black', 'yellow'].map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.colorDot, { backgroundColor: c, borderWidth: color === c ? 2 : 0, borderColor: theme.text }]}
                                    onPress={() => setColor(c)}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </GestureHandlerRootView>
        </Modal >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    canvasContainer: {
        flex: 1,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    toolButton: {
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
    },
    activeTool: {
        backgroundColor: 'rgba(128,128,128,0.2)',
    },
    toolText: {
        fontSize: 12,
        marginTop: 4,
    },
    modeGroup: {
        flexDirection: 'row',
        gap: 10,
    },
    colorPicker: {
        position: 'absolute',
        bottom: 110,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        gap: 10,
    },
    colorDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginHorizontal: 5,
    },
    textInput: {
        position: 'absolute',
        padding: 8,
        minWidth: 50,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 4,
    }
});
