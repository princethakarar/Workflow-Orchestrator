/**
 * Generic Notification Template
 * Brand-matched HTML email for Workflow Orchestrator
 * Flexible template accepting { title, message, ctaText, ctaUrl }
 */

export function getNotificationHtml({ title, message, ctaText, ctaUrl }) {
  const ctaSection = (ctaText && ctaUrl) ? `
          <!-- CTA Button -->
          <tr>
            <td style="padding:4px 40px 36px 40px;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                      ${ctaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
                  <td>
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Workflow Orchestrator</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 28px 40px;">
              <h1 style="margin:0 0 16px 0;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">
                ${title}
              </h1>
              <p style="margin:0;font-size:15px;color:#64748b;line-height:1.7;">
                ${message}
              </p>
            </td>
          </tr>
${ctaSection}
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
                This is an automated notification from <strong style="color:#64748b;">Workflow Orchestrator</strong>.
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
