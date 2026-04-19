import { Router } from "express";
import {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectDetails,
    getAvailableDevelopers,
    assignTeamMember,
    removeTeamMember,
    updateProjectDetails,
    completeProject
} from "../controllers/projectController.js";
import { validate } from "../middlewares/validator_middleware.js";
import { createProjectValidator, addMemberToProjectValidator } from "../validators/index.js";
import { verifyJWT, validateProjectPermission } from "../middlewares/auth_middleware.js";
import { checkAdmin } from "../middlewares/checkRole.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";
import workflowRoutes from "./Workflow_Routes.js"

const router = Router()

router.use(verifyJWT)                   // middleware

router
    .route("/")
    .get(getAllProjects)
    .post(
        checkAdmin,                      // Only admin can create projects
        createProjectValidator(),
        validate,
        createProject
    )

// IMPORTANT: Specific routes must come BEFORE parameterized routes
// Otherwise Express will match /:projectId first

// Get available developers (specific route - must come before /:projectId)
router.get(
    "/available-developers",
    getAvailableDevelopers
)

// Generic /:projectId routes
router
    .route("/:projectId")
    .get(
        validateProjectPermission(AvailableUserRole),
        getProjectById
    )
    .put(                               // for updating
        validateProjectPermission([UserRolesEnum.ADMIN]),
        createProjectValidator(),
        validate,
        updateProject
    )
    .delete(
        validateProjectPermission([UserRolesEnum.ADMIN]),
        deleteProject
    )

// Project Dashboard & Team Management Routes (with :projectId param)
router.get(
    "/:projectId/details",
    getProjectDetails
)

router.post(
    "/:projectId/team/assign",
    assignTeamMember
)

router.post(
    "/:projectId/team/remove",
    removeTeamMember
)

router.put(
    "/:projectId/details",
    updateProjectDetails
)

router.patch(
    "/:projectId/complete",
    completeProject
)

// Nested workflow routes
router.use("/:projectId/workflows", workflowRoutes)

export default router