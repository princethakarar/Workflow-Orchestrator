import axios from 'axios'

const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api/team'

// Create axios instance with interceptors for auth
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true, // Send cookies if backend uses them for auth
})

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken') // Fixed: changed from 'token' to 'accessToken'
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export const teamAPI = {
    getProjectManagers: (search = '') => {
        return api.get(`/project-managers${search ? `?search=${search}` : ''}`)
    }
}

export default api
