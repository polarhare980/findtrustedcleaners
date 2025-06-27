import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking'; // ✅ Capitalized model name
import { verifyToken } from '@/lib/auth'; // ✅ Correct JWT middleware

// DELETE Booking (🔒 Protected)
export async function DELETE(req, { params }) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken(req);

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorised' }), { status: 401 });
    }

    const existingBooking = await Booking.findById(params.id);

    if (!existingBooking) {
      return new Response(JSON.stringify({ success: false, message: 'Booking not found' }), { status: 404 });
    }

    // ✅ Allow only booking owner or admin to delete
    if (user.type === 'client' && existingBooking.clientId.toString() !== user.id) {
      return new Response(JSON.stringify({ success: false, message: 'Access denied.' }), { status: 403 });
    }

    await Booking.findByIdAndDelete(params.id);

    return new Response(JSON.stringify({ success: true, message: 'Booking cancelled successfully' }), { status: 200 });
  } catch (err) {
    console.error('❌ Booking Deletion Error:', err.message);
    return new Response(JSON.stringify({ success: false, message: 'Error processing request.' }), { status: 500 });
  }
}
