import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import Booking from '@/models/booking';
import { requiredHourSpan, hasContiguousAvailability } from '@/lib/availability';
import { sendCleanerPendingBookingEmail, sendClientBookingRequestConfirmationEmail } from '@/lib/notifications';
import { getPurchaseExpiryDate } from '@/lib/purchaseExpiry';
import { parseAppointmentDate } from '@/lib/bookingDates';
import { createReviewToken } from '@/lib/reviewAccess';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const BOOKED_STATUSES = new Set(['accepted','confirmed','booked']);
const PENDING_PURCHASE_STATUSES = new Set(['pending','pending_approval','approved']);

function json(data, status = 200, extraHeaders = {}) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function toHourString(h) {
  const n = Number(h);
  return Number.isFinite(n) ? String(parseInt(n, 10)) : '';
}

function applySpan(grid, day, start, span, value) {
  if (!grid[day]) grid[day] = {};
  for (let i = 0; i < Math.max(1, span); i++) {
    const hk = String(start + i);
    if (grid[day][hk] === false || grid[day][hk] === 'unavailable') continue;
    grid[day][hk] = value;
  }
}


function normalizeServiceKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function findActiveService(services = [], serviceKey = '') {
  const wanted = normalizeServiceKey(serviceKey);
  return (services || []).find((s) => {
    if (!s || s.active === false) return false;
    return normalizeServiceKey(s.key || s.name) === wanted;
  }) || null;
}


function formatHourLabel(hour) {
  const n = Number(hour);
  if (!Number.isFinite(n)) return '';
  return `${String(parseInt(n, 10)).padStart(2, '0')}:00`;
}

function formatArea(cleaner = {}) {
  const address = cleaner?.address || {};
  return [address.town, address.county, address.postcode].filter(Boolean).join(', ');
}

function buildEffectiveDayGrid(cleaner, day, isoDate) {
  const baseDay = cleaner?.availability?.[day] || {};
  const overrideDay = isoDate ? cleaner?.availabilityOverrides?.[isoDate] || {} : {};
  const mergedDay = {};
  for (let h = 7; h <= 19; h++) {
    const key = String(h);
    mergedDay[key] = Object.prototype.hasOwnProperty.call(overrideDay, key) ? overrideDay[key] : baseDay[key];
  }
  return { [day]: mergedDay };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function GET(req) {
  await connectToDatabase();
  const { valid, user } = await protectApiRoute(req);
  if (!valid) return json({ success: false, message: 'Unauthenticated' }, 401);
  if (user.type !== 'client') return json({ success: false, message: 'Access denied.' }, 403);

  try {
    const purchases = await Purchase.find({ clientId: user._id })
      .sort({ appointmentAt: 1, createdAt: -1 })
      .populate('cleanerId', 'realName companyName image')
      .lean();
    return json({ success: true, purchases });
  } catch (err) {
    console.error('❌ Failed to fetch purchases:', err);
    return json({ success: false, message: 'Server error.' }, 500);
  }
}

export async function POST(req) {
  await connectToDatabase();

  const auth = await protectApiRoute(req);
  const valid = !!auth?.valid;
  const user = auth?.user || null;
  const isClientUser = valid && user?.type === 'client';

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: 'Invalid JSON body.' }, 400);
  }

  const {
    cleanerId,
    day,
    hour,
    currency = 'GBP',
    amount,
    notes,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    isoDate,
    serviceKey,
  } = body || {};

  if (!mongoose.Types.ObjectId.isValid(String(cleanerId))) return json({ success: false, message: 'Invalid cleanerId.' }, 400);
  if (!DAYS.includes(day)) return json({ success: false, message: 'Invalid day.' }, 400);

  const guestName = String(customerName || '').trim();
  const guestEmail = String(customerEmail || '').trim().toLowerCase();
  const guestPhone = String(customerPhone || '').trim();
  const serviceAddress = String(customerAddress || '').trim();

  if (!isClientUser) {
    if (!guestName) return json({ success: false, message: 'Please enter your name.' }, 400);
    if (!guestEmail && !guestPhone) return json({ success: false, message: 'Please enter an email address or phone number.' }, 400);
  }

  const startHourNum = Number(hour);
  if (!Number.isInteger(startHourNum) || startHourNum < 0 || startHourNum > 23) {
    return json({ success: false, message: 'Invalid start hour.' }, 400);
  }
  const startHourStr = toHourString(startHourNum);

  const cleaner = await Cleaner.findById(cleanerId).lean();
  if (!cleaner) return json({ success: false, message: 'Cleaner not found.' }, 404);

  const svc = findActiveService(cleaner.servicesDetailed || [], serviceKey);
  if (!svc) return json({ success: false, message: 'Please select a valid service.' }, 400);

  const effDuration = Number(svc?.defaultDurationMins ?? 60);
  const effBufBefore = 0;
  const effBufAfter = 0;
  const span = requiredHourSpan({ durationMins: effDuration, bufferBeforeMins: effBufBefore, bufferAfterMins: effBufAfter });

  if (startHourNum + span > 24) return json({ success: false, message: 'Requested span exceeds end of day.' }, 400);

  try {
    const merged = buildEffectiveDayGrid(cleaner, day, isoDate);

    const purchases = await Purchase.find({
      cleanerId,
      day,
      ...(isoDate ? { isoDate } : {}),
      status: { $in: Array.from(PENDING_PURCHASE_STATUSES) },
    }).lean();

    for (const p of purchases || []) {
      applySpan(merged, day, Number(p?.hour), Number(p?.span || 1), String(p.status).toLowerCase() === 'approved' ? 'booked' : 'pending');
    }

    const bookings = await Booking.find({
      cleanerId,
      day,
      ...(isoDate ? { isoDate } : {}),
      status: { $in: Array.from(BOOKED_STATUSES) },
    }).lean();

    for (const b of bookings || []) {
      applySpan(merged, day, Number(b?.hour), Number(b?.span || 1), 'booked');
    }

    if (!hasContiguousAvailability(merged, day, startHourNum, span)) {
      return json({ success: false, message: 'Start time no longer available for the selected service.' }, 409);
    }
  } catch (e) {
    console.error('❌ Availability merge/check failed:', e);
    return json({ success: false, message: 'Could not validate availability.' }, 500);
  }

  const appointmentAt = parseAppointmentDate({ isoDate, day, hour: startHourStr });

  const reviewToken = createReviewToken();

  const doc = await Purchase.create({
    cleanerId,
    clientId: isClientUser ? user._id : undefined,
    guestName: isClientUser ? (user.fullName || user.name || guestName || undefined) : guestName,
    guestEmail: isClientUser ? (user.email || guestEmail || undefined) : guestEmail,
    guestPhone: isClientUser ? (user.phone || guestPhone || undefined) : guestPhone,
    serviceAddress: serviceAddress || (isClientUser ? [user?.address?.houseNameNumber, user?.address?.street, user?.address?.town, user?.address?.county, user?.address?.postcode].filter(Boolean).join(', ') || undefined : undefined),
    day,
    hour: startHourStr,
    isoDate: typeof isoDate === 'string' ? isoDate : undefined,
    appointmentAt: appointmentAt || undefined,
    span,
    serviceKey,
    serviceName: svc?.name || undefined,
    durationMins: effDuration,
    bufferBeforeMins: effBufBefore,
    bufferAfterMins: effBufAfter,
    currency,
    amount: typeof amount === 'number' ? amount : undefined,
    status: 'pending_approval',
    reviewToken,
    reviewTokenCreatedAt: new Date(),
    notes: typeof notes === 'string' ? notes.trim() : undefined,
    expiresAt: getPurchaseExpiryDate('pending_approval'),
  });

  const purchaseForEmails = { ...doc.toObject(), _id: String(doc._id), cleanerId: String(cleaner._id) };
  const clientNameForEmail = isClientUser ? (user.fullName || user.name || '') : guestName;
  const clientEmailForEmail = isClientUser ? (user.email || guestEmail || '') : guestEmail;
  const clientAreaForEmail = isClientUser
    ? [user?.address?.town, user?.address?.county, user?.address?.postcode].filter(Boolean).join(', ')
    : '';
  const clientPhoneForEmail = isClientUser ? (user.phone || guestPhone || '') : guestPhone;
  const cleanerNameForEmail = cleaner?.companyName || cleaner?.realName || 'your cleaner';

  const pendingEmailResults = await Promise.allSettled([
    sendCleanerPendingBookingEmail({
      cleaner,
      client: {
        name: clientNameForEmail,
        email: clientEmailForEmail,
        phone: clientPhoneForEmail,
        area: clientAreaForEmail,
      },
      purchase: purchaseForEmails,
    }),
    sendClientBookingRequestConfirmationEmail({
      to: clientEmailForEmail,
      recipientName: clientNameForEmail,
      cleanerName: cleanerNameForEmail,
      purchase: purchaseForEmails,
    }),
  ]);

  const [cleanerPendingEmail, clientPendingEmail] = pendingEmailResults;

  if (cleanerPendingEmail?.status === 'fulfilled') {
    const result = cleanerPendingEmail.value;
    if (result?.skipped) {
      console.warn('[booking-email] cleaner pending skipped', {
        purchaseId: String(doc._id),
        cleanerId: String(cleaner._id),
        reason: result.reason,
      });
    } else {
      console.info('[booking-email] cleaner pending sent', { purchaseId: String(doc._id), cleanerId: String(cleaner._id) });
    }
  } else {
    console.error('[booking-email] cleaner pending failed', {
      purchaseId: String(doc._id),
      cleanerId: String(cleaner._id),
      message: cleanerPendingEmail?.reason?.message || 'Unknown error',
    });
  }

  if (clientPendingEmail?.status === 'fulfilled') {
    const result = clientPendingEmail.value;
    if (result?.skipped) {
      console.warn('[booking-email] client pending skipped', {
        purchaseId: String(doc._id),
        reason: result.reason,
      });
    } else {
      console.info('[booking-email] client pending sent', { purchaseId: String(doc._id) });
    }
  } else {
    console.error('[booking-email] client pending failed', {
      purchaseId: String(doc._id),
      message: clientPendingEmail?.reason?.message || 'Unknown error',
    });
  }

  return json({
    success: true,
    purchaseId: String(doc._id),
    span,
    status: doc.status,
    hour: startHourStr,
    day,
    isoDate: doc.isoDate || '',
  }, 201);
}
