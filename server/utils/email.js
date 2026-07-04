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
  <style>
    body { margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7f6; padding: 40px 0; }
    .main-table { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .top-bar { height: 8px; background: linear-gradient(90deg, #DA291C 0%, #b81c11 100%); width: 100%; }
    .header { padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #f0f0f0; }
    .logo { max-width: 180px; height: auto; }
    .tagline { margin-top: 12px; color: #6b7280; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
    .content { padding: 40px; }
    .title { color: #111827; font-size: 26px; font-weight: 800; text-align: center; margin: 0 0 30px 0; letter-spacing: -0.5px; line-height: 1.3; }
    .greeting { color: #374151; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; }
    .message { color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; }
    .highlight { color: #DA291C; font-weight: 700; }
    .btn-container { text-align: center; margin: 40px 0; }
    .btn { background-color: #DA291C; color: #ffffff !important; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(218,41,28,0.25); transition: background-color 0.3s ease; }
    .btn:hover { background-color: #b81c11; }
    .security-box { background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #DA291C; padding: 16px 20px; border-radius: 6px; margin: 0 0 35px 0; }
    .security-text { margin: 0; color: #991b1b; font-size: 14px; font-weight: 500; display: flex; align-items: center; }
    .fallback { background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: left; }
    .fallback-title { color: #4b5563; font-size: 14px; font-weight: 600; margin: 0 0 10px 0; }
    .fallback-link { color: #2563eb; font-size: 13px; word-break: break-all; line-height: 1.5; text-decoration: underline; }
    .footer { background-color: #1f2937; padding: 30px 40px; text-align: center; border-radius: 0 0 12px 12px; }
    .footer-text { margin: 0 0 8px 0; color: #f9fafb; font-size: 15px; font-weight: 600; }
    .footer-sub { margin: 0; color: #9ca3af; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" cellspacing="0" cellpadding="0" border="0" align="center">
      <tr>
        <td>
          <div class="top-bar"></div>
          
          <div class="header">
            <img src="cid:latrics_logo" alt="Latrics Logo" class="logo" />
            <div class="tagline">Building Better Tomorrow</div>
          </div>
          
          <div class="content">
            <h1 class="title">You're Invited to Latrics CRM</h1>
            
            <p class="greeting">Hello ${username},</p>
            
            <p class="message">
              You have been exclusively invited to join the <strong>Latrics CRM Platform</strong>. Your account has been provisioned with <span class="highlight">${displayRole}</span> access.
            </p>
            
            <p class="message">
              To complete your registration, please activate your profile and set up your secure credentials by clicking the button below.
            </p>
            
            <div class="btn-container">
              <a href="${inviteUrl}" class="btn">Activate Account</a>
            </div>
            
            <div class="security-box">
              <p class="security-text">
                <span style="font-size: 16px; margin-right: 8px;">⏱️</span>
                For your security, this personalized activation link will expire in exactly 24 hours.
              </p>
            </div>
            
            <div class="fallback">
              <p class="fallback-title">Button not working?</p>
              <p style="margin: 0; color: #6b7280; font-size: 13px; margin-bottom: 8px;">Copy and paste this URL into your browser:</p>
              <a href="${inviteUrl}" class="fallback-link">${inviteUrl}</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">Latrics System Operations Team</p>
            <p class="footer-sub">&copy; ${new Date().getFullYear()} Latrics. All rights reserved.</p>
          </div>
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
