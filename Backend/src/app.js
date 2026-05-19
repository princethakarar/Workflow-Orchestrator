import express from "express"
import cors from "cors"
import testRouter from "./routes/Testing.js"
import authRouter from "./routes/Auth_Routes.js"
import projectRouter from "./routes/Project_Routes.js"
import teamRouter from "./routes/team.js"
import workflowRouter from "./routes/Workflow_Routes.js"
import taskRouter from "./routes/taskRoutes.js"
import developerRouter from "./routes/developerRoutes.js"
import analyticsRouter from "./routes/analyticsRoutes.js"
import webhookRouter from "./routes/webhook.js"
import aiRouter from "./routes/aiRoutes.js"
import cookieParser from "cookie-parser"
import { errorMiddleware } from "./middlewares/error_middleware.js"

const app = express()

// Raw body middleware for GitHub webhook signature verification (must come before express.json)
app.use("/api/webhooks/github", express.raw({ type: "application/json" }))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Cookies across subdomains require CORS with an explicit origin and credentials=true.
// FRONTEND_URL can be a single URL or a comma-separated list of origins (no trailing slashes).
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    ...((process.env.FRONTEND_URL || "")
        .split(",")
        .map(url => url.trim().replace(/\/$/, ''))
        .filter(Boolean))
]

app.use(cors({
    origin: (origin, callback) => {
        // Non-browser requests often have no Origin header.
        if (!origin) return callback(null, true)

        if (allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`))
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}))

app.use("/api/v1/test", testRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/team", teamRouter);
app.use("/api/workflows", workflowRouter);
app.use("/api", taskRouter); // Task routes
app.use("/api/developer", developerRouter); // Developer routes
app.use("/api/analytics", analyticsRouter); // Analytics routes
app.use("/api/webhooks", webhookRouter); // GitHub webhook routes
app.use("/api/ai", aiRouter); // AI model routes

app.get("/", (req, res) => {
    res.send("Welcome to Homepage")
});

// Error handling middleware (MUST be last)
app.use(errorMiddleware);

export default app;