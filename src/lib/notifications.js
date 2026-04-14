import { sendEmail } from '@/lib/mail';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.findtrustedcleaners.com';
const LOGO_URL = `${SITE_URL.replace(/\/$/, '')}/findtrusted-logo.png`;

function safe(v) {
  return String(v || '').trim();
}

function bookingUrlForClient(cleanerId) {
  if (!cleanerId) return `${SITE_URL}/clients/dashboard`;
  return new URL(`/cleaners/${cleanerId}`, SITE_URL).toString();
}

function reviewUrlForPurchase(purchase) {
  const token = safe(purchase?.reviewToken);
  if (!token) return '';
  return new URL(`/review/${token}`, SITE_URL).toString();
}

function dashboardUrlForCleaner() {
  return `${SITE_URL}/cleaners/bookings`;
}

function bookingSummaryItems({ purchase, cleanerName, clientName, includeCleaner = true, includeClient = true }) {
  return [
    purchase?.serviceName ? `<li><strong>Service:</strong> ${purchase.serviceName}</li>` : '',
    purchase?.serviceAddress ? `<li><strong>Address:</strong> ${purchase.serviceAddress}</li>` : '',
    purchase?.isoDate ? `<li><strong>Date:</strong> ${purchase.isoDate}</li>` : purchase?.day ? `<li><strong>Day:</strong> ${purchase.day}</li>` : '',
    purchase?.hour ? `<li><strong>Time:</strong> ${String(purchase.hour).padStart(2, '0')}:00</li>` : '',
    includeCleaner && cleanerName ? `<li><strong>Cleaner:</strong> ${cleanerName}</li>` : '',
    includeClient && clientName ? `<li><strong>Client:</strong> ${clientName}</li>` : '',
  ].filter(Boolean).join('');
}

function bookingSummaryLines({ purchase, cleanerName, clientName, includeCleaner = true, includeClient = true }) {
  return [
    purchase?.serviceName ? `Service: ${purchase.serviceName}` : null,
    purchase?.serviceAddress ? `Address: ${purchase.serviceAddress}` : null,
    purchase?.isoDate ? `Date: ${purchase.isoDate}` : purchase?.day ? `Day: ${purchase.day}` : null,
    purchase?.hour ? `Time: ${String(purchase.hour).padStart(2, '0')}:00` : null,
    includeCleaner && cleanerName ? `Cleaner: ${cleanerName}` : null,
    includeClient && clientName ? `Client: ${clientName}` : null,
  ].filter(Boolean);
}

function baseEmailLayout({ preheader = '', title, intro, bodyHtml = '', primaryButton, secondaryButton, note }) {
  const buttonHtml = [primaryButton, secondaryButton]
    .filter(Boolean)
    .map((button, index) => {
      const isPrimary = index === 0;
      return `
        <a href="${button.href}" style="display:inline-block;margin:0 10px 10px 0;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;${isPrimary ? 'background:#0f766e;color:#ffffff;border:1px solid #0f766e;' : 'background:#ffffff;color:#0f766e;border:1px solid #99f6e4;'}">${button.label}</a>
      `;
    })
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:24px 28px;background:linear-gradient(135deg,#f0fdfa 0%,#ffffff 100%);border-bottom:1px solid #e2e8f0;">
                <img src="${LOGO_URL}" alt="FindTrustedCleaners" style="display:block;height:auto;max-width:180px;width:100%;" />
                <div style="margin-top:16px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;">FindTrustedCleaners</div>
                <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#0f172a;">${title}</h1>
                ${intro ? `<p style="margin:14px 0 0;font-size:16px;line-height:1.7;color:#475569;">${intro}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${bodyHtml}
                ${buttonHtml ? `<div style="margin-top:24px;">${buttonHtml}</div>` : ''}
                ${note ? `<div style="margin-top:22px;padding:14px 16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;line-height:1.7;color:#475569;">${note}</div>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.7;color:#64748b;">
                This is a service email from FindTrustedCleaners about your account, booking, or marketplace activity.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function detailCardHtml(items = []) {
  return `
    <div style="margin-top:20px;padding:18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;margin-bottom:12px;">Booking details</div>
      <ul style="margin:0;padding-left:18px;color:#334155;line-height:1.8;">${items}</ul>
    </div>
  `;
}

function textBlock(lines = []) {
  return lines.filter(Boolean).join('\n');
}

export async function sendCleanerPendingBookingEmail({ cleaner, client, purchase }) {
  if (!cleaner?.email) return { skipped: true, reason: 'missing_cleaner_email' };
  const subject = 'New pending job request on FindTrustedCleaners';
  const actionUrl = dashboardUrlForCleaner();
  const lines = [
    `Hi ${safe(cleaner.realName || cleaner.companyName || 'there')},`,
    '',
    'You have a new pending booking request that needs your approval.',
    ...bookingSummaryLines({ purchase, clientName: client?.name, includeCleaner: false }),
    client?.email ? `Client email: ${client.email}` : null,
    client?.phone ? `Client phone: ${client.phone}` : null,
    client?.area ? `Area: ${client.area}` : null,
    `Open booking inbox: ${actionUrl}`,
  ];

  return sendEmail({
    to: cleaner.email,
    subject,
    text: textBlock(lines),
    html: baseEmailLayout({
      preheader: 'A new booking request needs your approval.',
      title: 'New pending job request',
      intro: `Hi ${safe(cleaner.realName || cleaner.companyName || 'there')}, you have a new booking request waiting in your dashboard.`,
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#334155;">Review the request and decide whether to accept or decline it.</p>
        ${detailCardHtml(`${bookingSummaryItems({ purchase, clientName: client?.name, includeCleaner: false })}
          ${client?.email ? `<li><strong>Client email:</strong> ${client.email}</li>` : ''}
          ${client?.phone ? `<li><strong>Client phone:</strong> ${client.phone}</li>` : ''}
          ${client?.area ? `<li><strong>Area:</strong> ${client.area}</li>` : ''}`)}
      `,
      primaryButton: { href: actionUrl, label: 'Open booking inbox' },
      note: 'Please review the request inside your cleaner bookings area so the platform can keep the slot status up to date.',
    }),
  });
}

export async function sendClientBookingRequestConfirmationEmail({ to, recipientName, cleanerName, purchase }) {
  if (!to) return { skipped: true, reason: 'missing_client_email' };
  const detailsUrl = bookingUrlForClient(purchase?.cleanerId);
  const subject = 'Your booking request has been sent';
  return sendEmail({
    to,
    subject,
    text: textBlock([
      `Hi ${safe(recipientName || 'there')},`,
      '',
      `Your booking request has been sent to ${safe(cleanerName || 'the cleaner')}.`,
      'The cleaner still needs to approve the request before it becomes a confirmed job.',
      ...bookingSummaryLines({ purchase, cleanerName, includeClient: false }),
      `View details: ${detailsUrl}`,
    ]),
    html: baseEmailLayout({
      preheader: 'Your booking request has been sent to the cleaner.',
      title: 'Booking request sent',
      intro: `Hi ${safe(recipientName || 'there')}, your request has been sent to ${safe(cleanerName || 'the cleaner')}.`,
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#334155;">The cleaner still needs to approve the request before it becomes a confirmed booking.</p>
        ${detailCardHtml(bookingSummaryItems({ purchase, cleanerName, includeClient: false }))}
      `,
      primaryButton: { href: detailsUrl, label: 'View request' },
      note: 'You do not need to do anything right now. We will update you when the cleaner responds.',
    }),
  });
}

export async function sendBookingAcceptedEmail({ to, recipientName, cleanerName, purchase }) {
  if (!to) return { skipped: true, reason: 'missing_client_email' };
  const detailsUrl = bookingUrlForClient(purchase?.cleanerId);
  const reviewUrl = reviewUrlForPurchase(purchase);
  const reviewTextLine = reviewUrl ? `Leave a review after the appointment: ${reviewUrl}` : 'We will send your review link separately after the appointment.';
  return sendEmail({
    to,
    subject: 'Your cleaning request has been accepted',
    text: textBlock([
      `Hi ${safe(recipientName || 'there')},`,
      '',
      `${safe(cleanerName || 'Your cleaner')} has accepted your booking request.`,
      ...bookingSummaryLines({ purchase, cleanerName, includeClient: false }),
      `View details: ${detailsUrl}`,
      reviewTextLine,
    ]),
    html: baseEmailLayout({
      preheader: 'Your booking request has been accepted.',
      title: 'Booking accepted',
      intro: `Hi ${safe(recipientName || 'there')}, ${safe(cleanerName || 'your cleaner')} has accepted your booking request.`,
      bodyHtml: `${detailCardHtml(bookingSummaryItems({ purchase, cleanerName, includeClient: false }))}`,
      primaryButton: { href: detailsUrl, label: 'Open booking details' },
      secondaryButton: reviewUrl ? { href: reviewUrl, label: 'Leave a review later' } : null,
      note: reviewUrl ? 'Your review link is included here for convenience, but it is intended to be used after the appointment.' : 'A review link will be sent separately after the appointment.',
    }),
  });
}

export async function sendCleanerBookingAcceptedEmail({ to, recipientName, clientName, purchase }) {
  if (!to) return { skipped: true, reason: 'missing_cleaner_email' };
  const actionUrl = dashboardUrlForCleaner();
  return sendEmail({
    to,
    subject: 'Booking accepted and confirmed',
    text: textBlock([
      `Hi ${safe(recipientName || 'there')},`,
      '',
      'You approved this booking request. It is now accepted.',
      ...bookingSummaryLines({ purchase, clientName, includeCleaner: false }),
      `Open bookings: ${actionUrl}`,
    ]),
    html: baseEmailLayout({
      preheader: 'You approved a booking request.',
      title: 'Booking accepted',
      intro: `Hi ${safe(recipientName || 'there')}, this booking is now confirmed on the platform.`,
      bodyHtml: `${detailCardHtml(bookingSummaryItems({ purchase, clientName, includeCleaner: false }))}`,
      primaryButton: { href: actionUrl, label: 'Open bookings' },
    }),
  });
}

export async function sendBookingDeclinedEmail({ to, recipientName, cleanerName, purchase }) {
  if (!to) return { skipped: true, reason: 'missing_client_email' };
  const detailsUrl = `${SITE_URL}/cleaners`;
  return sendEmail({
    to,
    subject: 'Your cleaning request was declined',
    text: textBlock([
      `Hi ${safe(recipientName || 'there')},`,
      '',
      `${safe(cleanerName || 'The cleaner')} declined your booking request.`,
      'You can browse other cleaners and send a new request at any time.',
      ...bookingSummaryLines({ purchase, cleanerName, includeClient: false }),
      `Browse cleaners: ${detailsUrl}`,
    ]),
    html: baseEmailLayout({
      preheader: 'A booking request was declined.',
      title: 'Booking declined',
      intro: `Hi ${safe(recipientName || 'there')}, ${safe(cleanerName || 'the cleaner')} declined this request.`,
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#334155;">You can browse other cleaners and send a new request whenever you are ready.</p>
        ${detailCardHtml(bookingSummaryItems({ purchase, cleanerName, includeClient: false }))}
      `,
      primaryButton: { href: detailsUrl, label: 'Browse cleaners' },
    }),
  });
}

export async function sendBookingReminderEmail({ to, recipientName, cleanerName, clientName, purchase, role }) {
  if (!to) return { skipped: true, reason: 'missing_email' };
  const actionUrl = role === 'cleaner' ? dashboardUrlForCleaner() : bookingUrlForClient(purchase?.cleanerId);
  return sendEmail({
    to,
    subject: 'Appointment reminder from FindTrustedCleaners',
    text: textBlock([
      `Hi ${safe(recipientName || 'there')},`,
      '',
      'This is your 24-hour appointment reminder.',
      ...bookingSummaryLines({ purchase, cleanerName, clientName }),
      `Open details: ${actionUrl}`,
    ]),
    html: baseEmailLayout({
      preheader: 'A 24-hour reminder for your upcoming appointment.',
      title: 'Appointment reminder',
      intro: `Hi ${safe(recipientName || 'there')}, this is your 24-hour reminder for an upcoming appointment.`,
      bodyHtml: `${detailCardHtml(bookingSummaryItems({ purchase, cleanerName, clientName }))}`,
      primaryButton: { href: actionUrl, label: 'Open details' },
    }),
  });
}

export async function sendReviewRequestEmail({ to, recipientName, cleanerName, purchase }) {
  if (!to) return { skipped: true, reason: 'missing_email' };
  const reviewUrl = reviewUrlForPurchase(purchase);
  if (!reviewUrl) {
    return { skipped: true, reason: 'missing_review_token' };
  }

  return sendEmail({
    to,
    subject: 'How did your cleaning appointment go?',
    text: textBlock([
      `Hi ${safe(recipientName || 'there')},`,
      '',
      `Please leave a review for ${safe(cleanerName || 'your cleaner')}.`,
      purchase?.serviceName ? `Service: ${purchase.serviceName}` : null,
      purchase?.isoDate ? `Date: ${purchase.isoDate}` : purchase?.day ? `Day: ${purchase.day}` : null,
      `Leave your review: ${reviewUrl}`,
    ]),
    html: baseEmailLayout({
      preheader: 'Please leave a verified review for your recent booking.',
      title: 'Leave a review',
      intro: `Hi ${safe(recipientName || 'there')}, we hope your appointment with ${safe(cleanerName || 'your cleaner')} went well.`,
      bodyHtml: `${detailCardHtml(`
        ${purchase?.serviceName ? `<li><strong>Service:</strong> ${purchase.serviceName}</li>` : ''}
        ${purchase?.isoDate ? `<li><strong>Date:</strong> ${purchase.isoDate}</li>` : purchase?.day ? `<li><strong>Day:</strong> ${purchase.day}</li>` : ''}
      `)}`,
      primaryButton: { href: reviewUrl, label: 'Leave a review' },
      note: 'This review link is tied to a real booking so feedback on cleaner profiles stays more trustworthy.',
    }),
  });
}
