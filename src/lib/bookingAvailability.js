// src/lib/bookingAvailability.js
import Cleaner from '@/models/Cleaner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Normalise things like 'mon', 'Mon', 'monday' -> 'Monday'
function normalizeDay(day) {
  if (!day) return '';
  const d = String(day).toLowerCase().trim();
  const map = {
    mon: 'Monday', monday: 'Monday',
    tue: 'Tuesday', tues: 'Tuesday', tuesday: 'Tuesday',
    wed: 'Wednesday', weds: 'Wednesday', wednesday: 'Wednesday',
    thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', thursday: 'Thursday',
    fri: 'Friday', friday: 'Friday',
    sat: 'Saturday', saturday: 'Saturday',
    sun: 'Sunday', sunday: 'Sunday',
  };
  return map[d] || (DAYS.includes(day) ? day : '');
}

// Turn '07', '7', '07:00', '7:00' -> '7' ... up to '19'
function normalizeHour(hour) {
  if (hour === 0 || hour === '0') return '0';
  const raw = String(hour).trim();
  const onlyDigits = raw.includes(':') ? raw.split(':')[0] : raw;
  const n = parseInt(onlyDigits, 10);
  if (Number.isNaN(n)) return '';
  return String(n); // your grid uses string hours like '7','8',...
}

/**
 * Set a slot to pending with the Purchase id so the cleaner dashboard shows ⏳ and has bookingId.
 * Safe-guards if day/hour are off-format.
 */
export async function setPendingSlot({ cleanerId, day, hour, purchaseId }) {
  const dayKey = normalizeDay(day);
  const hourKey = normalizeHour(hour);

  if (!dayKey || !DAYS.includes(dayKey)) {
    console.warn('[setPendingSlot] Invalid day:', day);
    return;
  }

  const n = parseInt(hourKey, 10);
  if (Number.isNaN(n) || n < 7 || n > 19) {
    console.warn('[setPendingSlot] Hour out of range (7–19):', hour);
    return;
  }

  const update = {};
  update[`availability.${dayKey}.${hourKey}`] = {
    status: 'pending',
    bookingId: purchaseId,
  };

  await Cleaner.findByIdAndUpdate(cleanerId, { $set: update });
}
