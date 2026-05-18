import { Workflow } from "../models/workflowModel.js"
import { Project } from "../models/projectModel.js"
import { Task } from "../models/Task.js"
import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { emitToProject } from "../utils/socket.js"

/**
 * Derive subtask status from subtask data
 */
const getSubtaskStatus = (subtask) => {
    if (subtask.isCompleted) return 'done'
    if (subtask.assignedTo && subtask.assignedTo.length > 0) return 'in-progress'
    return 'todo'
}

/**
 * @desc    Get workflow for a project (merges saved canvas with live subtask data)
 * @route   GET /api/projects/:projectId/workflows
 * @access  Private (Admin, PM, Team members)
 */
export const getWorkflow = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const { role, _id: userId } = req.user

    // Fetch project
    const project = await Project.findById(projectId)
        .populate('manager', 'fullName email')
        .populate('team.user', 'fullName email')

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // Authorization check
    const isAdmin = role === 'admin'
    const isPM = role === 'projectManager' &&
        project.manager._id.toString() === userId.toString()
    const isTeamMember = role === 'developer' &&
        project.team.some(member => member.user._id.toString() === userId.toString())

    if (!isAdmin && !isPM && !isTeamMember) {
        throw new ApiError(403, "Access denied. You are not part of this project.")
    }

    // Fetch all tasks with subtasks for this project
    const tasks = await Task.find({ project: projectId })
        .populate('subtasks.assignedTo', 'fullName email specialization')
        .sort({ createdAt: 1 })

    // Build a flat list of all subtasks with live data
    const allSubtasks = []
    tasks.forEach(task => {
        task.subtasks.forEach(subtask => {
            allSubtasks.push({
                _id: subtask._id.toString(),
                title: subtask.title,
                status: getSubtaskStatus(subtask),
                assignedTo: subtask.assignedTo && subtask.assignedTo.length > 0
                    ? subtask.assignedTo[0]   // first assigned developer for display
                    : null,
                allAssignees: subtask.assignedTo || [],
                isCompleted: subtask.isCompleted,
                taskId: task._id.toString(),
                taskTitle: task.title,
                taskPriority: task.priority
            })
        })
    })

    // Find or auto-create the Workflow document for this project
    let workflow = await Workflow.findOne({ projectId })

    if (!workflow) {
        workflow = await Workflow.create({
            projectId,
            lastUpdatedBy: userId,
            nodes: [],
            edges: []
        })
    }

    const savedNodes = workflow.nodes || []
    const savedEdges = workflow.edges || []

    // Merge saved positions with live subtask data
    // Filter out nodes whose subtasks have been deleted
    const nodes = savedNodes
        .map(savedNode => {
            const liveData = allSubtasks.find(st => st._id === savedNode.id)
            if (!liveData) return null   // subtask was deleted — remove from canvas
            return {
                id: savedNode.id,
                type: 'subtaskNode',
                position: { x: savedNode.position.x, y: savedNode.position.y },
                data: liveData
            }
        })
        .filter(Boolean)

    // Subtasks not yet on canvas
    const canvasNodeIds = new Set(nodes.map(n => n.id))
    const availableSubtasks = allSubtasks.filter(st => !canvasNodeIds.has(st._id))

    return res.status(200).json(
        new ApiResponse(200, {
            project: {
                _id: project._id,
                name: project.name,
                status: project.status,
                description: project.description
            },
            nodes,
            edges: savedEdges,
            availableSubtasks,
            permissions: {
                canEdit: isAdmin || isPM
            }
        }, "Workflow fetched successfully")
    )
})

/**
 * @desc    Save workflow canvas state (positions + edges)
 * @route   PUT /api/projects/:projectId/workflows
 * @access  Private (Admin, PM ONLY)
 */
export const saveWorkflow = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const { nodes, edges, socketId } = req.body
    const { role, _id: userId } = req.user

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        throw new ApiError(400, "nodes and edges must be arrays")
    }

    // Fetch project for auth check
    const project = await Project.findById(projectId)

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    // CRITICAL: only Admin or the assigned PM can save
    const isAdmin = role === 'admin'
    const isPM = role === 'projectManager' &&
        project.manager.toString() === userId.toString()

    if (!isAdmin && !isPM) {
        throw new ApiError(403, "Access denied. Only admin or project manager can save the workflow.")
    }

    // Strip to position-only (don't persist data payload)
    const nodesToSave = nodes.map(node => ({
        id: node.id,
        position: {
            x: node.position?.x ?? 0,
            y: node.position?.y ?? 0
        }
    }))

    const edgesToSave = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'smoothstep'
    }))

    // Upsert workflow
    const workflow = await Workflow.findOneAndUpdate(
        { projectId },
        {
            $set: {
                nodes: nodesToSave,
                edges: edgesToSave,
                lastUpdatedBy: userId
            }
        },
        { new: true, upsert: true, runValidators: true }
    )

    // Emit real-time update to other tabs/users in the project room
    // Exclude the sender's socket so their own tab doesn't re-trigger a fetch
    emitToProject(projectId, "workflow-updated", {
        projectId,
        userId
    }, socketId);

    return res.status(200).json(
        new ApiResponse(200, {
            nodeCount: nodesToSave.length,
            edgeCount: edgesToSave.length,
            updatedAt: workflow.updatedAt
        }, "Workflow saved successfully")
    )
})

/**
 * @desc    Delete entire workflow (reset canvas)
 * @route   DELETE /api/projects/:projectId/workflows
 * @access  Private (Admin, PM)
 */
export const deleteWorkflow = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const { role, _id: userId } = req.user

    const project = await Project.findById(projectId)

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    const isAdmin = role === 'admin'
    const isPM = role === 'projectManager' &&
        project.manager.toString() === userId.toString()

    if (!isAdmin && !isPM) {
        throw new ApiError(403, "Access denied. Only admin or project manager can reset the workflow.")
    }

    await Workflow.findOneAndDelete({ projectId })

    // Emit real-time update to other tabs/users in the project room
    const { socketId } = req.body || {}
    emitToProject(projectId, "workflow-updated", {
        projectId,
        userId
    }, socketId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Workflow reset successfully")
    )
})
