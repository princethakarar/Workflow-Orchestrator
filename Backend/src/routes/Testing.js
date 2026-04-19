import { Router } from "express";
import { healthCheck } from "../controllers/Testing.js";

const router = Router()

router.route("/").get(healthCheck)

export default router