// app/api/test-db/route.js
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export async function GET() {
  try {
    await connectToDatabase();
    const count = await Purchase.countDocuments();
    return Response.json({ success: true, count });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
