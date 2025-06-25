import { connectToDatabase } from '@/lib/db';
import booking from '@/models/booking';

export async function GET(req, { params }) {
  await connectToDatabase();

  try {
    const bookings = await booking.find({ clientId: params.id });

    return new Response(JSON.stringify(bookings), { status: 200 });
  } catch (err) {
    console.error('❌ Fetch Client Bookings Error:', err.message);
    return new Response(JSON.stringify({ message: 'Error fetching bookings' }), { status: 500 });
  }
}
