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
        }
    })

    const mail = {
        from: process.env.MAIL_FROM_ADDRESS || "noreply@workfloworchestrator.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHTML
    }

    try {
        console.log(`📨 Attempting to send email to: ${options.email}`)
        const info = await transporter.sendMail(mail)
        console.log("✅ Email sent successfully:", info.messageId)
        return info
    } catch (error) {
        console.error("❌ Email service failed. Make sure you have provided valid SMTP credentials in your .env file")
        console.error("📋 Error details:", {
            message: error.message,
            code: error.code,
            command: error.command
        })
        throw error
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
