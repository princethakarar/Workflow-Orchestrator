import { Router } from "express"
import {
    getWorkflow,
    saveWorkflow,
    deleteWorkflow
} from "../controllers/workflowController.js"
import { verifyJWT } from "../middlewares/auth_middleware.js"

const router = Router({ mergeParams: true }) // access :projectId from parent router

// Apply auth middleware to all routes
router.use(verifyJWT)

/**
 * @route   GET  /api/projects/:projectId/workflows  → getWorkflow
 * @route   PUT  /api/projects/:projectId/workflows  → saveWorkflow
 * @route   DELETE /api/projects/:projectId/workflows → deleteWorkflow (reset)
 */
router
    .route("/")
    .get(getWorkflow)
    .put(saveWorkflow)
    .delete(deleteWorkflow)

export default router
