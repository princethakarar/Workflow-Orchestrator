import crypto from "crypto"

/**
 * Generate a secure random password
 * @param {number} length - Length of password (default: 16)
 * @returns {string} - Random password with alphanumeric and special characters
 */
export const generateSecurePassword = (length = 16) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    const randomBytes = crypto.randomBytes(length)

    for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length]
    }

    return password
}
