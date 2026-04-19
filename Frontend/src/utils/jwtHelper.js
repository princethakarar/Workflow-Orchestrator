import { jwtDecode } from 'jwt-decode';

/**
 * Decode a JWT token
 * @param {string} token - JWT token to decode
 * @returns {object|null} Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
    try {
        if (!token) return null;
        return jwtDecode(token);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

/**
 * Get user role from stored access token
 * @returns {string|null} User role or null if not found
 */
export const getUserRole = () => {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;

        const decoded = decodeToken(token);
        return decoded?.role || null;
    } catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
};

/**
 * Get full user data from stored access token
 * @returns {object|null} User data or null if not found
 */
export const getUserFromToken = () => {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;

        return decodeToken(token);
    } catch (error) {
        console.error('Error getting user from token:', error);
        return null;
    }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
    try {
        if (!token) return true;

        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        // exp is in seconds, Date.now() is in milliseconds
        return decoded.exp * 1000 < Date.now();
    } catch (error) {
        return true;
    }
};

/**
 * Get role-based redirect path
 * @param {string} role - User role
 * @returns {string} Redirect path based on role
 */
export const getRoleBasedPath = (role) => {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'projectManager':
            return '/manager/dashboard';
        case 'developer':
            return '/developer/dashboard';
        default:
            return '/dashboard';
    }
};
