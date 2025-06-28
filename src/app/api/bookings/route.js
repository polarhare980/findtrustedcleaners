import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking'; // ✅ Capitalised model
import { verifyToken } from '@/lib/auth'; // ✅ Correct JWT middleware location

// POST - Create Booking (🔒 Protected)
export async function POST(req) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken();

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorised' }), { status: 401 });
    }

    // ✅ Only clients should create bookings
    if (user.type !== 'client') {
      return new Response(JSON.stringify({ success: false, message: 'Access denied.' }), { status: 403 });
    }

    const data = await req.json();

    // ✅ Attach client ID automatically
    const newBooking = await Booking.create({ ...data, clientId: user.id });

    return new Response(JSON.stringify({ success: true, message: 'Booking created', booking: newBooking }), { status: 201 });
  } catch (err) {
    console.error('❌ Booking Creation Error:', err.message);
    return new Response(JSON.stringify({ success: false, message: 'Error processing booking.' }), { status: 500 });
  }
}

// GET - Get Bookings (🔒 Protected)
export async function GET(req) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken();

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorised' }), { status: 401 });
    }

    let bookings;

    if (user.type === 'admin') {
      // ✅ Admin can see all bookings
      bookings = await Booking.find();
    } else if (user.type === 'client') {
      // ✅ Clients can only see their own bookings
      bookings = await Booking.find({ clientId: user.id });
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Access denied.' }), { status: 403 });
    }

    return new Response(JSON.stringify({ success: true, bookings }), { status: 200 });
  } catch (err) {
    console.error('❌ Booking Fetch Error:', err.message);
    return new Response(JSON.stringify({ success: false, message: 'Error fetching bookings.' }), { status: 500 });
  }
}
