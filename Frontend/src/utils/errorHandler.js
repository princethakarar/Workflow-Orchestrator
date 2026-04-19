/**
 * Extract user-friendly error message from API error response
 * @param {Error} error - Axios error object
 * @param {string} fallback - Default message if unable to extract
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
    // Check for network errors
    if (!error.response) {
        if (error.code === 'ERR_NETWORK') {
            return 'Unable to connect to the server. Please check your internet connection.';
        }
        return 'Network error. Please try again.';
    }

    // Extract message from various response formats
    const response = error.response;

    // Format 1: { message: "..." }
    if (response.data?.message) {
        return response.data.message;
    }

    // Format 2: { error: "..." }
    if (response.data?.error) {
        return response.data.error;
    }

    // Format 3: { errors: [{ msg: "..." }] } (express-validator format)
    if (response.data?.errors && Array.isArray(response.data.errors)) {
        if (response.data.errors.length > 0) {
            return response.data.errors[0].msg || response.data.errors[0].message;
        }
    }

    // Format 4: Direct string response
    if (typeof response.data === 'string') {
        return response.data;
    }

    // HTTP status-based messages
    switch (response.status) {
        case 400:
            return 'Invalid request. Please check your input.';
        case 401:
            return 'Session expired. Please log in again.';
        case 403:
            return 'You don\'t have permission to perform this action.';
        case 404:
            return 'Resource not found.';
        case 409:
            return 'This resource already exists.';
        case 422:
            return 'Validation failed. Please check your input.';
        case 429:
            return 'Too many requests. Please try again later.';
        case 500:
        case 502:
        case 503:
            return 'Server error. Please try again later.';
        default:
            return fallback;
    }
};

/**
 * Map backend error messages to more user-friendly versions
 * @param {string} message - Original error message
 * @returns {string} User-friendly message
 */
export const getFriendlyErrorMessage = (message) => {
    const lowercaseMsg = message.toLowerCase();

    // User already exists
    if (lowercaseMsg.includes('already exists') || lowercaseMsg.includes('already registered')) {
        if (lowercaseMsg.includes('email')) {
            return 'This email is already registered. Please use a different email or try logging in.';
        }
        if (lowercaseMsg.includes('username')) {
            return 'This username is already taken. Please choose a different username.';
        }
        return 'This account already exists. Please try logging in instead.';
    }

    // User not found
    if (lowercaseMsg.includes('doesn\'t exist') || lowercaseMsg.includes('not found') || lowercaseMsg.includes('user not found')) {
        return 'No account found with this email. Please check your email or sign up.';
    }

    // Invalid credentials
    if (lowercaseMsg.includes('invalid credentials') || lowercaseMsg.includes('invalid password')) {
        return 'Incorrect email or password. Please try again.';
    }

    // Invalid OTP
    if (lowercaseMsg.includes('invalid otp')) {
        return 'Incorrect verification code. Please check and try again.';
    }

    // Expired OTP/Token
    if (lowercaseMsg.includes('expired')) {
        if (lowercaseMsg.includes('otp')) {
            return 'Verification code has expired. Please request a new one.';
        }
        if (lowercaseMsg.includes('token')) {
            return 'This link has expired. Please request a new one.';
        }
        return 'This has expired. Please try again.';
    }

    // Return original message if no mapping found
    return message;
};

/**
 * Process error and return user-friendly message
 * @param {Error} error - Error object
 * @param {string} fallback - Fallback message
 * @returns {string} User-friendly error message
 */
export const handleError = (error, fallback) => {
    const rawMessage = getErrorMessage(error, fallback);
    return getFriendlyErrorMessage(rawMessage);
};
