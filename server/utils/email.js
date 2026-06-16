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

/**
 * Sends an invite email.
 * @param {string} email 
 * @param {string} inviteUrl 
 */
export async function sendInviteEmail(email, inviteUrl) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Latrics CRM" <noreply@latrics.com>',
    to: email,
    subject: 'Invitation to join Latrics CRM',
    text: `You have been invited to join Latrics CRM.
Please click the link below to set up your password and access your account:
${inviteUrl}

This invitation link will expire in 24 hours.`,
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 8px;">
      <h2 style="color: #DA291C;">Welcome to Latrics CRM</h2>
      <p>You have been invited to join the CRM system.</p>
      <p>Please click the button below to set up your password and activate your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" style="background-color: #DA291C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Set Up Password</a>
      </div>
      <p style="color: #666; font-size: 12px;">If the button above does not work, copy and paste this link into your browser:</p>
      <p style="color: #666; font-size: 12px; word-break: break-all;">${inviteUrl}</p>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p style="color: #999; font-size: 11px;">This invitation will expire in 24 hours.</p>
    </div>`
  };

  await transporter.sendMail(mailOptions);
}
