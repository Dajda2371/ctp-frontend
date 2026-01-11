
export const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKED_URL || '';

function parseError(errorData: any, fallback: string): string {
    const msg = errorData.message || errorData.detail;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
    if (typeof msg === 'object') return JSON.stringify(msg);
    return fallback;
}

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
            throw new Error(parseError(errorData, 'Login failed'));
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
            throw new Error(parseError(errorData, 'Registration failed'));
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
            throw new Error(parseError(errorData, 'Failed to fetch user details'));
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
            throw new Error(parseError(errorData, 'Failed to fetch sites'));
        }

        return await response.json();
    } catch (error) {
        console.error('getSites API error:', error);
        throw error;
    }
}

export async function getSite(id: number | string) {
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
            throw new Error(parseError(errorData, 'Failed to fetch site'));
        }

        return await response.json();
    } catch (error) {
        console.error('getSite API error:', error);
        throw error;
    }
}

export async function createSite(siteData: any) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(siteData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(parseError(errorData, 'Failed to create site'));
        }

        return await response.json();
    } catch (error) {
        console.error('createSite API error:', error);
        throw error;
    }
}

export async function updateSite(id: number | string, siteData: any) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(siteData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(parseError(errorData, 'Failed to update site'));
        }

        return await response.json();
    } catch (error) {
        console.error('updateSite API error:', error);
        throw error;
    }
}

export async function deleteSite(id: number | string) {
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
            throw new Error(parseError(errorData, 'Failed to delete site'));
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
            throw new Error(parseError(errorData, 'Failed to fetch tasks'));
        }

        return await response.json();
    } catch (error) {
        console.error('getTasks API error:', error);
        throw error;
    }
}

export async function getTasksBySiteId(siteId: number | string) {
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
            throw new Error(parseError(errorData, 'Failed to fetch tasks'));
        }

        return await response.json();
    } catch (error) {
        console.error('getTasksBySiteId API error:', error);
        throw error;
    }
}

export async function getMyTasks() {
    try {
        // WORKAROUND: GET /tasks/my seems to be broken (shadowed by GET /tasks/{id}).
        // We fetch all tasks and filter by the current logged-in user.
        const [tasks, user] = await Promise.all([getTasks(), getMe()]);

        // Filter tasks where the assignee matches the user's name or ID
        // The backend might return assignee as a name (string) or ID.
        return tasks.filter((task: any) => {
            if (!task.assignee) return false;
            return task.assignee === user.name || task.assigned_user_id === user.id;
        });
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
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(parseError(errorData, 'Failed to create task'));
        }

        return await response.json();
    } catch (error) {
        console.error('createTask API error:', error);
        throw error;
    }
}

export async function updateTask(
    taskId: number | string,
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
            throw new Error(parseError(errorData, 'Failed to update task'));
        }

        return await response.json();
    } catch (error) {
        console.error('updateTask API error:', error);
        throw error;
    }
}

export async function updateTaskStatus(taskId: number | string, status: string) {
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
            throw new Error(parseError(errorData, 'Failed to update task status'));
        }

        return await response.json();
    } catch (error) {
        console.error('updateTaskStatus API error:', error);
        throw error;
    }
}

export async function updateTaskPriority(taskId: number | string, priority: string | number) {
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
            throw new Error(parseError(errorData, 'Failed to update task priority'));
        }

        return await response.json();
    } catch (error) {
        console.error('updateTaskPriority API error:', error);
        throw error;
    }
}

export async function deleteTask(taskId: number | string) {
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
            throw new Error(parseError(errorData, 'Failed to delete task'));
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
            throw new Error(parseError(errorData, 'Failed to fetch users'));
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

export async function updateUserRole(userId: number | string, role: string) {
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
            throw new Error(parseError(errorData, 'Failed to update user role'));
        }

        return await response.json();
    } catch (error) {
        console.error('updateUserRole API error:', error);
        throw error;
    }
}

export async function deleteUser(userId: number | string) {
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
            throw new Error(parseError(errorData, 'Failed to delete user'));
        }

        return await response.json();
    } catch (error) {
        console.error('deleteUser API error:', error);
        throw error;
    }
}

// Add missing createUser and updateUser functions
export async function createUser(user: { email: string; password?: string; name: string; role: string }) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(parseError(errorData, 'Failed to create user'));
        }

        return await response.json();
    } catch (error) {
        console.error('createUser API error:', error);
        throw error;
    }
}

export async function updateUser(id: string | number, user: { name?: string; email?: string; role?: string }) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(parseError(errorData, 'Failed to update user'));
        }

        return await response.json();
    } catch (error) {
        console.error('updateUser API error:', error);
        throw error;
    }
}

// Photo operations
export async function getTaskPhotos(taskId: number | string) {
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
            throw new Error(parseError(errorData, 'Failed to fetch task photos'));
        }

        return await response.json(); // Returns { photos: TaskPhoto[] }
    } catch (error) {
        console.error('getTaskPhotos API error:', error);
        throw error;
    }
}

export async function uploadTaskPhoto(taskId: number | string, file: { uri: string; type: string; name: string }) {
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

export async function deleteTaskPhoto(taskId: number | string, photoId: number | string) {
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
            throw new Error(parseError(errorData, 'Failed to delete photo'));
        }

        return await response.json();
    } catch (error) {
        console.error('deleteTaskPhoto API error:', error);
        throw error;
    }
}

export async function deleteAllTaskPhotos(taskId: number | string) {
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
            throw new Error(parseError(errorData, 'Failed to delete all photos'));
        }

        return await response.json();
    } catch (error) {
        console.error('deleteAllTaskPhotos API error:', error);
        throw error;
    }
}
