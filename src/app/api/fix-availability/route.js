import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

const daysMap = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export async function GET() {
  await connectToDatabase();

  const cleaners = await Cleaner.find({});
  let fixedCount = 0;

  for (const cleaner of cleaners) {
    let fixed = false;
    const newAvailability = {};

    for (const key in cleaner.availability || {}) {
      const value = cleaner.availability[key];

      // Convert Mon-7 format
      if (key.includes('-')) {
        const [dayShort, hour] = key.split('-');
        const fullDay = daysMap[dayShort];
        if (!newAvailability[fullDay]) newAvailability[fullDay] = {};
        newAvailability[fullDay][hour] = value;
        fixed = true;
      }

      // Convert { monday: false } format
      else if (typeof value === 'boolean') {
        const fullDay = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        if (!newAvailability[fullDay]) newAvailability[fullDay] = {};
        for (let i = 7; i <= 19; i++) {
          newAvailability[fullDay][i.toString()] = value;
        }
        fixed = true;
      }

      // Already correct
      else if (typeof value === 'object') {
        newAvailability[key] = value;
      }
    }

    if (fixed) {
      cleaner.availability = newAvailability;
      await cleaner.save();
      fixedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    message: `✅ Fixed availability for ${fixedCount} cleaners.`,
  });
}
