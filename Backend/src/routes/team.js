import { Router } from "express"
import { verifyJWT } from "../middlewares/auth_middleware.js"
import { checkAdmin, checkRole } from "../middlewares/checkRole.js"
import { inviteLimiter } from "../middlewares/rateLimiter.js"
import {
    inviteMember,
    getTeam,
    updateMemberStatus,
    deleteTeamMember,
    resendInvitation,
    updateTeamMember,
    getProjectManagers
} from "../controllers/teamController.js"

const router = Router()

// All routes require authentication
router.use(verifyJWT)

// Routes accessible to all authenticated users (for project creation)
router.get("/project-managers", getProjectManagers)

// Routes accessible only to Admins
router.post("/invite", checkAdmin, inviteLimiter, inviteMember)  // Only admin can invite
router.get("/", checkRole(['admin', 'projectManager']), getTeam)  // Both admin and PM can view team
router.patch("/:id", checkAdmin, updateTeamMember)  // Only admin can edit team members
router.patch("/:id/status", checkAdmin, updateMemberStatus)
router.delete("/:id", checkAdmin, deleteTeamMember)
router.post("/:id/resend", checkAdmin, inviteLimiter, resendInvitation)


export default router
