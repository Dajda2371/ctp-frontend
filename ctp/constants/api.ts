export const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKED_URL || '';

export async function login(email: string, password: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Login API error:', error);
        throw error;
    }
}

export async function register(email: string, password: string, full_name: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, full_name }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Register API error:', error);
        throw error;
    }
}

// Store and retrieve token
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const TOKEN_KEY = 'auth_token';

export async function saveToken(token: string) {
    if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
}

export async function getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
    } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    }
}

export async function deleteToken() {
    if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
    } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
}

// Fetch user's own details
export async function getMe() {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch user details');
        }

        return await response.json();
    } catch (error) {
        console.error('fetchMe API error:', error);
        throw error;
    }
}

// Site CRUD operations
export async function getSites() {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch sites');
        }

        return await response.json();
    } catch (error) {
        console.error('getSites API error:', error);
        throw error;
    }
}

export async function getSite(id: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch site');
        }

        return await response.json();
    } catch (error) {
        console.error('getSite API error:', error);
        throw error;
    }
}

export async function createSite(name: string, location?: string) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, location }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create site');
        }

        return await response.json();
    } catch (error) {
        console.error('createSite API error:', error);
        throw error;
    }
}

export async function updateSite(id: number, name: string, location?: string) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, location }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update site');
        }

        return await response.json();
    } catch (error) {
        console.error('updateSite API error:', error);
        throw error;
    }
}

export async function deleteSite(id: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete site');
        }

        return await response.json();
    } catch (error) {
        console.error('deleteSite API error:', error);
        throw error;
    }
}

// Task CRUD operations
export async function getTasks() {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch tasks');
        }

        return await response.json();
    } catch (error) {
        console.error('getTasks API error:', error);
        throw error;
    }
}

export async function getTasksBySiteId(siteId: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/tasks`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch tasks');
        }

        return await response.json();
    } catch (error) {
        console.error('getTasksBySiteId API error:', error);
        throw error;
    }
}

export async function getMyTasks() {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/my`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch my tasks');
        }

        return await response.json();
    } catch (error) {
        console.error('getMyTasks API error:', error);
        throw error;
    }
}

export async function createTask(task: {
    site_id: number;
    title: string;
    description?: string;
    priority?: string | number;
    status?: string;
    due_date?: string | null;
    assigned_user_id?: number;
}) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${task.site_id}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create task');
        }

        return await response.json();
    } catch (error) {
        console.error('createTask API error:', error);
        throw error;
    }
}

export async function updateTask(
    taskId: number,
    updates: {
        title?: string;
        description?: string;
        priority?: string | number;
        status?: string;
        due_date?: string | null;
        assigned_user_id?: number;
    }
) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update task');
        }

        return await response.json();
    } catch (error) {
        console.error('updateTask API error:', error);
        throw error;
    }
}

export async function updateTaskStatus(taskId: number, status: string) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update task status');
        }

        return await response.json();
    } catch (error) {
        console.error('updateTaskStatus API error:', error);
        throw error;
    }
}

export async function updateTaskPriority(taskId: number, priority: string | number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/priority`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ priority }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update task priority');
        }

        return await response.json();
    } catch (error) {
        console.error('updateTaskPriority API error:', error);
        throw error;
    }
}

export async function deleteTask(taskId: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete task');
        }

        return await response.json();
    } catch (error) {
        console.error('deleteTask API error:', error);
        throw error;
    }
}

// User management (admin/supervisor only)
export async function getUsers() {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch users');
        }

        return await response.json();
    } catch (error) {
        console.error('getUsers API error:', error);
        throw error;
    }
}

export async function getPossibleFacilityManagers() {
    const users = await getUsers();
    // Filter for Facility Managers or Admins if needed, but usually just FM
    return users.filter((u: any) => u.role === 'facility_manager');
}

export async function getPossiblePropertyManagers() {
    const users = await getUsers();
    return users.filter((u: any) => u.role === 'property_manager');
}

export async function updateUserRole(userId: number, role: string) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update user role');
        }

        return await response.json();
    } catch (error) {
        console.error('updateUserRole API error:', error);
        throw error;
    }
}

export async function deleteUser(userId: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete user');
        }

        return await response.json();
    } catch (error) {
        console.error('deleteUser API error:', error);
        throw error;
    }
}

// Photo operations
export async function getTaskPhotos(taskId: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/photos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch task photos');
        }

        return await response.json(); // Returns { photos: TaskPhoto[] }
    } catch (error) {
        console.error('getTaskPhotos API error:', error);
        throw error;
    }
}

export async function uploadTaskPhoto(taskId: number, file: { uri: string; type: string; name: string }) {
    const token = await getToken();

    if (Platform.OS === 'web') {
        // Web implementation: Keep using FormData as it works perfectly
        console.log('[Web Upload] Fetching URI:', file.uri);
        const response = await fetch(file.uri);
        const blob = await response.blob();
        console.log('[Web Upload] Blob created:', { size: blob.size, type: blob.type });

        const fileName = file.name || 'photo.jpg';
        const fileType = file.type || blob.type || 'image/jpeg';
        const fileObject = new File([blob], fileName, { type: fileType });

        console.log('[Web Upload] File object created:', { name: fileObject.name, size: fileObject.size, type: fileObject.type });

        const formData = new FormData();
        formData.append('file', fileObject);

        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/photos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                data = null;
            }

            if (!response.ok) {
                const errorMessage = data?.message || responseText || `Upload failed with status ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error('uploadTaskPhoto API error:', error);
            throw error;
        }
    } else {
        // Native Component: Send Base64 JSON (New Backend Feature)
        // This is much more reliable than multipart/form-data on React Native
        console.log('[Native Upload] Reading file for JSON upload:', JSON.stringify(file));


        try {
            // Read file as base64
            const base64 = await FileSystem.readAsStringAsync(file.uri, {
                encoding: 'base64',
            });

            console.log('[Native Upload] File read, base64 length:', base64.length);

            // Send as JSON
            const payload = {
                filename: file.name || 'photo.jpg',
                content: base64,
                mime_type: file.type || 'image/jpeg'
            };

            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/photos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseText = await response.text();
            console.log('[Native Upload] Response status:', response.status);
            console.log('[Native Upload] Response:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                data = null;
            }

            if (!response.ok) {
                const errorMessage = data?.message || responseText || `Upload failed with status ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error('[Native Upload] Error:', error);
            throw error;
        }
    }
}

export async function deleteTaskPhoto(taskId: number, photoId: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/photos/${photoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete photo');
        }

        return await response.json();
    } catch (error) {
        console.error('deleteTaskPhoto API error:', error);
        throw error;
    }
}

export async function deleteAllTaskPhotos(taskId: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/photos`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete all photos');
        }

        return await response.json();
    } catch (error) {
        console.error('deleteAllTaskPhotos API error:', error);
        throw error;
    }
}
