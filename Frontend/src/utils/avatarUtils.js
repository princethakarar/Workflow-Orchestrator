/**
 * Avatar utility functions for consistent user avatars across the application
 */

/**
 * Generate consistent color for a user based on their ID
 * Same user will always get the same color across the entire app
 */
export const getAvatarColor = (userId) => {
    if (!userId) return 'bg-gray-500';

    // Convert userId to a number for consistent color selection
    const hash = userId.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Array of vibrant, accessible colors
    const colors = [
        'bg-blue-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-red-500',
        'bg-orange-500',
        'bg-amber-500',
        'bg-green-500',
        'bg-teal-500',
        'bg-cyan-500',
        'bg-indigo-500',
        'bg-violet-500',
        'bg-fuchsia-500',
        'bg-rose-500',
        'bg-emerald-500',
        'bg-lime-500',
        'bg-sky-500'
    ];

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

/**
 * Get initials from full name
 * Extracts first letter of first name and first letter of last name
 * @param {string} fullName - Full name of the user
 * @returns {string} Two-letter initials (e.g., "John Doe" -> "JD")
 */
export const getInitials = (fullName) => {
    if (!fullName) return '?';

    const nameParts = fullName.trim().split(' ').filter(Boolean);

    if (nameParts.length === 0) return '?';
    if (nameParts.length === 1) {
        // Single name: return first two letters
        return nameParts[0].substring(0, 2).toUpperCase();
    }

    // Multiple names: first letter of first name + first letter of last name
    const firstInitial = nameParts[0][0].toUpperCase();
    const lastInitial = nameParts[nameParts.length - 1][0].toUpperCase();

    return `${firstInitial}${lastInitial}`;
};

/**
 * Get avatar props for rendering
 * Returns an object with all necessary avatar properties
 */
export const getAvatarProps = (user) => {
    if (!user) {
        return {
            initials: '?',
            colorClass: 'bg-gray-500',
            fullName: 'Unknown',
            hasImage: false
        };
    }

    const fullName = user.fullName || user.name || user.username || 'Unknown';
    const userId = user._id || user.id;

    return {
        initials: getInitials(fullName),
        colorClass: getAvatarColor(userId),
        fullName,
        hasImage: !!(user.avatar || user.avatar?.url),
        imageUrl: user.avatar?.url || user.avatar
    };
};
