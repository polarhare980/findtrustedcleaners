import { connectToDatabase } from '@/lib/db';
import booking from '@/models/booking';
import { verifyToken } from '@/middleware/verifyToken'; // 🔐 Import JWT middleware

// DELETE Booking (🔒 Protected)
export async function DELETE(req, { params }) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken(req);

    // ✅ Optional: Only allow the booking owner or an admin to cancel
    const existingBooking = await booking.findById(params.id);

    if (!existingBooking) {
      return new Response(JSON.stringify({ message: 'Booking not found' }), { status: 404 });
    }

    // 🚨 Optional security check: Only allow the owner (if you store clientId in booking)
    if (user.userType === 'client' && existingBooking.clientId.toString() !== user.id) {
      return new Response(JSON.stringify({ message: 'Access denied.' }), { status: 403 });
    }

    await booking.findByIdAndDelete(params.id);

    return new Response(JSON.stringify({ message: 'Booking cancelled successfully' }), { status: 200 });
  } catch (err) {
    console.error('❌ Booking Deletion Error:', err.message);
    return new Response(JSON.stringify({ message: err.message }), { status: 401 });
  }
}
