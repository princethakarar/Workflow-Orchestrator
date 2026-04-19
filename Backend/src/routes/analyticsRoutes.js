import { Router } from "express"
import { getAdminAnalytics, getManagerAnalytics, getDeveloperAnalytics } from "../controllers/analyticsController.js"
import { verifyJWT, authorize } from "../middlewares/auth_middleware.js"

const analyticsRouter = Router()

// All analytics routes require authentication
analyticsRouter.use(verifyJWT)

analyticsRouter.get('/admin', authorize('admin'), getAdminAnalytics)
analyticsRouter.get('/manager', authorize('projectManager'), getManagerAnalytics)
analyticsRouter.get('/developer', authorize('developer'), getDeveloperAnalytics)

export default analyticsRouter
