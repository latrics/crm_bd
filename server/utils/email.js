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
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Latrics CRM Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Poppins,Arial,sans-serif;">
<table border="0" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f6f8" style="background-color:#f4f6f8;padding:40px 0;">
<tr>
<td align="center">
<table border="0" width="620" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.08);">
<!-- Top Brand Bar -->
<tr>
<td height="6" bgcolor="#DA291C" style="height:6px;background-color:#DA291C;font-size:0;line-height:0;">&nbsp;</td>
</tr>
<!-- Header -->
<tr>
<td align="center" style="padding:40px 40px 20px;">
<img src="${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/latrics_logo.png" width="180" alt="Latrics CRM" style="display:block;border:none;">
<p style="margin-top:8px;color:#8A8D8F;font-size:14px;">
Building Better Tomorrow
</p>
</td>
</tr>
<!-- Hero -->
<tr>
<td style="padding:0 50px;">
<h1 style="margin:0;font-size:32px;color:#54585A;font-weight:700;">
You're Invited to Join Latrics CRM
</h1>
<p style="margin-top:24px;font-size:16px;line-height:28px;color:#54585A;">
Hello <strong>${username}</strong>,
</p>
<p style="font-size:16px;line-height:28px;color:#54585A;">
You have been invited to join the
<strong>Latrics CRM Platform</strong>
as an <strong>${displayRole}</strong>.
</p>
<p style="font-size:16px;line-height:28px;color:#54585A;">
Create your account credentials and activate your profile using the secure link below.
</p>
</td>
</tr>
<!-- CTA -->
<tr>
<td align="center" style="padding:35px 50px;">
  <table border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" bgcolor="#DA291C" style="border-radius:10px;">
        <a href="${inviteUrl}" target="_blank" style="font-size:16px;font-family:Poppins,Arial,sans-serif;color:#ffffff;text-decoration:none;border-radius:10px;padding:16px 36px;border:1px solid #DA291C;display:inline-block;font-weight:600;">Activate Account</a>
      </td>
    </tr>
  </table>
</td>
</tr>
<!-- Security Box -->
<tr>
<td style="padding:0 50px 30px;">
  <table border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#F7F8F9" style="background-color:#F7F8F9;border-radius:10px;">
    <tr>
      <td width="4" bgcolor="#DA291C" style="background-color:#DA291C;border-top-left-radius:10px;border-bottom-left-radius:10px;font-size:0;line-height:0;">&nbsp;</td>
      <td style="padding:20px;">
        <p style="margin:0;font-size:14px;line-height:24px;color:#54585A;">
          &#128274; This invitation link will expire in <strong>24 hours</strong>.
        </p>
      </td>
    </tr>
  </table>
</td>
</tr>
<!-- Link -->
<tr>
<td style="padding:0 50px 40px;">
<p style="font-size:14px;color:#8A8D8F;">
If the button does not work, use the link below:
</p>
<p style="word-break:break-all;font-size:13px;color:#DA291C;">
<a href="${inviteUrl}" style="color:#DA291C;">${inviteUrl}</a>
</p>
</td>
</tr>
<!-- Footer -->
<tr>
<td bgcolor="#54585A" style="background-color:#54585A;padding:30px;text-align:center;">
<p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;">
Latrics System Operations Team
</p>
<p style="margin-top:8px;color:#C7C9C7;font-size:12px;">
Building Better Tomorrow
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`
  };

  await transporter.sendMail(mailOptions);
}
