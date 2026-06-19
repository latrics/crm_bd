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
 * @param {string} role
 * @param {string} inviteUrl 
 */
export async function sendInviteEmail(email, role, inviteUrl) {
  const username = email.split('@')[0];
  const displayRole = role === 'superadmin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1);

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Latrics CRM" <noreply@latrics.com>',
    to: email,
    subject: 'You\'re Invited to Join Latrics CRM',
    text: `You have been invited to join Latrics CRM.
Please click the link below to set up your password and access your account:
${inviteUrl}

This invitation link will expire in 24 hours.`,
    html: `
<div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
  <!-- Top Red Border -->
  <div style="height: 6px; background-color: #DA291C; width: 100%;"></div>
  
  <!-- Header / Logo -->
  <div style="text-align: center; padding: 30px 20px 20px;">
    <img src="https://ui-avatars.com/api/?name=L&color=DA291C&background=fef2f2" alt="Latrics Logo" style="width: 40px; height: 40px; margin-bottom: 10px; border-radius: 4px;" />
    <p style="margin: 0; color: #888; font-size: 13px; font-weight: 500;">Building Better Tomorrow</p>
  </div>

  <!-- Main Content -->
  <div style="padding: 0 30px 30px;">
    <h1 style="color: #4b5563; font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 30px; letter-spacing: -0.5px;">
      You're Invited to Join Latrics CRM
    </h1>
    
    <p style="color: #4b5563; font-size: 15px; margin-bottom: 20px;">
      Hello <strong>${username}</strong>,
    </p>
    
    <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      You have been invited to join the <strong>Latrics CRM Platform</strong> as an <strong>${displayRole}</strong>.
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
      Create your account credentials and activate your profile using the secure link below.
    </p>

    <!-- Call to Action Button -->
    <div style="text-align: center; margin-bottom: 35px;">
      <a href="${inviteUrl}" style="background-color: #DA291C; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(218,41,28,0.2);">
        Activate Account
      </a>
    </div>

    <!-- Security Notice -->
    <div style="background-color: #f9fafb; border-left: 4px solid #DA291C; padding: 16px 20px; border-radius: 4px; margin-bottom: 30px;">
      <p style="margin: 0; color: #4b5563; font-size: 14px;">
        🔒 This invitation link will expire in <strong>24 hours</strong>.
      </p>
    </div>

    <!-- Fallback Link -->
    <p style="color: #6b7280; font-size: 13px; margin-bottom: 8px;">
      If the button does not work, use the link below:
    </p>
    <a href="${inviteUrl}" style="color: #DA291C; font-size: 13px; word-break: break-all;">
      ${inviteUrl}
    </a>
  </div>

  <!-- Footer -->
  <div style="background-color: #4b5563; padding: 24px 30px; text-align: center;">
    <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 6px;">
      Latrics System Operations Team
    </p>
    <p style="margin: 0; color: #d1d5db; font-size: 12px;">
      Building Better Tomorrow
    </p>
  </div>
</div>
    `
  };

  await transporter.sendMail(mailOptions);
}
