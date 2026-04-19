import { useState, useEffect, useCallback } from 'react'
import { teamAPI } from '../services/teamService'
import { toast } from 'react-toastify'

export const useProjectManagers = () => {
    const [managers, setManagers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchManagers = useCallback(async (search = '') => {
        setLoading(true)
        try {
            const response = await teamAPI.getProjectManagers(search)
            setManagers(response.data.data || [])
            setError(null)
        } catch (err) {
            console.error('Error fetching project managers:', err)
            setError(err.response?.data?.message || 'Failed to fetch project managers')
            toast.error('Failed to load project managers')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchManagers()
    }, [fetchManagers])

    return { managers, loading, error, refetch: fetchManagers }
}
