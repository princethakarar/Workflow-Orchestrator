import { Project } from "../models/projectModel.js"
import { User } from "../models/userModel.js"
import mongoose from "mongoose"
import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { releaseProjectTeam, calculateProjectProgress } from "../services/projectCompletionService.js"

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Admin, Project Manager)
 */
export const createProject = asyncHandler(async (req, res) => {
    const { name, description, startDate, endDate, priority, tags, managerId } = req.body

    // Validate required fields
    if (!name || name.trim() === '') {
        throw new ApiError(400, "Project name is required")
    }

    if (!managerId) {
        throw new ApiError(400, "Project Manager is required")
    }

    // Verify manager exists and has correct role
    const User = mongoose.model('User');
    const manager = await User.findById(managerId);

    if (!manager) {
        throw new ApiError(404, "Selected project manager not found")
    }

    if (manager.role !== 'projectManager' && manager.role !== 'admin') {
        throw new ApiError(400, "Selected user must be a project manager or admin")
    }

    // Create project
    const project = await Project.create({
        name: name.trim(),
        description: description?.trim() || '',
        owner: req.user._id,
        manager: managerId,
        startDate,
        endDate,
        priority: priority || 'medium',
        tags: tags || [],
        status: 'planning'
    })

    // Populate owner and manager details
    await project.populate('owner', 'username email fullName avatar')
    await project.populate('manager', 'username email fullName avatar')

    return res.status(201).json(
        new ApiResponse(201, project, "Project created successfully")
    )
})

/**
 * @desc    Get all projects (with role-based filtering)
 * @route   GET /api/projects
 * @access  Private
 */
export const getAllProjects = asyncHandler(async (req, res) => {
    const { status, priority, search } = req.query
    const { role, _id } = req.user

    // Build base filter object
    const filter = {}

    // Apply role-based filtering
    if (role === 'admin') {
        // Admin sees ALL projects - no additional filter
    } else if (role === 'projectManager') {
        // Project Manager sees only projects where they are the manager
        filter.manager = _id
    } else if (role === 'developer') {
        // Developer sees only projects they're assigned to
        filter['team.user'] = _id
    } else {
        // Fallback: user sees only their own projects or where they're in team
        filter.$or = [
            { owner: _id },
            { 'team.user': _id }
        ]
    }

    // Apply additional filters
    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (search) {
        filter.$text = { $search: search }
    }

    const projects = await Project.find(filter)
        .populate('owner', 'username email fullName avatar')
        .populate('manager', 'username email fullName avatar role')
        .populate('team.user', 'username email fullName avatar role')
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(200, projects, "Projects fetched successfully")
    )
})

/**
 * @desc    Get project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
export const getProjectById = asyncHandler(async (req, res) => {
    const { id } = req.params

    const project = await Project.findById(id)
        .populate('owner', 'username email fullName avatar')
        .populate('team.user', 'username email fullName avatar role')

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Check access: owner, team member, or admin
    const hasAccess =
        project.owner._id.toString() === req.user._id.toString() ||
        project.team.some(member => member.user._id.toString() === req.user._id.toString()) ||
        req.user.role === 'admin'

    if (!hasAccess) {
        throw new ApiError(403, "You don't have access to this project")
    }

    return res.status(200).json(
        new ApiResponse(200, project, "Project fetched successfully")
    )
})

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Admin, Project Manager - Owner)
 */
export const updateProject = asyncHandler(async (req, res) => {
    const { id } = req.params
    const updates = req.body

    const project = await Project.findById(id)

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Check permission: owner or admin
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "Only project owner or admin can update this project")
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'status', 'startDate', 'endDate', 'priority', 'tags']
    allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
            project[field] = updates[field]
        }
    })

    await project.save()
    await project.populate('owner', 'username email fullName avatar')

    return res.status(200).json(
        new ApiResponse(200, project, "Project updated successfully")
    )
})

/**
 * @desc    Get project details for developer view (read-only)
 * @route   GET /api/developer/projects/:id
 * @access  Developers (team members only)
 */
export const getDeveloperProjectView = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role, _id: userId } = req.user;

    // CRITICAL: Only developers can access this endpoint
    if (role !== 'developer') {
        throw new ApiError(403, 'This endpoint is for developers only. Admins and PMs should use the main dashboard.');
    }

    // Find project
    const project = await Project.findById(id)
        .populate('manager', 'fullName email role')
        .populate('team.user', 'fullName email specialization'); // Populate team.user, not just team

    if (!project) {
        throw new ApiError(404, 'Project not found');
    }

    // Check if developer is on the team
    const isTeamMember = project.team.some(
        member => member.user._id.toString() === userId.toString() // Access member.user._id
    );

    if (!isTeamMember) {
        throw new ApiError(403, 'Access denied. You are not a member of this project team.');
    }

    // Fetch tasks
    const Task = mongoose.model('Task');
    const tasks = await Task.find({ project: id })
        .populate('assignedTo', 'fullName email specialization')
        .populate('subtasks.assignedTo', 'fullName email specialization')
        .sort({ createdAt: -1 });

    // Calculate overall progress and developer-specific stats
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    let myTasks = 0;
    let myPendingSubtasks = 0;

    tasks.forEach(task => {
        totalSubtasks += task.subtasks.length;
        completedSubtasks += task.subtasks.filter(st => st.isCompleted).length;

        // Check if task is assigned to this developer
        const isAssignedToTask = task.assignedTo.some(
            dev => dev._id.toString() === userId.toString()
        );

        if (isAssignedToTask) {
            myTasks++;
        }

        // Count pending subtasks assigned to this developer
        task.subtasks.forEach(subtask => {
            const isAssignedToSubtask = subtask.assignedTo &&
                subtask.assignedTo._id &&
                subtask.assignedTo._id.toString() === userId.toString();

            if ((isAssignedToSubtask || isAssignedToTask) && !subtask.isCompleted) {
                myPendingSubtasks++;
            }
        });
    });

    const progress = totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            project: {
                _id: project._id,
                name: project.name,
                description: project.description,
                status: project.status,
                startDate: project.startDate,
                endDate: project.endDate,
                manager: project.manager,
                team: project.team,
                progress
            },
            tasks,
            stats: {
                totalTasks: tasks.length,
                totalSubtasks,
                completedSubtasks,
                myTasks,
                myPendingSubtasks,
                todoTasks: tasks.filter(t => t.status === 'todo').length,
                inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
                doneTasks: tasks.filter(t => t.status === 'done').length
            },
            currentUser: {
                id: userId,
                role: 'developer'
            }
        }, 'Project details retrieved successfully')
    );
})


/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Admin, Owner)
 */
export const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params

    const project = await Project.findById(projectId)
        .populate('manager', 'fullName email')
        .populate('team.user', 'fullName email')

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Check permission: owner or admin
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "Only project owner or admin can delete this project")
    }

    // Calculate team size (manager + team members)
    const teamSize = (project.manager ? 1 : 0) + (project.team?.length || 0)
    const projectName = project.name

    // Delete the project (team members are automatically "freed")
    await project.deleteOne()

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                name: projectName,
                teamSize,
                teamMembers: {
                    manager: project.manager?.fullName || null,
                    developers: project.team?.map(t => t.user.fullName) || []
                }
            },
            `Project "${projectName}" deleted successfully. ${teamSize} team member(s) released.`
        )
    )
})

/**
 * @desc    Add team member to project
 * @route   POST /api/projects/:id/team
 * @access  Private (Admin, Project Manager - Owner)
 */
export const addTeamMember = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { userId, role } = req.body

    if (!userId) {
        throw new ApiError(400, "User ID is required")
    }

    const project = await Project.findById(id)

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Check permission
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "Only project owner or admin can add team members")
    }

    // Check if user already in team
    const alreadyExists = project.team.some(
        member => member.user.toString() === userId
    )

    if (alreadyExists) {
        throw new ApiError(400, "User is already a team member")
    }

    // Add team member
    project.team.push({
        user: userId,
        role: role || 'developer',
        assignedAt: new Date()
    })

    await project.save()
    await project.populate('team.user', 'username email fullName avatar role')

    return res.status(200).json(
        new ApiResponse(200, project, "Team member added successfully")
    )
})


/**
 * @desc    Get project details with populated team for dashboard
 * @route   GET /api/projects/:id/details
 * @access  Private (Admin or Assigned PM only)
 */
export const getProjectDetails = asyncHandler(async (req, res) => {
    const { projectId } = req.params

    // Find project with populated fields
    const project = await Project.findById(projectId)
        .populate('owner', 'fullName email')
        .populate('manager', 'fullName email specialization')
        .populate('team.user', 'fullName email specialization')

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Authorization check: Admin or assigned PM only
    const isAdmin = req.user.role === 'admin'
    const isAssignedPM = req.user.role === 'projectManager' &&
        project.manager._id.toString() === req.user._id.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied. You are not authorized to view this project.")
    }

    // Calculate progress based on status (simple approach for MVP)
    const statusProgress = {
        'planning': 10,
        'active': 50,
        'onHold': 50,
        'completed': 100,
        'cancelled': 0
    }
    const progress = statusProgress[project.status] || 0

    return res.status(200).json(
        new ApiResponse(200, {
            ...project.toObject(),
            progress
        }, "Project details fetched successfully")
    )
})

/**
 * @desc    Get available developers (not assigned to any active project)
 * @route   GET /api/projects/available-developers
 * @access  Private (Admin or PM only)
 */
export const getAvailableDevelopers = asyncHandler(async (req, res) => {
    // Get all developers
    const allDevelopers = await User.find({
        role: 'developer',
        status: { $ne: 'inactive' } // Exclude inactive users
    }).select('fullName email specialization')

    // Get all active/planning/onHold projects
    const activeProjects = await Project.find({
        status: { $nin: ['completed', 'cancelled'] }
    }).select('team')

    // Collect all assigned developer IDs
    const assignedDeveloperIds = new Set()
    activeProjects.forEach(project => {
        project.team.forEach(member => {
            assignedDeveloperIds.add(member.user.toString())
        })
    })

    // Filter to get only available developers
    const availableDevelopers = allDevelopers.filter(
        dev => !assignedDeveloperIds.has(dev._id.toString())
    )

    return res.status(200).json(
        new ApiResponse(200, availableDevelopers, `Found ${availableDevelopers.length} available developer(s)`)
    )
})

/**
 * @desc    Assign developer to project team
 * @route   POST /api/projects/:id/team/assign
 * @access  Private (Admin or Assigned PM only)
 */
export const assignTeamMember = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const { developerId } = req.body

    // Validate developer ID
    if (!developerId) {
        throw new ApiError(400, "Developer ID is required")
    }

    // Find project
    const project = await Project.findById(projectId)

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Authorization check
    const isAdmin = req.user.role === 'admin'
    const isAssignedPM = req.user.role === 'projectManager' &&
        project.manager.toString() === req.user._id.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied. Only project owner or admin can manage team.")
    }

    // Validate developer exists and is a developer
    const developer = await User.findById(developerId)

    if (!developer) {
        throw new ApiError(404, "Developer not found")
    }

    if (developer.role !== 'developer') {
        throw new ApiError(400, "User is not a developer. Cannot assign to project.")
    }

    // Check if already assigned to this project
    const alreadyAssigned = project.team.some(
        member => member.user.toString() === developerId
    )

    if (alreadyAssigned) {
        throw new ApiError(400, "Developer is already assigned to this project")
    }

    // Check if assigned to another active project
    const otherProject = await Project.findOne({
        _id: { $ne: projectId },
        'team.user': developerId,
        status: { $nin: ['completed', 'cancelled'] }
    }).select('name')

    if (otherProject) {
        throw new ApiError(400,
            `Developer is already assigned to project "${otherProject.name}". Please remove them from that project first.`
        )
    }

    // Add developer to team
    project.team.push({
        user: developerId,
        role: 'developer',
        assignedAt: new Date()
    })

    await project.save()

    // Return updated developer info
    const updatedDeveloper = await User.findById(developerId)
        .select('fullName email specialization')

    return res.status(200).json(
        new ApiResponse(200, {
            user: updatedDeveloper,
            role: 'developer',
            assignedAt: new Date()
        }, `${developer.fullName} assigned to project successfully`)
    )
})

/**
 * @desc    Remove developer from project team
 * @route   POST /api/projects/:id/team/remove
 * @access  Private (Admin or Assigned PM only)
 */
export const removeTeamMember = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const { developerId } = req.body

    if (!developerId) {
        throw new ApiError(400, "Developer ID is required")
    }

    const project = await Project.findById(projectId)

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Authorization check
    const isAdmin = req.user.role === 'admin'
    const isAssignedPM = req.user.role === 'projectManager' &&
        project.manager.toString() === req.user._id.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied")
    }

    // Check if developer is in the team
    const memberIndex = project.team.findIndex(
        member => member.user.toString() === developerId
    )

    if (memberIndex === -1) {
        throw new ApiError(400, "Developer is not assigned to this project")
    }

    // Get developer info before removing
    const developer = await User.findById(developerId)
        .select('fullName email specialization')

    // Remove developer from team
    project.team.splice(memberIndex, 1)

    await project.save()

    return res.status(200).json(
        new ApiResponse(200, {
            user: developer,
            role: 'developer'
        }, `${developer.fullName} removed from project successfully`)
    )
})

/**
 * @desc    Update project details
 * @route   PUT /api/projects/:id/details
 * @access  Private (Admin or Assigned PM only)
 */
export const updateProjectDetails = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const { name, description, status, startDate, endDate } = req.body

    const project = await Project.findById(projectId)

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Authorization check
    const isAdmin = req.user.role === 'admin'
    const isAssignedPM = req.user.role === 'projectManager' &&
        project.manager.toString() === req.user._id.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied")
    }

    // Update fields if provided
    if (name) project.name = name
    if (description !== undefined) project.description = description
    if (startDate) project.startDate = startDate
    if (endDate) project.endDate = endDate

    // Handle status change with auto-release logic
    const previousStatus = project.status
    if (status) project.status = status

    let releaseResult = null

    if (status === 'completed' && previousStatus !== 'completed') {
        // Trigger auto-release on completion
        releaseResult = await releaseProjectTeam(project)
    } else if (previousStatus === 'completed' && status && status !== 'completed') {
        // Rollback: project was completed but is now being reactivated
        project.completedAt = null
        await project.save()
    } else {
        await project.save()
    }

    const updatedProject = await Project.findById(projectId)
        .populate('manager', 'fullName email')
        .populate('team.user', 'fullName email specialization')

    // Calculate actual progress from subtasks
    const progress = await calculateProjectProgress(projectId)

    const responseData = {
        ...updatedProject.toObject(),
        progress
    }

    if (releaseResult) {
        responseData.releaseResult = releaseResult
    }

    return res.status(200).json(
        new ApiResponse(200, responseData, 
            releaseResult 
                ? `Project completed — ${releaseResult.releasedMembers.length} member(s) released`
                : "Project updated successfully"
        )
    )
})

/**
 * @desc    Mark project as complete and release team
 * @route   PATCH /api/projects/:projectId/complete
 * @access  Private (Admin or Assigned PM only)
 */
export const completeProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params

    const project = await Project.findById(projectId)
        .populate('manager', 'fullName email')
        .populate('team.user', 'fullName email specialization')

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Authorization check
    const isAdmin = req.user.role === 'admin'
    const isAssignedPM = req.user.role === 'projectManager' &&
        project.manager._id.toString() === req.user._id.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied")
    }

    if (project.status === 'completed') {
        throw new ApiError(400, "Project is already completed")
    }

    if (project.status === 'cancelled') {
        throw new ApiError(400, "Cannot complete a cancelled project")
    }

    // Execute auto-release
    const releaseResult = await releaseProjectTeam(project)
    const progress = await calculateProjectProgress(projectId)

    return res.status(200).json(
        new ApiResponse(200, {
            projectId,
            status: 'completed',
            completedAt: project.completedAt,
            progress,
            ...releaseResult
        }, `Project completed — ${releaseResult.releasedMembers.length} member(s) released`)
    )
})
