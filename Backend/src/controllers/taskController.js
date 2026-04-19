import { Task } from "../models/Task.js"
import { Project } from "../models/projectModel.js"
import { User } from "../models/userModel.js"
import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { createIssue, closeIssue, reopenIssue, deleteIssue } from "../services/githubService.js"
import { checkAndAutoCompleteProject } from "../services/projectCompletionService.js"

/**
 * @desc    Get all tasks for a project
 * @route   GET /api/projects/:projectId/tasks
 * @access  Private (Team members can read, PM/Admin can edit)
 */
export const getProjectTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const { role, _id: userId } = req.user

    // Verify project exists
    const project = await Project.findById(projectId)

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Authorization check
    const isAdmin = role === 'admin'
    const isAssignedPM = role === 'projectManager' &&
        project.manager.toString() === userId.toString()
    const isTeamMember = role === 'developer' &&
        project.team.some(member => member.user.toString() === userId.toString())

    if (!isAdmin && !isAssignedPM && !isTeamMember) {
        throw new ApiError(403, "Access denied. You are not part of this project.")
    }

    // Fetch tasks with populated assignees
    const tasks = await Task.find({ project: projectId })
        .populate('assignedTo', 'fullName email specialization') // Task-level assignees
        .populate('subtasks.assignedTo', 'fullName email specialization') // Subtask-level assignees
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })

    // Calculate overall progress
    let totalSubtasks = 0
    let completedSubtasks = 0

    tasks.forEach(task => {
        totalSubtasks += task.subtasks.length
        completedSubtasks += task.subtasks.filter(st => st.isCompleted).length
    })

    const progress = totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0

    return res.status(200).json(
        new ApiResponse(200, tasks, "Tasks fetched successfully", {
            count: tasks.length,
            progress,
            stats: {
                totalTasks: tasks.length,
                totalSubtasks,
                completedSubtasks,
                todoTasks: tasks.filter(t => t.status === 'todo').length,
                inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
                doneTasks: tasks.filter(t => t.status === 'done').length
            },
            canEdit: isAdmin || isAssignedPM
        })
    )
})

/**
 * @desc    Create new task
 * @route   POST /api/projects/:projectId/tasks
 * @access  Private (Admin, PM only)
 */
export const createTask = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const { title, description, priority, deadline, githubSyncEnabled } = req.body
    const { role, _id: userId } = req.user

    if (!title || title.trim() === '') {
        throw new ApiError(400, "Task title is required")
    }

    // Verify project exists
    const project = await Project.findById(projectId)

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Authorization check: Only Admin or assigned PM
    const isAdmin = role === 'admin'
    const isAssignedPM = role === 'projectManager' &&
        project.manager.toString() === userId.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied. Only admin or project manager can create tasks.")
    }

    // Create task
    const task = await Task.create({
        project: projectId,
        title: title.trim(),
        description: description?.trim() || '',
        priority: priority || 'medium',
        deadline,
        createdBy: userId,
        assignedTo: [],
        subtasks: [],
        githubSyncEnabled: githubSyncEnabled !== false
    })

    // GitHub Issues sync: create issue if sync is enabled
    if (task.githubSyncEnabled !== false) {
        try {
            const { issueNumber, issueUrl, issueNodeId } = await createIssue(task)
            task.githubIssueNumber = issueNumber
            task.githubIssueUrl = issueUrl
            task.githubIssueNodeId = issueNodeId
            task.lastSyncedAt = new Date()
            await task.save()
        } catch (githubErr) {
            // Don't fail the whole request if GitHub sync fails
            console.error("GitHub sync failed on create:", githubErr.message)
        }
    }

    return res.status(201).json(
        new ApiResponse(201, task, "Task created successfully")
    )
})

/**
 * @desc    Create subtask
 * @route   POST /api/tasks/:taskId/subtasks
 * @access  Private (Admin, PM only)
 */
export const createSubtask = asyncHandler(async (req, res) => {
    const { taskId } = req.params
    const { title } = req.body
    const { role, _id: userId } = req.user

    if (!title || title.trim() === '') {
        throw new ApiError(400, "Subtask title is required")
    }

    const task = await Task.findById(taskId).populate('project')

    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    // Authorization check
    const isAdmin = role === 'admin'
    const isAssignedPM = role === 'projectManager' &&
        task.project.manager.toString() === userId.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied")
    }

    // Clear task-level assignees when first subtask is added
    if (task.subtasks.length === 0 && task.assignedTo.length > 0) {
        task.assignedTo = []
    }

    // Add subtask
    task.subtasks.push({
        title: title.trim(),
        isCompleted: false,
        assignedTo: []
    })

    await task.save()

    // Populate for response
    await task.populate('subtasks.assignedTo', 'fullName email specialization')

    return res.status(200).json(
        new ApiResponse(200, task, "Subtask created successfully")
    )
})

/**
 * @desc    Assign developers to task (task-level, only if NO subtasks)
 * @route   PATCH /api/tasks/:taskId/assign
 * @access  Private (Admin, PM only)
 */
export const assignDevelopersToTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params
    const { developerIds } = req.body
    const { role, _id: userId } = req.user

    if (!developerIds || !Array.isArray(developerIds) || developerIds.length === 0) {
        throw new ApiError(400, "Developer IDs array is required")
    }

    const task = await Task.findById(taskId).populate('project')

    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    // Check if task has subtasks
    if (task.subtasks.length > 0) {
        throw new ApiError(400, "Cannot assign developers to task level when subtasks exist. Please assign to individual subtasks.")
    }

    // Authorization check
    const isAdmin = role === 'admin'
    const isAssignedPM = role === 'projectManager' &&
        task.project.manager.toString() === userId.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied")
    }

    // Verify all developers exist and are on the project team
    const developers = await User.find({
        _id: { $in: developerIds },
        role: 'developer'
    })

    if (developers.length !== developerIds.length) {
        throw new ApiError(400, "One or more invalid developer IDs provided")
    }

    // Check if all developers are on the project team
    const projectTeamIds = task.project.team.map(member => member.user.toString())
    const invalidDevelopers = developers.filter(dev =>
        !projectTeamIds.includes(dev._id.toString())
    )

    if (invalidDevelopers.length > 0) {
        throw new ApiError(400,
            `The following developers are not on the project team: ${invalidDevelopers.map(d => d.fullName).join(', ')}`
        )
    }

    // Assign developers to task
    task.assignedTo = developerIds
    await task.save()

    // Populate for response
    await task.populate('assignedTo', 'fullName email specialization')

    return res.status(200).json(
        new ApiResponse(200, task, `${developers.length} developer(s) assigned to task`)
    )
})

/**
 * @desc    Remove developer from task (task-level)
 * @route   PATCH /api/tasks/:taskId/unassign/:developerId
 * @access  Private (Admin, PM only)
 */
export const removeDeveloperFromTask = asyncHandler(async (req, res) => {
    const { taskId, developerId } = req.params
    const { role, _id: userId } = req.user

    const task = await Task.findById(taskId).populate('project')

    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    // Authorization check
    const isAdmin = role === 'admin'
    const isAssignedPM = role === 'projectManager' &&
        task.project.manager.toString() === userId.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied")
    }

    // Remove developer from assignedTo array
    task.assignedTo = task.assignedTo.filter(
        id => id.toString() !== developerId
    )

    await task.save()

    return res.status(200).json(
        new ApiResponse(200, task, "Developer removed from task")
    )
})

/**
 * @desc    Assign developers to subtask (subtask-level, multiple devs)
 * @route   PATCH /api/tasks/:taskId/subtasks/:subtaskId/assign
 * @access  Private (Admin, PM only)
 */
export const assignDevelopersToSubtask = asyncHandler(async (req, res) => {
    const { taskId, subtaskId } = req.params
    const { developerIds } = req.body
    const { role, _id: userId } = req.user

    if (!developerIds || !Array.isArray(developerIds) || developerIds.length === 0) {
        throw new ApiError(400, "Developer IDs array is required")
    }

    const task = await Task.findById(taskId).populate('project')

    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    const subtask = task.subtasks.id(subtaskId)

    if (!subtask) {
        throw new ApiError(404, "Subtask not found")
    }

    // Authorization check
    const isAdmin = role === 'admin'
    const isAssignedPM = role === 'projectManager' &&
        task.project.manager.toString() === userId.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied")
    }

    // Verify all developers exist and are on the project team
    const developers = await User.find({
        _id: { $in: developerIds },
        role: 'developer'
    })

    if (developers.length !== developerIds.length) {
        throw new ApiError(400, "One or more invalid developer IDs provided")
    }

    const projectTeamIds = task.project.team.map(member => member.user.toString())
    const invalidDevelopers = developers.filter(dev =>
        !projectTeamIds.includes(dev._id.toString())
    )

    if (invalidDevelopers.length > 0) {
        throw new ApiError(400,
            `The following developers are not on the project team: ${invalidDevelopers.map(d => d.fullName).join(', ')}`
        )
    }

    // Assign developers to subtask (replace existing)
    subtask.assignedTo = developerIds

    await task.save()

    // Populate for response
    await task.populate('subtasks.assignedTo', 'fullName email specialization')

    return res.status(200).json(
        new ApiResponse(200, task, `${developers.length} developer(s) assigned to subtask`)
    )
})

/**
 * @desc    Remove developer from subtask
 * @route   PATCH /api/tasks/:taskId/subtasks/:subtaskId/unassign/:developerId
 * @access  Private (Admin, PM only)
 */
export const removeDeveloperFromSubtask = asyncHandler(async (req, res) => {
    const { taskId, subtaskId, developerId } = req.params
    const { role, _id: userId } = req.user

    const task = await Task.findById(taskId).populate('project')

    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    const subtask = task.subtasks.id(subtaskId)

    if (!subtask) {
        throw new ApiError(404, "Subtask not found")
    }

    // Authorization check
    const isAdmin = role === 'admin'
    const isAssignedPM = role === 'projectManager' &&
        task.project.manager.toString() === userId.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied")
    }

    // Remove developer from subtask assignedTo array
    subtask.assignedTo = subtask.assignedTo.filter(
        id => id.toString() !== developerId
    )

    await task.save()

    return res.status(200).json(
        new ApiResponse(200, task, "Developer removed from subtask")
    )
})

/**
 * @desc    Toggle subtask completion status
 * @route   PATCH /api/tasks/:taskId/subtasks/:subtaskId/toggle
 * @access  Private (Admin, PM, or assigned developer)
 */
export const toggleSubtaskCompletion = asyncHandler(async (req, res) => {
    const { taskId, subtaskId } = req.params
    const { role, _id: userId } = req.user

    const task = await Task.findById(taskId).populate('project')

    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    const subtask = task.subtasks.id(subtaskId)

    if (!subtask) {
        throw new ApiError(404, "Subtask not found")
    }

    // Authorization check: Admin, PM, or assigned developer
    const isAdmin = role === 'admin'
    const isAssignedPM = role === 'projectManager' &&
        task.project.manager.toString() === userId.toString()
    const isAssignedToSubtask = subtask.assignedTo.some(
        assigneeId => assigneeId.toString() === userId.toString()
    )

    if (!isAdmin && !isAssignedPM && !isAssignedToSubtask) {
        throw new ApiError(403, "Access denied. Only the assigned developer, PM, or admin can toggle completion.")
    }

    // Capture status before toggle for comparison
    const previousStatus = task.status

    // Toggle completion
    subtask.isCompleted = !subtask.isCompleted
    subtask.completedAt = subtask.isCompleted ? new Date() : null
    subtask.completedBy = subtask.isCompleted ? userId : null

    await task.save() // This will auto-update task status via pre-save hook

    // GitHub Issues sync: close/reopen issue based on status change
    if (task.githubIssueNumber) {
        try {
            if (task.status === 'done' && previousStatus !== 'done') {
                await closeIssue(task.githubIssueNumber)
                task.lastSyncedAt = new Date()
                await task.save()
            } else if (previousStatus === 'done' && task.status !== 'done') {
                await reopenIssue(task.githubIssueNumber)
                task.lastSyncedAt = new Date()
                await task.save()
            }
        } catch (githubErr) {
            console.error("GitHub sync failed on toggle:", githubErr.message)
        }
    }

    // Check if project should auto-complete at 100% progress
    let autoCompleteResult = null
    if (subtask.isCompleted) {
        autoCompleteResult = await checkAndAutoCompleteProject(task.project._id || task.project)
    }

    return res.status(200).json(
        new ApiResponse(200, {
            task,
            ...(autoCompleteResult ? { projectCompleted: autoCompleteResult } : {})
        }, autoCompleteResult
            ? `Subtask completed — Project auto-completed! ${autoCompleteResult.releasedMembers.length} member(s) released`
            : `Subtask marked as ${subtask.isCompleted ? 'completed' : 'incomplete'}`
        )
    )
})

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:taskId
 * @access  Private (Admin, PM only)
 */
export const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params
    const { role, _id: userId } = req.user

    const task = await Task.findById(taskId).populate('project')

    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    // Authorization check
    const isAdmin = role === 'admin'
    const isAssignedPM = role === 'projectManager' &&
        task.project.manager.toString() === userId.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied")
    }

    // Permanently delete linked GitHub issue via GraphQL
    if (task.githubIssueNodeId) {
        try {
            await deleteIssue(task.githubIssueNodeId)
        } catch (githubErr) {
            console.error("GitHub issue deletion failed:", githubErr.message)
        }
    }

    await task.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, { taskId }, "Task deleted successfully")
    )
})

/**
 * @desc    Delete subtask
 * @route   DELETE /api/tasks/:taskId/subtasks/:subtaskId
 * @access  Private (Admin, PM only)
 */
export const deleteSubtask = asyncHandler(async (req, res) => {
    const { taskId, subtaskId } = req.params
    const { role, _id: userId } = req.user

    const task = await Task.findById(taskId).populate('project')

    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    const subtask = task.subtasks.id(subtaskId)

    if (!subtask) {
        throw new ApiError(404, "Subtask not found")
    }

    // Authorization check
    const isAdmin = role === 'admin'
    const isAssignedPM = role === 'projectManager' &&
        task.project.manager.toString() === userId.toString()

    if (!isAdmin && !isAssignedPM) {
        throw new ApiError(403, "Access denied")
    }

    // Remove subtask using Mongoose subdocument remove
    subtask.deleteOne()

    await task.save()

    return res.status(200).json(
        new ApiResponse(200, task, "Subtask deleted successfully")
    )
})

/**
 * @desc    Toggle subtask completion (for developers - own subtasks only)
 * @route   PATCH /api/developer/tasks/:taskId/subtasks/:subtaskId/toggle
 * @access  Assigned Developer ONLY
 */
export const toggleSubtaskForDeveloper = asyncHandler(async (req, res) => {
    const { taskId, subtaskId } = req.params;
    const { role, _id: userId } = req.user;

    // CRITICAL: Only developers can use this endpoint
    if (role !== 'developer') {
        throw new ApiError(403, 'This endpoint is for developers only.');
    }

    const task = await Task.findById(taskId).populate('project');

    if (!task) {
        throw new ApiError(404, 'Task not found');
    }

    // Verify developer is on the project team
    const isTeamMember = task.project.team.some(
        member => member.user.toString() === userId.toString()
    );

    if (!isTeamMember) {
        throw new ApiError(403, 'Access denied. You are not on this project team.');
    }

    const subtask = task.subtasks.id(subtaskId);

    if (!subtask) {
        throw new ApiError(404, 'Subtask not found');
    }

    // CRITICAL: Developer can ONLY toggle if assigned
    const isAssignedToSubtask = subtask.assignedTo &&
        subtask.assignedTo.toString() === userId.toString();

    const isAssignedToTask = task.assignedTo.some(
        dev => dev.toString() === userId.toString()
    );

    if (!isAssignedToSubtask && !isAssignedToTask) {
        throw new ApiError(403, 'Access denied. This subtask is not assigned to you.');
    }

    // Toggle completion
    subtask.isCompleted = !subtask.isCompleted;
    subtask.completedAt = subtask.isCompleted ? new Date() : null;
    subtask.completedBy = subtask.isCompleted ? userId : null;

    await task.save();

    // Check if project should auto-complete at 100% progress
    let autoCompleteResult = null;
    if (subtask.isCompleted) {
        autoCompleteResult = await checkAndAutoCompleteProject(task.project._id || task.project);
    }

    return res.status(200).json(
        new ApiResponse(200, {
            taskId: task._id,
            subtaskId: subtask._id,
            isCompleted: subtask.isCompleted,
            ...(autoCompleteResult ? { projectCompleted: autoCompleteResult } : {})
        }, autoCompleteResult
            ? `Subtask completed — Project auto-completed! ${autoCompleteResult.releasedMembers.length} member(s) released`
            : `Subtask marked as ${subtask.isCompleted ? 'completed' : 'incomplete'}`
        )
    );
})

/**
 * @desc    Bulk create tasks with subtasks and dependencies (Used by AI Task Generator)
 * @route   POST /api/projects/:projectId/tasks/bulk
 * @access  Private (Admin, PM only)
 */
export const bulkCreateTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { tasks } = req.body; // Array of flattened AI-generated tasks
    const { role, _id: userId } = req.user;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        throw new ApiError(400, "Tasks array is required");
    }

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const isAdmin      = role === 'admin';
    const isAssignedPM = role === 'projectManager' && project.manager &&
        project.manager.toString() === userId.toString();
    const isProjectOwner = project.owner && project.owner.toString() === userId.toString();

    if (!isAdmin && !isAssignedPM && !isProjectOwner) {
        throw new ApiError(403, "Access denied. Only admin, project manager, or project owner can save tasks.");
    }

    // ── Pass 1: create all tasks (without dependencies), build name→_id map ──
    const nameMap = new Map();  // task title → Mongoose _id
    const idMap   = new Map();  // numeric id  → Mongoose _id  (legacy fallback)
    const createdTasks = [];

    for (const t of tasks) {
        // Resolve optional assignedTo (must be a valid 24-char ObjectId string)
        const assignedToArray = [];
        if (t.assignedTo && typeof t.assignedTo === 'string' && t.assignedTo !== 'unspecified') {
            if (t.assignedTo.length === 24) assignedToArray.push(t.assignedTo);
        }

        // Map subtask strings or { title } objects → embedded subdocs
        const subtaskDocs = Array.isArray(t.subtasks)
            ? t.subtasks
                .map(s => (typeof s === 'string' ? { title: s.trim() } : { title: (s.title || '').trim() }))
                .filter(s => s.title.length > 0)
            : [];

        const newTask = await Task.create({
            project:          projectId,
            title:            t.title || t.task || 'Untitled Task',
            description:      t.description || '',
            priority:         ['low', 'medium', 'high'].includes((t.priority || '').toLowerCase())
                                ? t.priority.toLowerCase()
                                : 'medium',
            deadline:         t.deadline && t.deadline !== 'unspecified' ? new Date(t.deadline) : null,
            createdBy:        userId,
            assignedTo:       assignedToArray,
            subtasks:         subtaskDocs,
            dependencies:     [],   // resolved in pass 2
            githubSyncEnabled: false,
        });

        createdTasks.push(newTask);

        // Register by title (new format) and by numeric id (old format)
        const title = (t.title || t.task || '').trim();
        if (title) nameMap.set(title.toLowerCase(), newTask._id);
        if (t.id != null) idMap.set(t.id, newTask._id);
    }

    // ── Pass 2: resolve dependencies ──────────────────────────────────────────
    for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        if (!Array.isArray(t.dependencies) || t.dependencies.length === 0) continue;

        const resolved = [];
        for (const dep of t.dependencies) {
            if (typeof dep === 'string') {
                // Name-based resolution (new format)
                const mongoId = nameMap.get(dep.trim().toLowerCase());
                if (mongoId) resolved.push(mongoId);
            } else if (typeof dep === 'number' || typeof dep === 'string') {
                // Numeric id fallback (old format)
                const mongoId = idMap.get(dep);
                if (mongoId) resolved.push(mongoId);
            }
        }

        if (resolved.length > 0) {
            createdTasks[i].dependencies = resolved;
            await createdTasks[i].save();
        }
    }

    return res.status(201).json(
        new ApiResponse(201, createdTasks, `${createdTasks.length} AI tasks created successfully.`)
    );
});

