import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const AUTH_URL = `${API_BASE}/api/v1/auth`;
const PROJECTS_URL = `${API_BASE}/api/projects`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fetch the fully-populated current user (including avatar, currentProjects)
 */
export const fetchCurrentUser = async () => {
    const res = await axios.post(
        `${AUTH_URL}/current-user`,
        {},
        { headers: getAuthHeaders(), withCredentials: true }
    );
    return res.data.data; // returns user object
};

/**
 * Upload avatar image file — multipart/form-data
 * @param {File} file
 */
export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await axios.post(
        `${AUTH_URL}/upload-avatar`,
        formData,
        {
            headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
            withCredentials: true,
        }
    );
    return res.data.data; // { user, avatarUrl }
};

/**
 * Change password — requires old + new password
 * @param {string} oldPassword
 * @param {string} newPassword
 */
export const changePassword = async (oldPassword, newPassword) => {
    const res = await axios.post(
        `${AUTH_URL}/change-password`,
        { oldPassword, newPassword },
        { headers: getAuthHeaders(), withCredentials: true }
    );
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
        const res = await axios.get(
            PROJECTS_URL,
            { headers: getAuthHeaders(), withCredentials: true }
        );
        const data = res.data.data;
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('[profileService] fetchMyProjects failed:', err?.response?.status, err?.response?.data);
        return [];
    }
};
