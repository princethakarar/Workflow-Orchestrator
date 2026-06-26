/**
 * Brevo (Sendinblue) Transactional Email Service
 *
 * Stateless HTTP-based email sending — no persistent SMTP connections.
 * Compatible with Vercel serverless and Render environments.
 *
 * Uses @getbrevo/brevo v5 SDK (BrevoClient API).
 */

import { BrevoClient } from "@getbrevo/brevo"
import { logger } from "./logger.js"

// ── Lazy Brevo client ──────────────────────────────────────────────────────
// Created on first use so dotenv.config() has loaded env vars by then.
let _brevoClient = null

function getBrevoClient() {
    if (!_brevoClient) {
        if (!process.env.BREVO_API_KEY) {
            throw new Error("BREVO_API_KEY is not set in environment variables")
        }
        _brevoClient = new BrevoClient({ apiKey: process.env.BREVO_API_KEY })
    }
    return _brevoClient
}

/**
 * Send a transactional email via Brevo API.
 *
 * @param {Object}  options
 * @param {string}  options.to          - Recipient email address
 * @param {string}  options.subject     - Email subject line
 * @param {string}  options.htmlContent - Full HTML body (inline CSS)
 * @param {string}  [options.textContent] - Optional plain-text fallback
 * @returns {Promise<Object>} Brevo API response ({ messageId })
 */
const sendEmail = async ({ to, subject, htmlContent, textContent }) => {
    const brevo = getBrevoClient()

    const emailPayload = {
        sender: {
            email: process.env.BREVO_SENDER_EMAIL || "noreply@workfloworchestrator.com",
            name: process.env.BREVO_SENDER_NAME || "Workflow Orchestrator",
        },
        to: [{ email: to }],
        subject,
        htmlContent,
    }

    if (textContent) {
        emailPayload.textContent = textContent
    }

    try {
        const response = await brevo.transactionalEmails.sendTransacEmail(emailPayload)
        logger.info(`✅ Email sent via Brevo to ${to} | messageId: ${response?.messageId || "OK"}`)
        return response
    } catch (error) {
        const errBody = error?.body || error?.message || error
        logger.error(`❌ Brevo email failed (to: ${to}, subject: "${subject}")`)
        logger.error("   Error details:", errBody)
        throw error // Re-throw so callers can handle it
    }
}

export { sendEmail }
