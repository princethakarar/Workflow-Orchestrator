import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Project API calls
export const projectAPI = {
    /**
     * Get all projects
     */
    getAllProjects: async (filters = {}) => {
        const params = new URLSearchParams()
        if (filters.status) params.append('status', filters.status)
        if (filters.priority) params.append('priority', filters.priority)
        if (filters.search) params.append('search', filters.search)

        const response = await api.get(`/api/projects?${params.toString()}`)
        return response.data
    },

    /**
     * Get project by ID
     */
    getProjectById: async (projectId) => {
        const response = await api.get(`/api/projects/${projectId}`)
        return response.data
    },

    /**
     * Create new project
     */
    createProject: async (projectData) => {
        const response = await api.post('/api/projects', projectData)
        return response.data
    },

    /**
     * Update project
     */
    updateProject: async (projectId, projectData) => {
        const response = await api.put(`/api/projects/${projectId}`, projectData)
        return response.data
    },

    /**
     * Delete project
     */
    deleteProject: async (projectId) => {
        const response = await api.delete(`/api/projects/${projectId}`)
        return response.data
    },

    /**
     * Get project details for dashboard (with populated team)
     */
    getProjectDetails: async (projectId) => {
        const response = await api.get(`/api/projects/${projectId}/details`)
        return response.data
    },

    /**
     * Get available developers (not assigned to any active project)
     */
    getAvailableDevelopers: async () => {
        const response = await api.get('/api/projects/available-developers')
        return response.data
    },

    /**
     * Assign developer to project team
     */
    assignTeamMember: async (projectId, developerId) => {
        const response = await api.post(`/api/projects/${projectId}/team/assign`, { developerId })
        return response.data
    },

    /**
     * Remove developer from project team
     */
    removeTeamMember: async (projectId, developerId) => {
        const response = await api.post(`/api/projects/${projectId}/team/remove`, { developerId })
        return response.data
    },

    /**
     * Update project details
     */
    updateProjectDetails: async (projectId, projectData) => {
        const response = await api.put(`/api/projects/${projectId}/details`, projectData)
        return response.data
    },

    /**
     * Mark project as complete and release team
     */
    completeProject: async (projectId) => {
        const response = await api.patch(`/api/projects/${projectId}/complete`)
        return response.data
    }
}

export default api
