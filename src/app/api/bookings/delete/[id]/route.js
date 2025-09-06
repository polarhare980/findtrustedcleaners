import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import { protectApiRoute } from '@/lib/auth';

export async function DELETE(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  try {
    const existingBooking = await Booking.findById(params.id);

    if (!existingBooking) {
      return new Response(JSON.stringify({ success: false, message: 'Booking not found' }), { status: 404 });
    }

    // ✅ Allow only booking owner or admin to delete
    const isClientOwner =
      user.type === 'client' && existingBooking.clientId.toString() === user._id;
    const isAdmin = user.type === 'admin';

    if (!isClientOwner && !isAdmin) {
      return new Response(JSON.stringify({ success: false, message: 'Access denied.' }), { status: 403 });
    }

    await Booking.findByIdAndDelete(params.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Booking cancelled successfully' }),
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Booking Deletion Error:', err.message);
    return new Response(JSON.stringify({ success: false, message: 'Error processing request.' }), {
      status: 500,
    });
  }
}
