import api from './api';

/**
 * Fetch the fully-populated current user (including avatar, currentProjects)
 */
export const fetchCurrentUser = async () => {
    const res = await api.post('/api/v1/auth/current-user', {});
    return res.data.data; // returns user object
};

/**
 * Upload avatar image file — multipart/form-data
 * @param {File} file
 */
export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.post('/api/v1/auth/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data; // { user, avatarUrl }
};

/**
 * Change password — requires old + new password
 * @param {string} oldPassword
 * @param {string} newPassword
 */
export const changePassword = async (oldPassword, newPassword) => {
    const res = await api.post('/api/v1/auth/change-password', { oldPassword, newPassword });
    return res.data;
};

/**
 * Get projects assigned to the logged-in user.
 * Uses the existing GET /projects endpoint which is already role-aware:
 *   - projectManager → projects where manager === userId
 *   - developer      → projects where team.user === userId
 *   - admin          → all projects
 */
export const fetchMyProjects = async () => {
    try {
        const res = await api.get('/api/projects');
        const data = res.data.data;
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('[profileService] fetchMyProjects failed:', err?.response?.status, err?.response?.data);
        return [];
    }
};
