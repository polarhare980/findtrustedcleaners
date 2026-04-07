const DAY_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export function parseAppointmentDate({ isoDate, day, hour }) {
  const hourNum = Number(hour);

  if (typeof isoDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const d = new Date(`${isoDate}T${String(Number.isFinite(hourNum) ? hourNum : 9).padStart(2, '0')}:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const wanted = DAY_INDEX[day];
  if (typeof wanted !== 'number') return null;

  const now = new Date();
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  const diff = (wanted - base.getDay() + 7) % 7;
  base.setDate(base.getDate() + diff);
  base.setHours(Number.isFinite(hourNum) ? hourNum : 9, 0, 0, 0);
  return base;
}

export function isUpcomingAppointment(appointmentAt) {
  if (!(appointmentAt instanceof Date) || Number.isNaN(appointmentAt.getTime())) return false;
  return appointmentAt.getTime() >= Date.now();
}
