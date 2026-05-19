import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { handleError } from '../utils/errorHandler';
import api from '../services/api';

/**
 * Custom hook for team management operations
 * Handles API calls for inviting, fetching, updating team members
 */
export const useTeam = () => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 20
    });

    /**
     * Fetch team members with optional filters
     */
    const fetchTeam = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (filters.role) params.append('role', filters.role);
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await api.get(`/api/team?${params}`);

            if (response.data.success) {
                setTeam(response.data.data.users);
                setPagination(response.data.data.pagination);
            }
        } catch (err) {
            const errorMsg = handleError(err, 'Failed to fetch team members');
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Invite a new team member
     */
    const inviteMember = useCallback(async (data) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/api/team/invite', data);

            if (response.data.success) {
                toast.success(response.data.message);
                // Refresh team list
                await fetchTeam();
                return { success: true, data: response.data.data };
            }
        } catch (err) {
            const errorMsg = handleError(err, 'Failed to send invitation');
            setError(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [fetchTeam]);

    /**
     * Update team member status
     */
    const updateStatus = useCallback(async (id, status) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.patch(`/api/team/${id}/status`, { status });

            if (response.data.success) {
                toast.success(response.data.message);
                // Update local state
                setTeam(prev => prev.map(member =>
                    member._id === id ? { ...member, status } : member
                ));
                return { success: true };
            }
        } catch (err) {
            const errorMsg = handleError(err, 'Failed to update status');
            setError(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Deactivate team member
     */
    const deactivateMember = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.delete(`/api/team/${id}`);

            if (response.data.success) {
                toast.success(response.data.message);
                // Update local state
                setTeam(prev => prev.map(member =>
                    member._id === id ? { ...member, status: 'inactive' } : member
                ));
                return { success: true };
            }
        } catch (err) {
            const errorMsg = handleError(err, 'Failed to deactivate member');
            setError(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Resend invitation email
     */
    const resendInvite = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post(`/api/team/${id}/resend`, {});

            if (response.data.success) {
                toast.success(response.data.message);
                return { success: true };
            }
        } catch (err) {
            const errorMsg = handleError(err, 'Failed to resend invitation');
            setError(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        team,
        loading,
        error,
        pagination,
        fetchTeam,
        inviteMember,
        updateStatus,
        deactivateMember,
        resendInvite
    };
};
