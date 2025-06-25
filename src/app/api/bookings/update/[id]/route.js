import { connectToDatabase } from '@/lib/db';
import booking from '@/models/booking'; // ✅ Lowercase as you requested

// PUT - Update booking status
export async function PUT(req, { params }) {
  await connectToDatabase();

  try {
    const { status } = await req.json();

    // ✅ Validate status, including 'rejected'
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return new Response(JSON.stringify({ message: 'Invalid status value' }), { status: 400 });
    }

    // ✅ Update booking status (handles accept/reject)
    const updatedBooking = await booking.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    );

    if (!updatedBooking) {
      return new Response(JSON.stringify({ message: 'Booking not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: `Booking ${status} successfully`, booking: updatedBooking }), { status: 200 });
  } catch (err) {
    console.error('❌ Booking Update Error:', err.message);
    return new Response(JSON.stringify({ message: 'Error updating booking' }), { status: 500 });
  }
}
