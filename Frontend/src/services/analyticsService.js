import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Shared axios instance with auth token interceptor
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
})

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) config.headers.Authorization = `Bearer ${token}`
        return config
    },
    (error) => Promise.reject(error)
)

export const analyticsAPI = {
    getAdminAnalytics: () => api.get('/api/analytics/admin'),
    getManagerAnalytics: () => api.get('/api/analytics/manager'),
    getDeveloperAnalytics: () => api.get('/api/analytics/developer'),
}

export default api
