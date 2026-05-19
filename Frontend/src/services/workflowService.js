import api from './api'

// ─── Workflow API ─────────────────────────────────────────────────────────────

export const workflowAPI = {
    /**
     * Get workflow for a project.
     * Returns: { project, nodes, edges, availableSubtasks, permissions }
     */
    getWorkflow: async (projectId) => {
        const res = await api.get(`/api/projects/${projectId}/workflows`)
        return res.data
    },

    /**
     * Save workflow canvas state (nodes positions + edges).
     * Only Admin/PM can call this.
     */
    updateWorkflow: async (projectId, { nodes, edges, socketId }) => {
        const res = await api.put(`/api/projects/${projectId}/workflows`, { nodes, edges, socketId })
        return res.data
    },

    /**
     * Reset/delete the entire workflow canvas.
     */
    deleteWorkflow: async (projectId) => {
        const res = await api.delete(`/api/projects/${projectId}/workflows`)
        return res.data
    }
}

export default api
