/**
 * Password Reset OTP Template
 * Brand-matched HTML email for Workflow Orchestrator
 */

export function getResetPasswordHtml(username, otp) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Inter','Plus Jakarta Sans','Outfit',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,0.05);">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px 28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Workflow Orchestrator</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 16px 40px;">
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">
                Reset your password
              </h1>
              <p style="margin:0 0 28px 0;font-size:15px;color:#64748b;line-height:1.6;">
                Hi <strong style="color:#0f172a;">${username}</strong>, we received a request to reset your 
                Workflow Orchestrator account password. Use the code below to proceed.
              </p>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td style="padding:0 40px 24px 40px;" align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08));border:1.5px solid #e0e7ff;border-radius:12px;width:100%;">
                <tr>
                  <td style="padding:24px 20px;" align="center">
                    <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;">
                      Your Reset Code
                    </p>
                    <p style="margin:0;font-size:36px;font-weight:800;color:#4338ca;letter-spacing:8px;font-family:'Inter',monospace;">
                      ${otp}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry warning -->
          <tr>
            <td style="padding:0 40px 12px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef2f2;border:1px solid #fee2e2;border-radius:8px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#b91c1c;line-height:1.5;font-weight:500;">
                      ⏱ This code expires in <strong>1 minute</strong>. If it expires, request a new one from the login page.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:12px 40px 36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border-radius:8px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
                      🔒 If you didn't request a password reset, please ignore this email. Your account is safe — no changes have been made.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#e2e8f0;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px 40px;">
              <p style="margin:0 0 4px 0;font-size:13px;color:#94a3b8;line-height:1.5;">
                This email was sent by <strong style="color:#64748b;">Workflow Orchestrator</strong> because a password reset was requested for your account.
              </p>
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
                Need help? Just reply to this email, we'd love to help!
              </p>
            </td>
          </tr>

        </table>

        <!-- Sub-footer -->
        <table width="600" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:20px 40px;" align="center">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} Workflow Orchestrator. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
