const DAY_MS = 24 * 60 * 60 * 1000;

export const PURCHASE_RETENTION_DAYS = {
  active: 365,
  inactive: 90,
};

export function getPurchaseExpiryDate(status, now = new Date()) {
  const normalized = String(status || '').toLowerCase();
  const days = ['accepted', 'approved', 'confirmed', 'booked'].includes(normalized)
    ? PURCHASE_RETENTION_DAYS.active
    : PURCHASE_RETENTION_DAYS.inactive;

  return new Date(now.getTime() + days * DAY_MS);
}
