import { useState, useCallback, useEffect, useRef } from 'react'
import { workflowAPI } from '../services/workflowService'
import { toast } from 'react-toastify'

/**
 * useWorkflow — fetches and provides workflow data for the editor page
 *
 * Returns:
 *   project, nodes, edges, availableSubtasks, canEdit,
 *   loading, error, refetch, silentRefetch
 */
export const useWorkflow = (projectId) => {
    const [project, setProject] = useState(null)
    const [nodes, setNodes] = useState([])
    const [edges, setEdges] = useState([])
    const [availableSubtasks, setAvailableSubtasks] = useState([])
    const [canEdit, setCanEdit] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Track whether this is the initial load (show spinner) vs a background sync
    const hasLoadedOnce = useRef(false)

    const fetchWorkflow = useCallback(async ({ silent = false } = {}) => {
        if (!projectId) return

        // Only show loading spinner on the very first fetch
        if (!silent && !hasLoadedOnce.current) {
            setLoading(true)
        }
        setError(null)

        try {
            const response = await workflowAPI.getWorkflow(projectId)
            const { data } = response

            setProject(data.project)
            setNodes(data.nodes || [])
            setEdges(data.edges || [])
            setAvailableSubtasks(data.availableSubtasks || [])
            setCanEdit(data.permissions?.canEdit ?? false)
            hasLoadedOnce.current = true
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load workflow'
            setError(msg)
            // Don't toast here — let the page handle it contextually
        } finally {
            setLoading(false)
        }
    }, [projectId])

    // Silent refetch for real-time sync — no loading spinner, no jarring UI
    const silentRefetch = useCallback(() => {
        return fetchWorkflow({ silent: true })
    }, [fetchWorkflow])

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
        refetch: fetchWorkflow,
        silentRefetch
    }
}
