import api from './api';

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

export default api;
