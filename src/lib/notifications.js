import { sendEmail } from '@/lib/mail';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.findtrustedcleaners.com';

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
    purchase?.isoDate ? `<li><strong>Date:</strong> ${purchase.isoDate}</li>` : purchase?.day ? `<li><strong>Day:</strong> ${purchase.day}</li>` : '',
    purchase?.hour ? `<li><strong>Time:</strong> ${String(purchase.hour).padStart(2, '0')}:00</li>` : '',
    includeCleaner && cleanerName ? `<li><strong>Cleaner:</strong> ${cleanerName}</li>` : '',
    includeClient && clientName ? `<li><strong>Client:</strong> ${clientName}</li>` : '',
  ].filter(Boolean).join('');
}

function bookingSummaryLines({ purchase, cleanerName, clientName, includeCleaner = true, includeClient = true }) {
  return [
    purchase?.serviceName ? `Service: ${purchase.serviceName}` : null,
    purchase?.isoDate ? `Date: ${purchase.isoDate}` : purchase?.day ? `Day: ${purchase.day}` : null,
    purchase?.hour ? `Time: ${String(purchase.hour).padStart(2, '0')}:00` : null,
    includeCleaner && cleanerName ? `Cleaner: ${cleanerName}` : null,
    includeClient && clientName ? `Client: ${clientName}` : null,
  ].filter(Boolean);
}

export async function sendCleanerPendingBookingEmail({ cleaner, client, purchase }) {
  if (!cleaner?.email) return { skipped: true, reason: 'missing_cleaner_email' };
  const subject = 'New pending job request on FindTrustedCleaners';
  const lines = [
    `Hi ${safe(cleaner.realName || cleaner.companyName || 'there')},`,
    '',
    'You have a new pending booking request that needs your approval.',
    ...bookingSummaryLines({ purchase, clientName: client?.name, includeCleaner: false }),
    client?.email ? `Client email: ${client.email}` : null,
    client?.phone ? `Client phone: ${client.phone}` : null,
    client?.area ? `Area: ${client.area}` : null,
    `Review request: ${dashboardUrlForCleaner()}`,
  ].filter(Boolean);

  return sendEmail({
    to: cleaner.email,
    subject,
    text: lines.join('\n'),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f766e;margin:0 0 16px;">New pending job request</h2>
      <p>Hi ${safe(cleaner.realName || cleaner.companyName || 'there')},</p>
      <p>You have a new pending booking request that needs your approval.</p>
      <ul style="padding-left:18px;">
        ${bookingSummaryItems({ purchase, clientName: client?.name, includeCleaner: false })}
        ${client?.email ? `<li><strong>Client email:</strong> ${client.email}</li>` : ''}
        ${client?.phone ? `<li><strong>Client phone:</strong> ${client.phone}</li>` : ''}
        ${client?.area ? `<li><strong>Area:</strong> ${client.area}</li>` : ''}
      </ul>
      <p><a href="${dashboardUrlForCleaner()}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Open booking inbox</a></p>
    </div>`,
  });
}

export async function sendClientBookingRequestConfirmationEmail({ to, recipientName, cleanerName, purchase }) {
  if (!to) return { skipped: true, reason: 'missing_client_email' };
  const detailsUrl = bookingUrlForClient(purchase?.cleanerId);
  const subject = 'Your booking request has been sent';
  return sendEmail({
    to,
    subject,
    text: [
      `Hi ${safe(recipientName || 'there')},`,
      '',
      `Your booking request has been sent to ${safe(cleanerName || 'the cleaner')}.`,
      'The cleaner still needs to approve the request before it becomes a confirmed job.',
      ...bookingSummaryLines({ purchase, cleanerName, includeClient: false }),
      `View details: ${detailsUrl}`,
    ].filter(Boolean).join('\n'),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f766e;margin:0 0 16px;">Booking request sent</h2>
      <p>Hi ${safe(recipientName || 'there')},</p>
      <p>Your request has been sent to <strong>${safe(cleanerName || 'the cleaner')}</strong>.</p>
      <p>The cleaner still needs to approve the request before it becomes a confirmed job.</p>
      <ul style="padding-left:18px;">${bookingSummaryItems({ purchase, cleanerName, includeClient: false })}</ul>
      <p><a href="${detailsUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">View request</a></p>
    </div>`,
  });
}

export async function sendBookingAcceptedEmail({ to, recipientName, cleanerName, purchase }) {
  if (!to) return { skipped: true, reason: 'missing_client_email' };
  const detailsUrl = bookingUrlForClient(purchase?.cleanerId);
  const reviewUrl = reviewUrlForPurchase(purchase);
  const reviewTextLine = reviewUrl ? `Leave a review after the appointment: ${reviewUrl}` : 'We will send your review link separately after the appointment.';
  const reviewHtmlBlock = reviewUrl
    ? `<p style="margin-top:14px;"><a href="${reviewUrl}" style="display:inline-block;background:#ffffff;color:#0f766e;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;border:1px solid #0f766e;">Leave a review later</a></p>`
    : `<p style="margin-top:14px;color:#475569;">We will send your review link separately after the appointment.</p>`;
  return sendEmail({
    to,
    subject: 'Your cleaning request has been accepted',
    text: [
      `Hi ${safe(recipientName || 'there')},`,
      '',
      `${safe(cleanerName || 'Your cleaner')} has accepted your booking request.`,
      ...bookingSummaryLines({ purchase, cleanerName, includeClient: false }),
      `View details: ${detailsUrl}`,
      reviewTextLine,
    ].filter(Boolean).join('\n'),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f766e;margin:0 0 16px;">Booking accepted</h2>
      <p>Hi ${safe(recipientName || 'there')},</p>
      <p><strong>${safe(cleanerName || 'Your cleaner')}</strong> has accepted your booking request.</p>
      <ul style="padding-left:18px;">${bookingSummaryItems({ purchase, cleanerName, includeClient: false })}</ul>
      <p><a href="${detailsUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Open booking details</a></p>
      ${reviewHtmlBlock}
    </div>`,
  });
}

export async function sendCleanerBookingAcceptedEmail({ to, recipientName, clientName, purchase }) {
  if (!to) return { skipped: true, reason: 'missing_cleaner_email' };
  const actionUrl = dashboardUrlForCleaner();
  return sendEmail({
    to,
    subject: 'Booking accepted and confirmed',
    text: [
      `Hi ${safe(recipientName || 'there')},`,
      '',
      'You approved this booking request. It is now accepted.',
      ...bookingSummaryLines({ purchase, clientName, includeCleaner: false }),
      `Open bookings: ${actionUrl}`,
    ].filter(Boolean).join('\n'),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f766e;margin:0 0 16px;">Booking accepted</h2>
      <p>Hi ${safe(recipientName || 'there')},</p>
      <p>You approved this booking request. It is now accepted.</p>
      <ul style="padding-left:18px;">${bookingSummaryItems({ purchase, clientName, includeCleaner: false })}</ul>
      <p><a href="${actionUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Open bookings</a></p>
    </div>`,
  });
}

export async function sendBookingDeclinedEmail({ to, recipientName, cleanerName, purchase }) {
  if (!to) return { skipped: true, reason: 'missing_client_email' };
  const detailsUrl = `${SITE_URL}/cleaners`;
  return sendEmail({
    to,
    subject: 'Your cleaning request was declined',
    text: [
      `Hi ${safe(recipientName || 'there')},`,
      '',
      `${safe(cleanerName || 'The cleaner')} declined your booking request.`,
      'You can browse other cleaners and send a new request at any time.',
      ...bookingSummaryLines({ purchase, cleanerName, includeClient: false }),
      `Browse cleaners: ${detailsUrl}`,
    ].filter(Boolean).join('\n'),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f766e;margin:0 0 16px;">Booking declined</h2>
      <p>Hi ${safe(recipientName || 'there')},</p>
      <p><strong>${safe(cleanerName || 'The cleaner')}</strong> declined this request.</p>
      <p>You can browse other cleaners and send a new request at any time.</p>
      <ul style="padding-left:18px;">${bookingSummaryItems({ purchase, cleanerName, includeClient: false })}</ul>
      <p><a href="${detailsUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Browse cleaners</a></p>
    </div>`,
  });
}

export async function sendBookingReminderEmail({ to, recipientName, cleanerName, clientName, purchase, role }) {
  if (!to) return { skipped: true, reason: 'missing_email' };
  const subject = 'Appointment reminder from FindTrustedCleaners';
  const actionUrl = role === 'cleaner' ? dashboardUrlForCleaner() : bookingUrlForClient(purchase?.cleanerId);
  return sendEmail({
    to,
    subject,
    text: [
      `Hi ${safe(recipientName || 'there')},`,
      '',
      'This is your 24-hour appointment reminder.',
      ...bookingSummaryLines({ purchase, cleanerName, clientName }),
      `Open details: ${actionUrl}`,
    ].filter(Boolean).join('\n'),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f766e;margin:0 0 16px;">Appointment reminder</h2>
      <p>Hi ${safe(recipientName || 'there')},</p>
      <p>This is your 24-hour reminder for an upcoming appointment.</p>
      <ul style="padding-left:18px;">${bookingSummaryItems({ purchase, cleanerName, clientName })}</ul>
      <p><a href="${actionUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Open details</a></p>
    </div>`,
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
    text: [
      `Hi ${safe(recipientName || 'there')},`,
      '',
      `Please leave a review for ${safe(cleanerName || 'your cleaner')}.`,
      purchase?.serviceName ? `Service: ${purchase.serviceName}` : null,
      purchase?.isoDate ? `Date: ${purchase.isoDate}` : purchase?.day ? `Day: ${purchase.day}` : null,
      `Leave your review: ${reviewUrl}`,
    ].filter(Boolean).join('\n'),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f766e;margin:0 0 16px;">Leave a review</h2>
      <p>Hi ${safe(recipientName || 'there')},</p>
      <p>We hope your appointment with ${safe(cleanerName || 'your cleaner')} went well.</p>
      <ul style="padding-left:18px;">
        ${purchase?.serviceName ? `<li><strong>Service:</strong> ${purchase.serviceName}</li>` : ''}
        ${purchase?.isoDate ? `<li><strong>Date:</strong> ${purchase.isoDate}</li>` : purchase?.day ? `<li><strong>Day:</strong> ${purchase.day}</li>` : ''}
      </ul>
      <p><a href="${reviewUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Leave a review</a></p>
    </div>`,
  });
}
