import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Developer API calls
export const developerAPI = {
    /**
     * Get project details for developer view (read-only)
     */
    getDeveloperProjectView: async (projectId) => {
        try {
            const response = await api.get(`/api/developer/projects/${projectId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Toggle subtask completion (developer can only toggle their own)
     */
    toggleSubtaskForDeveloper: async (taskId, subtaskId) => {
        try {
            const response = await api.patch(`/api/developer/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default developerAPI;
