import express from "express"
import {
    getProjectTasks,
    createTask,
    createSubtask,
    assignDevelopersToTask,
    removeDeveloperFromTask,
    assignDevelopersToSubtask,
    removeDeveloperFromSubtask,
    toggleSubtaskCompletion,
    deleteTask,
    deleteSubtask,
    bulkCreateTasks
} from "../controllers/taskController.js"
import { verifyJWT } from "../middlewares/auth_middleware.js"

const router = express.Router()

// All routes require authentication
router.use(verifyJWT)

// Project tasks (accessible by team members for read, PM/Admin for write)
router.get('/projects/:projectId/tasks', getProjectTasks)
router.post('/projects/:projectId/tasks', createTask) // PM/Admin only (checked in controller)
router.post('/projects/:projectId/tasks/bulk', bulkCreateTasks) // PM/Admin only

// Task-level assignment
router.patch('/tasks/:taskId/assign', assignDevelopersToTask) // PM/Admin only
router.patch('/tasks/:taskId/unassign/:developerId', removeDeveloperFromTask) // PM/Admin only

// Task operations
router.delete('/tasks/:taskId', deleteTask) // PM/Admin only

// Subtask operations
router.post('/tasks/:taskId/subtasks', createSubtask) // PM/Admin only
router.delete('/tasks/:taskId/subtasks/:subtaskId', deleteSubtask) // PM/Admin only

// Subtask assignment
router.patch('/tasks/:taskId/subtasks/:subtaskId/assign', assignDevelopersToSubtask) // PM/Admin only
router.patch('/tasks/:taskId/subtasks/:subtaskId/unassign/:developerId', removeDeveloperFromSubtask) // PM/Admin only
router.patch('/tasks/:taskId/subtasks/:subtaskId/toggle', toggleSubtaskCompletion) // PM/Admin/Assigned Dev

export default router
