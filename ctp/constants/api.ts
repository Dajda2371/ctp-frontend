export const API_BASE_URL = process.env.EXPO_PUBLIC_BACKED_URL || '';

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

export async function logout() {
    const token = await getToken();
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        // We don't check for response.ok because we want to clear client session regardless
    } catch (error) {
        console.error('Logout API error:', error);
        // Continue to clear local session
    }
}


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
            // check for 401 unauth
            if (response.status === 401) {
                // handle token expiration if needed, for now just throw
            }
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch user profile');
        }

        return await response.json();
    } catch (error) {
        console.error('getMe API error:', error);
        throw error;
    }
}

export async function register(email: string, password: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
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

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function saveToken(token: string) {
    if (Platform.OS === 'web') {
        try {
            localStorage.setItem('access_token', token);
        } catch (e) {
            console.error('Local storage is not available:', e);
        }
    } else {
        await SecureStore.setItemAsync('access_token', token);
    }
}

export async function getToken() {
    if (Platform.OS === 'web') {
        try {
            return localStorage.getItem('access_token');
        } catch (e) {
            console.error('Local storage is not available:', e);
            return null;
        }
    } else {
        return await SecureStore.getItemAsync('access_token');
    }
}

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

export async function getPossiblePropertyManagers() {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/users/possible_property_manager`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch possible property managers');
        }

        return await response.json();
    } catch (error) {
        console.error('getPossiblePropertyManagers API error:', error);
        throw error;
    }
}

export async function getPossibleFacilityManagers() {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/users/possible_facility_manager`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch possible facility managers');
        }

        return await response.json();
    } catch (error) {
        console.error('getPossibleFacilityManagers API error:', error);
        throw error;
    }
}

export async function createUser(data: { email: string; password: string; name?: string; role?: string }) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create user');
        }

        return await response.json();
    } catch (error) {
        console.error('createUser API error:', error);
        throw error;
    }
}

export async function updateUser(id: number | string, data: { name?: string; email?: string; role?: string }) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update user');
        }

        return await response.json();
    } catch (error) {
        console.error('updateUser API error:', error);
        throw error;
    }
}

export async function deleteUser(id: number | string) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
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
            throw new Error(errorData.message || 'Failed to fetch site');
        }

        return await response.json();
    } catch (error) {
        console.error('getSite API error:', error);
        throw error;
    }
}

export async function createSite(data: { name: string; address: string; latitude: number; longitude: number; facility_manager: number; property_manager: number }) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('createSite Error Response:', JSON.stringify(errorData, null, 2));
            throw new Error(errorData.detail?.[0]?.msg || errorData.message || 'Failed to create site');
        }

        return await response.json();
    } catch (error) {
        console.error('createSite API error:', error);
        throw error;
    }
}

export async function updateSite(id: number, data: { name?: string; address?: string; facility_manager?: number | null; property_manager?: number | null; latitude?: number; longitude?: number }) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
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

export async function updateSiteFacilityManager(siteId: number, managerId: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/facility_manager`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ facility_manager: managerId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('updateSiteFacilityManager Error Response:', JSON.stringify(errorData, null, 2));
            throw new Error(errorData.detail?.[0]?.msg || errorData.message || 'Failed to update facility manager');
        }

        return await response.json();
    } catch (error) {
        console.error('updateSiteFacilityManager API error:', error);
        throw error;
    }
}

export async function updateSitePropertyManager(siteId: number, managerId: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/property_manager`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ property_manager: managerId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('updateSitePropertyManager Error Response:', JSON.stringify(errorData, null, 2));
            throw new Error(errorData.detail?.[0]?.msg || errorData.message || 'Failed to update property manager');
        }

        return await response.json();
    } catch (error) {
        console.error('updateSitePropertyManager API error:', error);
        throw error;
    }
}

export async function updateSiteName(siteId: number, name: string) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/name`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });
        if (!response.ok) throw new Error('Failed to update name');
        return await response.json();
    } catch (error) {
        console.error('updateSiteName error:', error);
        throw error;
    }
}

export async function updateSiteAddress(siteId: number, address: string) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/address`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address }),
        });
        if (!response.ok) throw new Error('Failed to update address');
        return await response.json();
    } catch (error) {
        console.error('updateSiteAddress error:', error);
        throw error;
    }
}

export async function updateSiteLatitude(siteId: number, latitude: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/latitude`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ latitude }),
        });
        if (!response.ok) throw new Error('Failed to update latitude');
        return await response.json();
    } catch (error) {
        console.error('updateSiteLatitude error:', error);
        throw error;
    }
}

export async function updateSiteLongitude(siteId: number, longitude: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/longitude`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ longitude }),
        });
        if (!response.ok) throw new Error('Failed to update longitude');
        return await response.json();
    } catch (error) {
        console.error('updateSiteLongitude error:', error);
        throw error;
    }
}

export async function getSiteFacilityManager(siteId: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/facility_manager`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch facility manager');
        }

        return await response.json();
    } catch (error) {
        console.error('getSiteFacilityManager API error:', error);
        throw error;
    }
}

export async function getSitePropertyManager(siteId: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/property_manager`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch property manager');
        }

        return await response.json();
    } catch (error) {
        console.error('getSitePropertyManager API error:', error);
        throw error;
    }
}

// Tasks API
export async function getTasks(siteId?: number, status?: string) {
    const token = await getToken();
    try {
        let url = `${API_BASE_URL}/tasks`;
        const params = new URLSearchParams();
        if (siteId !== undefined) params.append('site_id', siteId.toString());
        if (status) params.append('status', status);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, {
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

export async function getMyTasks() {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/me`, {
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

export async function getTask(id: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch task');
        }

        return await response.json();
    } catch (error) {
        console.error('getTask API error:', error);
        throw error;
    }
}

export async function createTask(data: {
    site_id: number;
    title: string;
    description?: string;
    status?: string;
    priority?: number;
    assignee?: string;
    due_date?: string | null;
    photos?: string[];
    latitude?: number;
    longitude?: number;
}) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Create Task Validation Error:', JSON.stringify(errorData, null, 2));
            throw new Error(errorData.message || 'Failed to create task');
        }

        return await response.json();
    } catch (error) {
        console.error('createTask API error:', error);
        throw error;
    }
}

export async function updateTask(id: number, data: {
    site_id?: number;
    title?: string;
    description?: string;
    status?: string;
    priority?: number;
    assignee?: string;
    due_date?: string | null;
    photos?: string[];
    latitude?: number;
    longitude?: number;
}) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Update Task Validation Error:', JSON.stringify(errorData, null, 2));
            throw new Error(errorData.message || 'Failed to update task');
        }

        return await response.json();
    } catch (error) {
        console.error('updateTask API error:', error);
        throw error;
    }
}

export async function deleteTask(id: number) {
    const token = await getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
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
