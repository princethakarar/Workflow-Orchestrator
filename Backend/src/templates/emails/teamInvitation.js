/**
 * Team Invitation Template
 * Brand-matched HTML email for Workflow Orchestrator
 */

export function getTeamInvitationHtml(name, email, role, specialization, setPasswordLink) {
  // Convert role to readable format
  const roleDisplay = role === 'projectManager' ? 'Project Manager'
    : role === 'developer' ? 'Developer' : role

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Workflow Orchestrator</title>
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
                You're invited to join the team!
              </h1>
              <p style="margin:0 0 24px 0;font-size:15px;color:#64748b;line-height:1.6;">
                Hi <strong style="color:#0f172a;">${name}</strong>, you've been invited to join 
                <strong style="color:#0f172a;">Workflow Orchestrator</strong> as part of the team.
              </p>
            </td>
          </tr>

          <!-- Role info card -->
          <tr>
            <td style="padding:0 40px 28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08));border:1.5px solid #e0e7ff;border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom:10px;">
                          <span style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Your Role</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:6px;">
                          <span style="display:inline-block;background:#6366f1;color:#ffffff;font-size:13px;font-weight:600;padding:4px 12px;border-radius:6px;">${specialization} ${roleDisplay}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size:13px;color:#64748b;">Login email: <strong style="color:#0f172a;">${email}</strong></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 12px 40px;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
                    <a href="${setPasswordLink}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                      Set Your Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td style="padding:12px 40px 36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border-radius:8px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
                      ⏱ This invitation link expires in <strong style="color:#64748b;">24 hours</strong>. If it expires, ask your admin to resend the invitation.
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
                You received this email because you were invited to <strong style="color:#64748b;">Workflow Orchestrator</strong>.
              </p>
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
                If you didn't expect this invitation, you can safely ignore this email.
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
