import { useState, useCallback, useEffect } from 'react'
import { workflowAPI } from '../services/workflowService'
import { toast } from 'react-toastify'

/**
 * useWorkflow — fetches and provides workflow data for the editor page
 *
 * Returns:
 *   project, nodes, edges, availableSubtasks, canEdit,
 *   loading, error, refetch
 */
export const useWorkflow = (projectId) => {
    const [project, setProject] = useState(null)
    const [nodes, setNodes] = useState([])
    const [edges, setEdges] = useState([])
    const [availableSubtasks, setAvailableSubtasks] = useState([])
    const [canEdit, setCanEdit] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchWorkflow = useCallback(async () => {
        if (!projectId) return

        setLoading(true)
        setError(null)

        try {
            const response = await workflowAPI.getWorkflow(projectId)
            const { data } = response

            setProject(data.project)
            setNodes(data.nodes || [])
            setEdges(data.edges || [])
            setAvailableSubtasks(data.availableSubtasks || [])
            setCanEdit(data.permissions?.canEdit ?? false)
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load workflow'
            setError(msg)
            // Don't toast here — let the page handle it contextually
        } finally {
            setLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        fetchWorkflow()
    }, [fetchWorkflow])

    return {
        project,
        nodes,
        edges,
        availableSubtasks,
        canEdit,
        loading,
        error,
        refetch: fetchWorkflow
    }
}
