import { connectToDatabase } from '@/lib/db';
import booking from '@/models/booking';
import { verifyToken } from '@/middleware/verifyToken'; // 🔐 Import JWT middleware

// POST - Create Booking (🔒 Protected)
export async function POST(req) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken(req);

    // ✅ Only clients should create bookings
    if (user.userType !== 'client') {
      return new Response(JSON.stringify({ message: 'Access denied.' }), { status: 403 });
    }

    const data = await req.json();

    // ✅ Optional: Automatically attach the client ID to the booking
    const newBooking = await booking.create({ ...data, clientId: user.id });

    return new Response(JSON.stringify({ message: 'Booking created', booking: newBooking }), { status: 201 });
  } catch (err) {
    console.error('❌ Booking Error:', err.message);
    return new Response(JSON.stringify({ message: err.message }), { status: 401 });
  }
}

// GET - Get All Bookings (🔒 Protected, should limit access)
export async function GET(req) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken(req);

    let bookings;

    if (user.userType === 'admin') {
      // ✅ Admin can see all bookings
      bookings = await booking.find();
    } else if (user.userType === 'client') {
      // ✅ Clients can only see their own bookings
      bookings = await booking.find({ clientId: user.id });
    } else {
      return new Response(JSON.stringify({ message: 'Access denied.' }), { status: 403 });
    }

    return new Response(JSON.stringify(bookings), { status: 200 });
  } catch (err) {
    console.error('❌ Booking Fetch Error:', err.message);
    return new Response(JSON.stringify({ message: err.message }), { status: 401 });
  }
}
