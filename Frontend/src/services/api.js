import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// Request Interceptor: Attach token to every request
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Response Interceptor: Handle 401 (Unauthorized) and attempt token refresh
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't already tried refreshing this specific request
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token available');

                // Call the refresh-token endpoint
                const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh-token`,
                    { refreshToken },
                    { withCredentials: true }
                );

                if (res.data?.success && res.data?.data?.accessToken) {
                    const newAccessToken = res.data.data.accessToken;
                    localStorage.setItem('accessToken', newAccessToken);

                    // Update header for the original request and retry it
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Token refresh failed, clear session and redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
