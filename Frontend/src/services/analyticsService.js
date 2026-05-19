import api from './api'

export const analyticsAPI = {
    getAdminAnalytics: () => api.get('/api/analytics/admin'),
    getManagerAnalytics: () => api.get('/api/analytics/manager'),
    getDeveloperAnalytics: () => api.get('/api/analytics/developer'),
}

export default api
