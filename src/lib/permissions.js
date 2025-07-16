import { connectToDatabase } from './db';
import Purchase from '@/models/Purchase';

export async function hasClientUnlocked(cleanerId, clientEmail, day, hour) {
  await connectToDatabase();

  const purchase = await Purchase.findOne({
    cleanerId,
    clientId: clientEmail,
    day,
    hour,
    status: { $in: ['pending_approval', 'confirmed'] },
  });

  return !!purchase;
}
