const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

interface RequestOptions extends RequestInit {
    token?: string;
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (fetchOptions.headers) {
        Object.entries(fetchOptions.headers).forEach(([key, value]) => {
            headers[key] = value as string;
        });
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Automatically bypass ngrok warning if API is on ngrok
    if (API_URL.includes('ngrok')) {
        headers['ngrok-skip-browser-warning'] = 'true';
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'API request failed');
    }

    if (response.status === 204) {
        return {} as T;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
}

export const api = {
    get: <T>(endpoint: string, token?: string) =>
        apiRequest<T>(endpoint, { method: 'GET', token }),

    post: <T, TBody = unknown>(endpoint: string, data?: TBody, token?: string) =>
        apiRequest<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            token,
        }),

    patch: <T, TBody = unknown>(endpoint: string, data?: TBody, token?: string) =>
        apiRequest<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            token,
        }),

    put: <T, TBody = unknown>(endpoint: string, data?: TBody, token?: string) =>
        apiRequest<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            token,
        }),

    delete: <T>(endpoint: string, token?: string) =>
        apiRequest<T>(endpoint, { method: 'DELETE', token }),
};
