import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/middleware/verifyToken'; // 🔐 Import your JWT middleware

// PUT - Update cleaner profile (🔒 Now protected)
export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;
  const body = await req.json();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken(req);

    // Optional: Check that the logged-in user matches the profile being updated
    if (user.id !== id && user.userType !== 'admin') {
      return NextResponse.json({ message: 'Access denied.' }, { status: 403 });
    }

    const updated = await Cleaner.findByIdAndUpdate(
      id,
      {
        ...body,
        googleReviewUrl: body.googleReviewUrl || '',
        facebookReviewUrl: body.facebookReviewUrl || '',
        embedCode: body.embedCode || '',
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: 'Cleaner not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('❌ Error updating cleaner:', err.message);
    return NextResponse.json({ message: err.message }, { status: 401 });
  }
}

// GET - Fetch single cleaner profile (💬 Typically public, no protection needed)
export async function GET(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  try {
    const cleaner = await Cleaner.findById(id).select('-password');
    if (!cleaner) {
      return NextResponse.json({ message: 'Cleaner not found' }, { status: 404 });
    }

    return NextResponse.json(cleaner);
  } catch (err) {
    console.error('❌ Error fetching cleaner:', err);
    return NextResponse.json({ message: 'Error fetching cleaner' }, { status: 500 });
  }
}
