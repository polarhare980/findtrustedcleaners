/**
 * Availability helpers (1-hour grid)
 * ----------------------------------
 * Keep your existing 1-hour cells (e.g., 07:00–19:00).
 * Longer jobs are represented as a `span` = number of consecutive hours.
 */

/**
 * Compute required span (number of 1-hour cells)
 * from a service duration + optional buffers.
 */
export function requiredHourSpan({ durationMins, bufferBeforeMins = 0, bufferAfterMins = 0 }) {
  const d = Number(durationMins) || 0;
  const b1 = Math.max(0, Number(bufferBeforeMins) || 0);
  const b2 = Math.max(0, Number(bufferAfterMins) || 0);
  const total = d + b1 + b2;
  return Math.max(1, Math.ceil(total / 60)); // each cell = 60 mins
}

/**
 * Check if a start time has `span` contiguous free cells (value === true).
 * availability: { [day]: { [hourString]: true|false|'unavailable'|'pending'|'booked' } }
 * day: 'Monday'...'Sunday'
 * startHour: Number (0-23)
 * span: Number (>=1)
 */
export function hasContiguousAvailability(availability, day, startHour, span) {
  if (!availability || !day || !Number.isInteger(startHour) || !Number.isInteger(span) || span < 1) {
    return false;
  }
  for (let i = 0; i < span; i++) {
    const hourKey = String(startHour + i);
    const val = availability?.[day]?.[hourKey];
    if (val !== true) return false; // must be explicitly free
  }
  return true;
}

/**
 * Mark a span as 'pending' in a cloned grid (non-destructive).
 * Does not overwrite explicit false/'unavailable'.
 */
export function markSpanAsPending(availability = {}, day, startHour, span) {
  const updated = deepClone(availability || {});
  if (!updated[day]) updated[day] = {};
  for (let i = 0; i < span; i++) {
    const hourKey = String(Number(startHour) + i);
    const slot = updated[day][hourKey];
    if (slot === false || slot === 'unavailable') continue;
    updated[day][hourKey] = 'pending';
  }
  return updated;
}

/**
 * Inject purchases (pending/accepted) into a cloned grid so the UI
 * can paint blocked cells. Accepted -> 'booked', pending -> 'pending'.
 * Each purchase is expected to have: { day, hour, span, status }
 */
export function injectPendingFromPurchases(availability = {}, purchasesList = []) {
  const updated = deepClone(availability || {});
  for (const p of purchasesList || []) {
    const status = p?.status;
    if (!['pending', 'pending_approval', 'accepted'].includes(status)) continue;

    const day = p?.day;
    const start = Number(p?.hour);
    const span = Number(p?.span || 1);
    if (!day || !Number.isInteger(start) || !Number.isFinite(span) || span < 1) continue;

    if (!updated[day]) updated[day] = {};
    for (let i = 0; i < span; i++) {
      const hourKey = String(start + i);
      const slot = updated[day][hourKey];
      if (slot === false || slot === 'unavailable') continue;
      updated[day][hourKey] = status === 'accepted' ? 'booked' : 'pending';
    }
  }
  return updated;
}

/* ----------------- utils ----------------- */

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}
