import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking'; // ✅ Capitalised model name
import { verifyToken } from '@/lib/auth'; // ✅ Correct JWT middleware

export async function GET(req, { params }) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken(req);

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorised' }), { status: 401 });
    }

    // ✅ Ensure only clients can view their own bookings
    if (user.type !== 'client' || user.id !== params.id) {
      return new Response(JSON.stringify({ success: false, message: 'Access denied.' }), { status: 403 });
    }

    const bookings = await Booking.find({ clientId: params.id });

    return new Response(JSON.stringify(bookings), { status: 200 });
  } catch (err) {
    console.error('❌ Fetch Client Bookings Error:', err.message);
    return new Response(JSON.stringify({ message: 'Error fetching bookings' }), { status: 500 });
  }
}
