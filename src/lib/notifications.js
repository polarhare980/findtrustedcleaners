import { sendEmail } from '@/lib/mail';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.findtrustedcleaners.com';

function safe(v) {
  return String(v || '').trim();
}

function bookingUrlForClient(cleanerId, purchaseId) {
  if (!cleanerId) return `${SITE_URL}/clients/dashboard`;
  const url = new URL(`/cleaners/${cleanerId}`, SITE_URL);
  if (purchaseId) url.searchParams.set('review', purchaseId);
  return url.toString();
}

function dashboardUrlForCleaner() {
  return `${SITE_URL}/cleaners/bookings`;
}

export async function sendCleanerPendingBookingEmail({ cleaner, client, purchase }) {
  if (!cleaner?.email) return { skipped: true, reason: 'missing_cleaner_email' };
  const subject = 'New pending job request on FindTrustedCleaners';
  const lines = [
    `Hi ${safe(cleaner.realName || cleaner.companyName || 'there')},`,
    '',
    'You have a new pending booking request.',
    purchase?.serviceName ? `Service: ${purchase.serviceName}` : null,
    purchase?.isoDate ? `Date: ${purchase.isoDate}` : purchase?.day ? `Day: ${purchase.day}` : null,
    purchase?.hour ? `Time: ${String(purchase.hour).padStart(2, '0')}:00` : null,
    client?.name ? `Client: ${client.name}` : null,
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
      <ul style="padding-left:18px;">
        ${purchase?.serviceName ? `<li><strong>Service:</strong> ${purchase.serviceName}</li>` : ''}
        ${purchase?.isoDate ? `<li><strong>Date:</strong> ${purchase.isoDate}</li>` : purchase?.day ? `<li><strong>Day:</strong> ${purchase.day}</li>` : ''}
        ${purchase?.hour ? `<li><strong>Time:</strong> ${String(purchase.hour).padStart(2, '0')}:00</li>` : ''}
        ${client?.name ? `<li><strong>Client:</strong> ${client.name}</li>` : ''}
        ${client?.area ? `<li><strong>Area:</strong> ${client.area}</li>` : ''}
      </ul>
      <p><a href="${dashboardUrlForCleaner()}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Open booking inbox</a></p>
    </div>`,
  });
}

export async function sendBookingReminderEmail({ to, recipientName, cleanerName, clientName, purchase, role }) {
  if (!to) return { skipped: true, reason: 'missing_email' };
  const subject = 'Appointment reminder from FindTrustedCleaners';
  const actionUrl = role === 'cleaner' ? dashboardUrlForCleaner() : bookingUrlForClient(purchase?.cleanerId, purchase?._id);
  return sendEmail({
    to,
    subject,
    text: [
      `Hi ${safe(recipientName || 'there')},`,
      '',
      'This is your 24-hour appointment reminder.',
      purchase?.serviceName ? `Service: ${purchase.serviceName}` : null,
      purchase?.isoDate ? `Date: ${purchase.isoDate}` : purchase?.day ? `Day: ${purchase.day}` : null,
      purchase?.hour ? `Time: ${String(purchase.hour).padStart(2, '0')}:00` : null,
      cleanerName ? `Cleaner: ${cleanerName}` : null,
      clientName ? `Client: ${clientName}` : null,
      `Open details: ${actionUrl}`,
    ].filter(Boolean).join('\n'),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f766e;margin:0 0 16px;">Appointment reminder</h2>
      <p>Hi ${safe(recipientName || 'there')},</p>
      <p>This is your 24-hour reminder for an upcoming appointment.</p>
      <ul style="padding-left:18px;">
        ${purchase?.serviceName ? `<li><strong>Service:</strong> ${purchase.serviceName}</li>` : ''}
        ${purchase?.isoDate ? `<li><strong>Date:</strong> ${purchase.isoDate}</li>` : purchase?.day ? `<li><strong>Day:</strong> ${purchase.day}</li>` : ''}
        ${purchase?.hour ? `<li><strong>Time:</strong> ${String(purchase.hour).padStart(2, '0')}:00</li>` : ''}
        ${cleanerName ? `<li><strong>Cleaner:</strong> ${cleanerName}</li>` : ''}
        ${clientName ? `<li><strong>Client:</strong> ${clientName}</li>` : ''}
      </ul>
      <p><a href="${actionUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Open details</a></p>
    </div>`,
  });
}

export async function sendReviewRequestEmail({ to, recipientName, cleanerName, purchase }) {
  if (!to) return { skipped: true, reason: 'missing_email' };
  const reviewUrl = bookingUrlForClient(purchase?.cleanerId, purchase?._id);
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
