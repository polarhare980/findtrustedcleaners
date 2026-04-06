import nodemailer from 'nodemailer';

let cachedTransporter = null;

function readSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD || '',
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
  };
}

export function getMailTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const config = readSmtpConfig();
  if (!config.host || !config.user || !config.pass || !config.from) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return cachedTransporter;
}

export async function sendEmail({ to, subject, html, text, replyTo }) {
  const transporter = getMailTransporter();
  if (!transporter) {
    throw new Error('Mail transport is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.');
  }

  const { from } = readSmtpConfig();

  return transporter.sendMail({
    from: `"FindTrustedCleaners" <${from}>`,
    to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
}

export function buildPasswordResetEmail({ resetUrl, expiresMinutes = 60 }) {
  const safeUrl = String(resetUrl || '');
  return {
    subject: 'Reset your FindTrustedCleaners password',
    text: [
      'We received a request to reset your FindTrustedCleaners password.',
      `Reset your password here: ${safeUrl}`,
      `This link expires in ${expiresMinutes} minutes.`,
      'If you did not request this, you can ignore this email.',
    ].join('\n\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 16px;color:#0f766e;">Reset your FindTrustedCleaners password</h2>
        <p>We received a request to reset your password.</p>
        <p style="margin:24px 0;">
          <a href="${safeUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Reset password</a>
        </p>
        <p>This link expires in ${expiresMinutes} minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  };
}

export function buildCleanerBookingNotificationEmail({ cleanerName, clientName, serviceName, day, time, isoDate, area, dashboardUrl }) {
  const lines = [
    cleanerName ? `Hi ${cleanerName},` : 'Hi,',
    'You have a new booking request on FindTrustedCleaners.',
    serviceName ? `Service: ${serviceName}` : null,
    isoDate ? `Requested date: ${isoDate}` : day ? `Requested day: ${day}` : null,
    time ? `Requested time: ${time}` : null,
    clientName ? `Client: ${clientName}` : null,
    area ? `Area: ${area}` : null,
    dashboardUrl ? `Review it here: ${dashboardUrl}` : null,
  ].filter(Boolean);

  return {
    subject: 'New job request on FindTrustedCleaners',
    text: lines.join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 16px;color:#0f766e;">New job request</h2>
        <p>${cleanerName ? `Hi ${cleanerName},` : 'Hi,'}</p>
        <p>You have a new booking request on FindTrustedCleaners.</p>
        <ul style="padding-left:18px;">
          ${serviceName ? `<li><strong>Service:</strong> ${serviceName}</li>` : ''}
          ${isoDate ? `<li><strong>Requested date:</strong> ${isoDate}</li>` : day ? `<li><strong>Requested day:</strong> ${day}</li>` : ''}
          ${time ? `<li><strong>Requested time:</strong> ${time}</li>` : ''}
          ${clientName ? `<li><strong>Client:</strong> ${clientName}</li>` : ''}
          ${area ? `<li><strong>Area:</strong> ${area}</li>` : ''}
        </ul>
        ${dashboardUrl ? `<p style="margin-top:24px;"><a href="${dashboardUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Open booking inbox</a></p>` : ''}
      </div>
    `,
  };
}
