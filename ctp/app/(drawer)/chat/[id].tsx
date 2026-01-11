import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, FlatList, TextInput, TouchableOpacity, View, Image as RNImage, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getChatMessages, sendChatMessage, uploadChatFile, ChatMessage, API_BASE_URL, getMe } from '@/constants/api'; // API_BASE_URL needed for images
import i18n from '@/i18n';

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams();
    const groupId = parseInt(id as string);

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        getMe().then(user => setCurrentUserId(user.id)).catch(console.error);

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [groupId]);

    const fetchMessages = async () => {
        try {
            const data = await getChatMessages(groupId);
            // Reverse if needed, assuming API returns chronological, List usually inverted or needs scroll to bottom.
            // Let's assume standard list for now and scroll to end.
            setMessages(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSend = async () => {
        if (!text.trim()) return;

        const content = text;
        setText(''); // Optimistic clear

        try {
            await sendChatMessage(groupId, content);
            fetchMessages();
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message);
            setText(content); // Restore on failure
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                await uploadFile(result.assets[0]);
            }
        } catch (error) {
            Alert.alert(i18n.t('common.error'), 'Failed to pick image');
        }
    };

    const uploadFile = async (asset: ImagePicker.ImagePickerAsset) => {
        setUploading(true);
        try {
            // 1. Send placeholder message (or empty text message) to get ID? 
            // The prompt says: "Send Text First: Call the Send Text endpoint... Get ID... Upload Files"
            // But what if the user Just wants to send an image? 
            // We'll send a message with content "Sent an image" or an empty string if allowed.
            // Assuming empty string or desc is allowed.

            const msgResponse = await sendChatMessage(groupId, "Shared an image");

            // 2. Upload file to that message
            const fileName = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg';

            // Prepare file object for Web compatibility if needed, though uploadChatFile handles it.
            // For Web, asset.uri is often a blob url. api.ts expects the asset or a constructed file-like object.
            // Let's pass the asset and let api.ts handle reading it.
            // Wait, api.ts `uploadChatFile` for Web expects `file` argument to be appended to FormData.
            // `ImagePicker` result on web gives a uri. We might need to fetch the blob.

            let fileToUpload: any = asset;
            if (Platform.OS === 'web') {
                const res = await fetch(asset.uri);
                const blob = await res.blob();
                fileToUpload = new File([blob], fileName, { type: asset.mimeType || 'image/jpeg' });
            } else {
                // Native: pass the asset object with uri
                fileToUpload = {
                    uri: asset.uri,
                    name: fileName,
                    type: asset.mimeType || 'image/jpeg'
                };
            }

            await uploadChatFile(msgResponse.id, fileToUpload);
            fetchMessages();

        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), error.message);
        } finally {
            setUploading(false);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isMe = item.sender_id === currentUserId;

        return (
            <View style={[
                styles.messageRow,
                isMe ? styles.myMessageRow : styles.otherMessageRow
            ]}>
                {!isMe && (
                    <View style={[styles.avatar, { backgroundColor: theme.neutral + '40' }]}>
                        <ThemedText style={{ fontSize: 10 }}>{item.sender_name.substring(0, 2).toUpperCase()}</ThemedText>
                    </View>
                )}

                <View style={[
                    styles.bubble,
                    isMe ? { backgroundColor: theme.primary } : { backgroundColor: theme.neutral + '20' }
                ]}>
                    <ThemedText style={{ color: isMe ? '#FFFFFF' : theme.text }}>
                        {item.content}
                    </ThemedText>

                    {item.files && item.files.map(file => (
                        <Image
                            key={file.id}
                            source={{ uri: `${API_BASE_URL}${file.url}` }} // Ensure URL is absolute if backend returns relative
                            style={styles.image}
                            contentFit="cover"
                        />
                    ))}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={[styles.inputContainer, { borderTopColor: theme.neutral + '20', backgroundColor: theme.background }]}>
                <TouchableOpacity onPress={handlePickImage} disabled={uploading} style={styles.attachButton}>
                    <IconSymbol name="paperclip" size={24} color={theme.icon} />
                </TouchableOpacity>

                <TextInput
                    style={[styles.input, { backgroundColor: theme.neutral + '10', color: theme.text }]}
                    value={text}
                    onChangeText={setText}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.icon}
                    multiline
                />

                <TouchableOpacity onPress={handleSend} disabled={!text.trim() || uploading} style={styles.sendButton}>
                    <IconSymbol name="paperplane.fill" size={24} color={text.trim() ? theme.primary : theme.icon} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        padding: 16,
        paddingBottom: 32,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        maxWidth: '80%',
    },
    myMessageRow: {
        alignSelf: 'flex-end',
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        alignSelf: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        alignSelf: 'flex-end', // Align with bottom of message
        marginBottom: 2,
    },
    bubble: {
        padding: 12,
        borderRadius: 16,
        minWidth: 60,
    },
    image: {
        width: 200,
        height: 150,
        borderRadius: 8,
        marginTop: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        borderTopWidth: 1,
    },
    attachButton: {
        padding: 8,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
        maxHeight: 100,
    },
    sendButton: {
        padding: 8,
    },
});
