import Mailgen from "mailgen"
import nodemailer from "nodemailer"

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Work Flow Orchestrator",
            link: "https://google.com"
        }
    })

    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)
    const emailHTML = mailGenerator.generate(options.mailgenContent)

    // Option A: Use Resend REST API if RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY) {
        // IMPORTANT: Resend requires a verified domain for 'from' address.
        // Use RESEND_FROM_ADDRESS (or default to Resend's sandbox sender).
        // Do NOT use a Gmail/Yahoo/Hotmail address — Resend will reject it.
        const fromAddress = process.env.RESEND_FROM_ADDRESS || "onboarding@resend.dev"
        console.log(`📨 Attempting to send email via Resend REST API (from: ${fromAddress}, to: ${options.email})...`)
        try {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from: fromAddress,
                    to: options.email,
                    subject: options.subject,
                    html: emailHTML,
                    text: emailTextual
                })
            })

            const data = await res.json()

            if (!res.ok) {
                console.error("❌ Resend API error response:", JSON.stringify(data, null, 2))
                throw new Error(data.message || data.error?.message || JSON.stringify(data))
            }

            console.log("✅ Email sent successfully via Resend API:", data.id)
            return data
        } catch (error) {
            console.error("❌ Resend REST API failed:", error.message)
            console.log("🔄 Falling back to SMTP configuration...")
        }
    }

    // Option B: Fallback to Nodemailer SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Log SMTP configuration for debugging (without exposing full password)
        console.log("📧 SMTP Config:", {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            user: process.env.SMTP_USER,
            passExists: !!process.env.SMTP_PASS,
        })

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 10000,  // 10s — fail fast if port is blocked
            greetingTimeout: 10000,    // 10s — fail fast if SMTP server doesn't respond
            socketTimeout: 10000       // 10s — fail fast if connection stalls mid-send
        })

        const mail = {
            from: process.env.MAIL_FROM_ADDRESS || "noreply@workfloworchestrator.com",
            to: options.email,
            subject: options.subject,
            text: emailTextual,
            html: emailHTML
        }

        try {
            console.log(`📨 Attempting to send email via SMTP to: ${options.email}`)
            const info = await transporter.sendMail(mail)
            console.log("✅ Email sent successfully via SMTP:", info.messageId)
            return info
        } catch (error) {
            console.error("❌ Nodemailer SMTP service failed.")
            console.error("📋 Error details:", {
                message: error.message,
                code: error.code,
                command: error.command
            })
        }
    }

    // Option C: Absolute fallback to console logging
    console.warn("⚠️ No active or functioning email transport is configured.")
    console.log("\n==================================================")
    console.log("⚠️  EMAIL DELIVERY FALLBACK LOG (NO EMAIL SENT)  ⚠️")
    console.log(`Recipient: ${options.email}`)
    console.log(`Subject:   ${options.subject}`)
    console.log("--------------------------------------------------")
    console.log("Plain text content:")
    console.log(emailTextual)
    console.log("==================================================\n")

    return {
        messageId: `mock_${Date.now()}`,
        fallbackUsed: true,
        recipient: options.email
    }
}

const emailVerificationMailgenContent = (username, otp) => {
    return {
        body: {
            name: username,
            intro: "Welcome to WorkFlow-Orchestrator! Here is your One Time Password (OTP)",
            action: {
                instructions: "To verify your email please use the following code:",
                button: {
                    color: '#22BC66',
                    text: otp,
                    link: "#"
                }
            },
        },
        outro: "Need help or have questions? Just reply to this email, We'd love to help"
    }
}

const forgotPasswordMailgenContent = (username, otp) => {
    return {
        body: {
            name: username,
            intro: "We received a request to reset your Workflow Orchestrator account password.",
            action: {
                instructions: "To reset your password, please use the following OTP (valid for 1 minute):",
                button: {
                    color: '#22BC66',
                    text: otp,
                    link: "#" // No link, just visual display
                }
            },
        },
        outro: "If you did not request a password reset, please ignore this email. Need help? Just reply to this mail, we'd love to help!"
    }
}

/**
 * Generate email content for team member invitation
 * @param {string} name - Invited user's name
 * @param {string} email - Invited user's email
 * @param {string} role - User's role
 * @param {string} specialization - User's specialization
 * @param {string} setPasswordLink - Link to set password page
 */
const teamInvitationMailgenContent = (name, email, role, specialization, setPasswordLink) => {
    // Convert role to readable format
    const roleDisplay = role === 'projectManager' ? 'Project Manager' :
        role === 'developer' ? 'Developer' : role

    return {
        body: {
            name: name,
            intro: `Welcome to WorkFlow Orchestrator! You've been invited to join the team as a <strong>${specialization} ${roleDisplay}</strong>.`,
            action: {
                instructions: `Your login email is: <strong>${email}</strong><br><br>To get started, please set your password by clicking the button below (this link expires in 24 hours):`,
                button: {
                    color: '#667eea',
                    text: 'Set Your Password',
                    link: setPasswordLink
                }
            },
            outro: "If you didn't expect this invitation, you can safely ignore this email. Need help? Just reply to this email, we'd love to help!"
        }
    }
}

export { emailVerificationMailgenContent, forgotPasswordMailgenContent, teamInvitationMailgenContent, sendEmail }
