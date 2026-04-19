import express from "express"
import crypto from "crypto"
import { Task } from "../models/Task.js"

const router = express.Router()

/**
 * Verify that the webhook actually came from GitHub
 * using the shared secret and x-hub-signature-256 header
 */
const verifyGithubSignature = (req) => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET
    if (!secret) return false

    const signature = req.headers["x-hub-signature-256"]
    if (!signature) return false

    const hmac = crypto.createHmac("sha256", secret)
    const digest = "sha256=" + hmac.update(req.body).digest("hex")

    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(digest)
        )
    } catch {
        return false
    }
}

/**
 * @desc    Handle GitHub webhook events for issue sync
 * @route   POST /api/webhooks/github
 * @access  Public (verified via signature)
 */
router.post("/github", async (req, res) => {
    // Verify signature
    if (!verifyGithubSignature(req)) {
        return res.status(401).json({ message: "Invalid signature" })
    }

    // Parse the raw body into JSON
    let payload
    try {
        payload = JSON.parse(req.body)
    } catch {
        return res.status(400).json({ message: "Invalid JSON payload" })
    }

    const { action, issue } = payload
    if (!issue) return res.status(200).json({ message: "Not an issue event" })

    try {
        // Find the task linked to this GitHub issue number
        const task = await Task.findOne({ githubIssueNumber: issue.number })
        if (!task) return res.status(200).json({ message: "No linked task found" })

        // Handle different GitHub actions
        if (action === "edited") {
            // Someone edited the issue title on GitHub — update task title
            const newTitle = issue.title.replace("[Task] ", "").trim()
            task.title = newTitle
            task.lastSyncedAt = new Date()
            await task.save()
        }

        if (action === "closed") {
            // Someone closed the issue on GitHub — mark task as done
            task.status = "done"
            task.lastSyncedAt = new Date()
            await task.save()
        }

        if (action === "reopened") {
            // Someone reopened the issue on GitHub — set task back to todo
            task.status = "todo"
            task.lastSyncedAt = new Date()
            await task.save()
        }

        if (action === "labeled") {
            // Sync label changes timestamp
            task.lastSyncedAt = new Date()
            await task.save()
        }

        res.status(200).json({ success: true, action })
    } catch (err) {
        console.error("Webhook error:", err)
        res.status(500).json({ error: err.message })
    }
})

export default router
