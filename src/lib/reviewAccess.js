import crypto from 'crypto';
import { parseAppointmentDate } from '@/lib/bookingDates';

export const REVIEW_OPEN_DELAY_MS = 60 * 60 * 1000;
export const REVIEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const ALLOWED_REVIEW_STATUSES = new Set(['accepted', 'approved', 'booked', 'confirmed']);

export function createReviewToken() {
  return crypto.randomBytes(24).toString('hex');
}

export function getAppointmentDate(purchase) {
  const raw = purchase?.appointmentAt ? new Date(purchase.appointmentAt) : parseAppointmentDate(purchase);
  return raw instanceof Date && !Number.isNaN(raw.getTime()) ? raw : null;
}

export function getReviewWindow(purchase) {
  const appointmentAt = getAppointmentDate(purchase);
  if (!appointmentAt) return { appointmentAt: null, opensAt: null, closesAt: null };
  return {
    appointmentAt,
    opensAt: new Date(appointmentAt.getTime() + REVIEW_OPEN_DELAY_MS),
    closesAt: new Date(appointmentAt.getTime() + REVIEW_WINDOW_MS),
  };
}

export function getReviewEligibility(purchase, now = new Date()) {
  if (!purchase) return { allowed: false, reason: 'missing_booking' };
  if (!ALLOWED_REVIEW_STATUSES.has(String(purchase.status || '').toLowerCase())) {
    return { allowed: false, reason: 'booking_not_completed_enough' };
  }
  if (purchase.reviewSubmittedAt) return { allowed: false, reason: 'already_reviewed' };

  const { appointmentAt, opensAt, closesAt } = getReviewWindow(purchase);
  if (!appointmentAt || !opensAt || !closesAt) {
    return { allowed: false, reason: 'missing_appointment_time', appointmentAt, opensAt, closesAt };
  }
  if (now.getTime() < opensAt.getTime()) {
    return { allowed: false, reason: 'too_early', appointmentAt, opensAt, closesAt };
  }
  if (now.getTime() > closesAt.getTime()) {
    return { allowed: false, reason: 'review_window_closed', appointmentAt, opensAt, closesAt };
  }
  return { allowed: true, reason: 'ok', appointmentAt, opensAt, closesAt };
}
