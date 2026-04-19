import mongoose from "mongoose"
import { User } from "../models/userModel.js"
import { Project } from "../models/projectModel.js"
import { ApiError } from "../utils/api-error.js"
import { asyncHandler } from "../utils/async-handler.js"
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

        if (!user) {
            throw new ApiError(401, "Invalid access token")
        }

        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, "Invalid access token")
    }
})

/**
 * Middleware to check if user has one of the allowed roles
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'projectManager', 'developer')
 * @returns middleware function
 */
export const authorize = (...roles) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required")
        }

        if (!roles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `Access denied. Required roles: ${roles.join(', ')}`
            )
        }

        next()
    })
}

// Alias for consistency with requirements
export const protect = verifyJWT

// Note: validateProjectPermission is kept for backward compatibility
// but may not be needed if using the new authorize middleware
export const validateProjectPermission = (roles = []) => {
    return asyncHandler(async (req, res, next) => {
        const { projectId } = req.params

        if (!projectId) {
            throw new ApiError(400, "Project id is missing!")
        }

        // Check if project exists and if user has access to it
        const project = await Project.findById(projectId)

        if (!project) {
            throw new ApiError(404, "Project not found!")
        }

        // Check if user is admin, owner, manager, or team member
        const userId = req.user._id.toString()
        const isAdmin = req.user.role === 'admin'
        const isOwner = project.owner.toString() === userId
        const isManager = project.manager?.toString() === userId
        const isTeamMember = project.team?.some(member => member.user.toString() === userId)

        if (!isAdmin && !isOwner && !isManager && !isTeamMember) {
            throw new ApiError(403, "You don't have access to this project")
        }

        // For role-based permissions, check if user has the required role
        if (roles.length > 0 && !roles.includes(req.user.role)) {
            throw new ApiError(
                403,
                "You don't have permission to perform this action"
            )
        }

        next()
    })
}