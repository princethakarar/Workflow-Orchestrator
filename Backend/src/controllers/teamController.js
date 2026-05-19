import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { User } from "../models/userModel.js"
import { Invitation } from "../models/invitationModel.js"
import { Project } from "../models/projectModel.js"
import { generateSecurePassword } from "../utils/passwordGenerator.js"
import { sendEmail, teamInvitationMailgenContent } from "../utils/mail.js"
import mongoose from "mongoose"

/**
 * @desc    Invite a new team member
 * @route   POST /api/team/invite
 * @access  Admin only
 */
export const inviteMember = asyncHandler(async (req, res) => {
    const { name, email, role, specialization } = req.body

    // Validation
    if (!name || !email || !role) {
        throw new ApiError(400, "Name, email, and role are required")
    }

    // Validate name length
    if (name.length < 3 || name.length > 50) {
        throw new ApiError(400, "Name must be between 3 and 50 characters")
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format")
    }

    // Validate role
    const validRoles = ['developer', 'projectManager']
    if (!validRoles.includes(role)) {
        throw new ApiError(400, "Invalid role. Must be 'developer' or 'projectManager'")
    }

    // Validate specialization (optional, will use default if not provided)
    const validSpecializations = ['Frontend', 'Backend', 'Full Stack', 'UI/UX', 'DevOps', 'Mobile', 'QA']
    if (specialization && !validSpecializations.includes(specialization)) {
        throw new ApiError(400, "Invalid specialization")
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
        throw new ApiError(409, "This email is already registered")
    }

    // Generate temporary password and invitation token
    const temporaryPassword = generateSecurePassword(16)

    // Create user instance to use the generateInvitationToken method
    const tempUser = new User({ email, password: temporaryPassword })
    const { unHashedToken, HashedToken, tokenExpiry } = tempUser.generateInvitationToken()

    // Create the user with inactive status
    const newUser = await User.create({
        username: email.split('@')[0] + '_' + Date.now(), // Generate unique username
        email: email.toLowerCase(),
        fullName: name,
        password: temporaryPassword,
        role,
        specialization: specialization || 'Full Stack', // Default to 'Full Stack' if not provided
        status: 'inactive',
        isEmailVerified: false,
        invitedBy: req.user._id,
        forgotPasswordToken: HashedToken,
        forgotPasswordExpiry: new Date(tokenExpiry)
    })

    // Create invitation record
    await Invitation.create({
        email: email.toLowerCase(),
        role,
        invitedBy: req.user._id,
        status: 'pending',
        token: HashedToken,
        expiresAt: new Date(tokenExpiry)
    })

    // Generate set password link
    const setPasswordLink = `${process.env.FRONTEND_URL}/set-password?token=${unHashedToken}`

    // Send invitation email (non-blocking)
    try {
        await sendEmail({
            email: email.toLowerCase(),
            subject: "Welcome to WorkFlow Orchestrator - Set Your Password",
            mailgenContent: teamInvitationMailgenContent(name, email.toLowerCase(), role, specialization || 'Full Stack', setPasswordLink)
        })
    } catch (error) {
        console.error("Email sending failed:", error)
        // Don't throw error, just log it - user is still created
    }

    // Return success response (exclude sensitive fields)
    const userResponse = {
        id: newUser._id,
        name: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        specialization: newUser.specialization,
        status: newUser.status,
        createdAt: newUser.createdAt
    }

    res.status(201).json(
        new ApiResponse(201, userResponse, `Invitation sent to ${email}`)
    )
})

export const getProjectManagers = asyncHandler(async (req, res) => {
    const { search } = req.query;

    const filter = {
        role: { $in: ['projectManager', 'admin'] },
        status: { $ne: 'inactive' }
    };

    if (search) {
        filter.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    // Get all project managers and admins matching the filter
    const allManagers = await User.find(filter)
        .select('fullName email avatar specialization role status')
        .sort({ fullName: 1 });

    return res.status(200).json(
        new ApiResponse(200, allManagers, `Found ${allManagers.length} active manager(s)`)
    );
});



/**
 * @desc    Get all team members with filtering and pagination (role-based)
 * @route   GET /api/team
 * @access  Private (Admin, Project Manager)
 */
export const getTeam = asyncHandler(async (req, res) => {
    const { role, status, search, page = 1, limit = 20 } = req.query
    const userRole = req.user.role
    const userId = req.user._id

    // Build base filter query
    const filter = {}

    // Apply role-based filtering
    if (userRole === 'admin') {
        // Admin sees all users except other admins
        filter.role = { $ne: 'admin' }
    } else if (userRole === 'projectManager') {
        // Project Manager sees only developers assigned to their projects
        const { Project } = await import('../models/projectModel.js')

        // Find all projects managed by this PM
        const managedProjects = await Project.find({ manager: userId }).select('team')

        // Extract unique developer IDs from all project teams
        const developerIds = new Set()
        managedProjects.forEach(project => {
            project.team.forEach(member => {
                developerIds.add(member.user.toString())
            })
        })

        // Filter to only these developer IDs
        filter._id = { $in: Array.from(developerIds) }
    } else {
        // Developer - show teammates from shared projects (optional)
        const { Project } = await import('../models/projectModel.js')

        // Find projects where this developer is assigned
        const assignedProjects = await Project.find({ 'team.user': userId }).select('team')

        // Extract unique teammate IDs
        const teammateIds = new Set()
        assignedProjects.forEach(project => {
            project.team.forEach(member => {
                const memberId = member.user.toString()
                if (memberId !== userId.toString()) {
                    teammateIds.add(memberId)
                }
            })
        })

        filter._id = { $in: Array.from(teammateIds) }
    }

    // Apply additional filters
    if (role) {
        filter.role = role
    }

    // For 'inactive' status, we can filter at DB level
    // For 'available' and 'occupied', we filter post-query since they are computed dynamically
    const dynamicStatusFilter = (status === 'available' || status === 'occupied') ? status : null
    if (status && !dynamicStatusFilter) {
        filter.status = status
    }

    if (search) {
        filter.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } }
        ]
    }

    // When filtering by dynamic status, we need to fetch all users first,
    // compute status, then apply pagination manually
    const fetchAll = !!dynamicStatusFilter

    // Calculate pagination
    const skip = fetchAll ? 0 : (parseInt(page) - 1) * parseInt(limit)
    const fetchLimit = fetchAll ? 0 : parseInt(limit)

    // Fetch users with populated projects
    let usersQuery = User.find(filter)
        .select('-password -refreshToken -forgotPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry')
        .populate('invitedBy', 'fullName email')
        .sort({ createdAt: -1 })

    if (!fetchAll) {
        usersQuery = usersQuery.skip(skip).limit(fetchLimit)
    }

    const users = await usersQuery

    // Manually fetch current projects for each user
    let usersWithProjects = await Promise.all(users.map(async (user) => {
        let currentProjects = []

        if (user.role === 'projectManager') {
            // For PMs, find projects they manage
            currentProjects = await Project.find({
                manager: user._id,
                status: { $nin: ['completed', 'cancelled'] }
            }).select('name description status').lean()
        } else if (user.role === 'developer') {
            // For developers, find projects they're assigned to
            currentProjects = await Project.find({
                'team.user': user._id,
                status: { $nin: ['completed', 'cancelled'] }
            }).select('name description status').lean()
        }

        // Convert to plain object and add currentProjects
        const userObj = user.toObject()
        userObj.currentProjects = currentProjects

        // Compute dynamic status based on project assignments
        // 'inactive' is preserved for users who haven't accepted their invitation yet
        if (userObj.status !== 'inactive') {
            userObj.computedStatus = currentProjects.length > 0 ? 'occupied' : 'available'
        } else {
            userObj.computedStatus = 'inactive'
        }

        return userObj
    }))

    // Apply dynamic status filtering post-computation
    if (dynamicStatusFilter) {
        usersWithProjects = usersWithProjects.filter(u => u.computedStatus === dynamicStatusFilter)
    }

    // Calculate pagination values
    const totalCount = dynamicStatusFilter
        ? usersWithProjects.length
        : await User.countDocuments(filter)

    // Apply manual pagination when filtering by dynamic status
    const paginatedUsers = dynamicStatusFilter
        ? usersWithProjects.slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit))
        : usersWithProjects

    res.status(200).json(
        new ApiResponse(200, {
            users: paginatedUsers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit)
            }
        }, "Team members fetched successfully")
    )
})

/**
 * @desc    Update team member status
 * @route   PATCH /api/team/:id/status
 * @access  Admin only
 */
export const updateMemberStatus = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    // Validate status
    const validStatuses = ['available', 'occupied', 'inactive']
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status. Must be 'available', 'occupied', or 'inactive'")
    }

    // Find and update user
    const user = await User.findById(id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // Prevent admin from deactivating themselves
    if (status === 'inactive' && user._id.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot deactivate your own account")
    }

    user.status = status
    await user.save()

    res.status(200).json(
        new ApiResponse(200, {
            id: user._id,
            name: user.fullName,
            email: user.email,
            status: user.status
        }, "User status updated successfully")
    )
})

/**
 * @desc    Delete team member with project safety check
 * @route   DELETE /api/team/:id
 * @access  Admin only
 */
export const deleteTeamMember = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { transferProjectsTo } = req.body  // Optional: for PM with projects

    const user = await User.findById(id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot delete your own account")
    }

    // SAFETY CHECK: If user is PM, check for active projects
    if (user.role === 'projectManager') {
        const activeProjects = await Project.countDocuments({
            manager: user._id,
            status: { $nin: ['completed', 'cancelled'] }
        })

        if (activeProjects > 0) {
            // Require project transfer
            if (!transferProjectsTo) {
                // Return list of available PMs (and active admins)
                const availablePMs = await User.find({
                    role: { $in: ['projectManager', 'admin'] },
                    status: { $ne: 'inactive' },
                    _id: { $ne: user._id }
                }).select('_id fullName email specialization')

                return res.status(400).json(
                    new ApiResponse(400, {
                        requiresTransfer: true,
                        activeProjects,
                        availablePMs,
                        memberName: user.fullName
                    }, `This PM manages ${activeProjects} active project(s). Transfer required.`)
                )
            }

            // Validate new PM
            const newPM = await User.findById(transferProjectsTo)
            if (!newPM || (newPM.role !== 'projectManager' && newPM.role !== 'admin')) {
                throw new ApiError(400, "Invalid project manager or admin selected for transfer")
            }

            try {
                // Transfer all active projects
                await Project.updateMany(
                    {
                        manager: user._id,
                        status: { $nin: ['completed', 'cancelled'] }
                    },
                    { $set: { manager: transferProjectsTo } }
                )

                // Delete user
                await User.findByIdAndDelete(id)

                return res.status(200).json(
                    new ApiResponse(200, {
                        projectsTransferred: activeProjects,
                        transferredTo: newPM.fullName
                    }, `User deleted successfully. ${activeProjects} project(s) transferred to ${newPM.fullName}`)
                )
            } catch (error) {
                throw error
            }
        }
    }

    // No active projects or not a PM - safe to delete
    await User.findByIdAndDelete(id)

    return res.status(200).json(
        new ApiResponse(200, null, "Team member deleted successfully")
    )
})

/**
 * @desc    Resend invitation email
 * @route   POST /api/team/:id/resend
 * @access  Admin only
 */
export const resendInvitation = asyncHandler(async (req, res) => {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // Check if user is still inactive (hasn't set password yet)
    if (user.status !== 'inactive' || user.isEmailVerified) {
        throw new ApiError(400, "User has already activated their account")
    }

    // Generate new invitation token (24-hour expiry)
    const { unHashedToken, HashedToken, tokenExpiry } = user.generateInvitationToken()

    // Update user's token
    user.forgotPasswordToken = HashedToken
    user.forgotPasswordExpiry = new Date(tokenExpiry)
    await user.save()

    // Update invitation record
    await Invitation.findOneAndUpdate(
        { email: user.email, status: 'pending' },
        {
            token: HashedToken,
            expiresAt: new Date(tokenExpiry),
            status: 'pending'
        }
    )

    // Generate set password link
    const setPasswordLink = `${process.env.FRONTEND_URL}/set-password?token=${unHashedToken}`

    // Send invitation email
    try {
        await sendEmail({
            email: user.email,
            subject: "Reminder: Set Your Password - WorkFlow Orchestrator",
            mailgenContent: teamInvitationMailgenContent(user.fullName, user.email, user.role, user.specialization || 'Full Stack', setPasswordLink)
        })
    } catch (error) {
        console.error("Email sending failed:", error)
        throw new ApiError(500, "Failed to send invitation email")
    }

    res.status(200).json(
        new ApiResponse(200, null, `Invitation resent to ${user.email}`)
    )
})

/**
 * @desc    Update team member (role, specialization) with PM reassignment
 * @route   PATCH /api/team/:id
 * @access  Admin only
 */
export const updateTeamMember = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { role, specialization, transferProjectsTo } = req.body

    // STEP 1: Block admin role assignment
    if (role === 'admin') {
        throw new ApiError(403, "Cannot assign admin role to team members")
    }

    // STEP 2: Validate inputs
    const validRoles = ['developer', 'projectManager']
    if (!validRoles.includes(role)) {
        throw new ApiError(400, "Invalid role. Must be 'developer' or 'projectManager'")
    }

    const validSpecializations = ['Frontend', 'Backend', 'Full Stack', 'UI/UX', 'DevOps', 'Mobile', 'QA']
    if (!validSpecializations.includes(specialization)) {
        throw new ApiError(400, "Invalid specialization")
    }

    // STEP 3: Fetch the user to be updated
    const user = await User.findById(id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // Prevent editing admin users
    if (user.role === 'admin') {
        throw new ApiError(403, "Cannot edit admin users")
    }

    // STEP 4: Check if user is currently a Project Manager
    const isCurrentlyPM = user.role === 'projectManager'
    const isDemotingPM = isCurrentlyPM && role !== 'projectManager'

    // STEP 5: If demoting a PM, check for active projects
    if (isDemotingPM) {
        const { Project } = await import('../models/projectModel.js')

        const activeProjects = await Project.countDocuments({
            manager: user._id,
            status: { $nin: ['completed', 'cancelled'] }
        })

        // CONDITION A: Has active projects but no replacement specified
        if (activeProjects > 0 && !transferProjectsTo) {
            return res.status(409).json(
                new ApiResponse(
                    409,
                    {
                        requireTransfer: true,
                        projectCount: activeProjects
                    },
                    "User has active projects that need reassignment"
                )
            )
        }

        // CONDITION B: Has active projects and replacement is provided
        if (activeProjects > 0 && transferProjectsTo) {
            // Validate replacement PM exists and is a PM or Admin
            const newPM = await User.findById(transferProjectsTo)
            if (!newPM || (newPM.role !== 'projectManager' && newPM.role !== 'admin')) {
                throw new ApiError(400, "Invalid replacement project manager or admin")
            }

            try {
                // Transfer all active projects
                await Project.updateMany(
                    { manager: user._id, status: { $nin: ['completed', 'cancelled'] } },
                    { $set: { manager: transferProjectsTo } }
                )

                // Update user role and specialization
                user.role = role
                user.specialization = specialization
                await user.save()

                return res.status(200).json(
                    new ApiResponse(
                        200,
                        {
                            user,
                            projectsTransferred: activeProjects
                        },
                        `User updated successfully. ${activeProjects} project(s) transferred to new manager.`
                    )
                )
            } catch (error) {
                throw error
            }
        }
    }

    // CONDITION C: No active projects OR not a PM demotion
    user.role = role
    user.specialization = specialization
    await user.save()

    res.status(200).json(
        new ApiResponse(200, user, "User updated successfully")
    )
})
