import nodemailer from 'nodemailer';

// Create transporter using environment variables or a fallback/mock
let transporter;

const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Mock transporter or logged email when SMTP is not configured
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('----------------------------------------------------');
      console.log('MOCK EMAIL SENT (SMTP not configured in .env):');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body:\n${mailOptions.text}`);
      console.log('----------------------------------------------------');
      return { messageId: 'mock-id-12345' };
    }
  };
}

import path from 'path';

/**
 * Sends an invite email.
 * @param {string} email 
 * @param {string} role
 * @param {string} inviteUrl 
 */
export async function sendInviteEmail(email, role, inviteUrl) {
  const username = email.split('@')[0];
  const displayRole = role === 'superadmin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1);

  // Path to the local logo image
  // Note: Adjust the relative path if the server runs from a different working directory.
  // Assuming the server runs from crm_latrics_bd/server or crm_latrics_bd
  const logoPath = path.resolve(process.cwd(), '../client/src/assets/images/latrics_grey_red_logo.png');

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Latrics CRM" <noreply@latrics.com>',
    to: email,
    subject: 'You\'re Invited to Join Latrics CRM',
    text: `You have been invited to join Latrics CRM.\nPlease click the link below to set up your password and access your account:\n${inviteUrl}\n\nThis invitation link will expire in 24 hours.`,
    attachments: [
      {
        filename: 'latrics_grey_red_logo.png',
        path: logoPath,
        cid: 'latrics_logo' // matched in html img src
      }
    ],
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Latrics CRM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">
  <div style="width: 100%; background-color: #ffffff; padding: 40px 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table style="width: 100%; max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; border-collapse: collapse;" cellpadding="0" cellspacing="0" border="0" align="center">
      <tr>
        <td style="padding: 40px;">
          <!-- Logo -->
          <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left">
                <img src="cid:latrics_logo" alt="Latrics Logo" style="max-width: 140px; height: auto; border: none; display: block;" />
              </td>
            </tr>
          </table>

          <!-- Title -->
          <h1 style="color: #111827; font-size: 24px; font-weight: 600; line-height: 1.3; margin-top: 32px; margin-bottom: 24px; text-align: left;">
            You've been invited to Latrics CRM
          </h1>

          <!-- Greeting -->
          <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-align: left;">
            Hello <strong>${username}</strong>,
          </p>

          <!-- Body Message -->
          <p style="color: #54585A; font-size: 14px; line-height: 24px; margin: 0 0 20px 0; text-align: left;">
            You have been exclusively invited to join the <strong>Latrics CRM Platform</strong>. Your account has been provisioned with <strong style="color: #DA291C;">${displayRole}</strong> access.
          </p>

          <!-- Recipient Highlight Box -->
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color: #F5F5F5; border: 1px solid #C7C9C7; border-radius: 5px; padding: 14px; text-align: center; font-family: monospace; font-size: 14px; color: #54585A;">
                ${email}
              </td>
            </tr>
          </table>

          <!-- CTA Button -->
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left">
                <table border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <tr>
                    <td align="center" bgcolor="#DA291C" style="border-radius: 5px; padding: 12px 24px; background-color: #DA291C;">
                      <a href="${inviteUrl}" target="_blank" style="font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #ffffff; text-decoration: none; display: block; font-weight: 500; line-height: 100%;">
                        <span style="color: #ffffff; text-decoration: none;">Activate Account</span>
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Fallback Link -->
          <p style="color: #8A8D8F; font-size: 14px; margin-top: 24px; margin-bottom: 8px; text-align: left;">
            Or copy and paste this URL into your browser:
          </p>
          <p style="margin: 0; text-align: left;">
            <a href="${inviteUrl}" style="color: #2563EB; font-size: 14px; word-break: break-all; text-decoration: none;">
              ${inviteUrl}
            </a>
          </p>

          <!-- Security Disclaimer -->
          <p style="color: #8A8D8F; font-size: 14px; line-height: 22px; margin-top: 32px; margin-bottom: 24px; text-align: left;">
            Didn't request this invitation? You can safely ignore this email. Nothing changes until you activate your account. This invitation link will expire in exactly 24 hours.
          </p>

          <!-- Separator -->
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0 24px 0;" />

          <!-- Footer -->
          <p style="color: #8A8D8F; font-size: 12px; line-height: 20px; margin: 0 0 4px 0; text-align: left;">
            If you'd like to report an issue, please reach out to <a href="mailto:support@latrics.com" style="color: #2563EB; text-decoration: none;">Latrics Support</a>.
          </p>
          <p style="color: #8A8D8F; font-size: 12px; margin: 0; text-align: left;">
            Copyright &copy; ${new Date().getFullYear()} Latrics. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
    `
  };

  await transporter.sendMail(mailOptions);
}
