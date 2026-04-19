import { ApiError } from "../utils/api-error.js"
import { asyncHandler } from "../utils/async-handler.js"

/**
 * Middleware to check if the authenticated user has admin role
 * Must be used after verifyJWT middleware
 */
export const checkAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required")
    }

    if (req.user.role !== 'admin') {
        throw new ApiError(
            403,
            "Access denied. Admin privileges required."
        )
    }

    next()
})

/**
 * Middleware to check if user has one of the allowed roles
 * @param {Array<string>} allowedRoles - Array of role strings
 */
export const checkRole = (allowedRoles = []) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required")
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `Access denied. Required roles: ${allowedRoles.join(', ')}`
            )
        }

        next()
    })
}
