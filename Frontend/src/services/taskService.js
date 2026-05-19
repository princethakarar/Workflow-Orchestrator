import api from './api'

// Task API calls
export const taskAPI = {
    /**
     * Get all tasks for a project
     */
    getProjectTasks: async (projectId) => {
        const response = await api.get(`/api/projects/${projectId}/tasks`)
        return response.data
    },

    /**
     * Create new task
     */
    createTask: async (projectId, taskData) => {
        const response = await api.post(`/api/projects/${projectId}/tasks`, taskData)
        return response.data
    },

    /**
     * Delete task
     */
    deleteTask: async (taskId) => {
        const response = await api.delete(`/api/tasks/${taskId}`)
        return response.data
    },

    /**
     * Create subtask
     */
    createSubtask: async (taskId, subtaskData) => {
        const response = await api.post(`/api/tasks/${taskId}/subtasks`, subtaskData)
        return response.data
    },

    /**
     * Delete subtask
     */
    deleteSubtask: async (taskId, subtaskId) => {
        const response = await api.delete(`/api/tasks/${taskId}/subtasks/${subtaskId}`)
        return response.data
    },

    /**
     * Assign developers to task (task-level, only if no subtasks)
     */
    assignDevelopersToTask: async (taskId, developerIds) => {
        const response = await api.patch(`/api/tasks/${taskId}/assign`, { developerIds })
        return response.data
    },

    /**
     * Remove developer from task
     */
    removeDeveloperFromTask: async (taskId, developerId) => {
        const response = await api.patch(`/api/tasks/${taskId}/unassign/${developerId}`)
        return response.data
    },

    /**
     * Assign developers to subtask (subtask-level, multiple developers)
     */
    assignDevelopersToSubtask: async (taskId, subtaskId, developerIds) => {
        const response = await api.patch(`/api/tasks/${taskId}/subtasks/${subtaskId}/assign`, { developerIds })
        return response.data
    },

    /**
     * Remove developer from subtask
     */
    removeDeveloperFromSubtask: async (taskId, subtaskId, developerId) => {
        const response = await api.patch(`/api/tasks/${taskId}/subtasks/${subtaskId}/unassign/${developerId}`)
        return response.data
    },

    /**
     * Toggle subtask completion
     */
    toggleSubtaskCompletion: async (taskId, subtaskId) => {
        const response = await api.patch(`/api/tasks/${taskId}/subtasks/${subtaskId}/toggle`)
        return response.data
    }
}

export default api
