import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth'; // ✅ Correct JWT middleware path

// PUT - Update cleaner profile (🔒 Protected)
export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;
  const body = await req.json();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken(req);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    // ✅ Only the owner or admin can update
    if (user.id !== id && user.type !== 'admin') {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
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
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cleaner: updated });
  } catch (err) {
    console.error('❌ Error updating cleaner:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// GET - Fetch single cleaner profile (💬 Public)
export async function GET(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  try {
    const cleaner = await Cleaner.findById(id).select('-password');
    if (!cleaner) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cleaner });
  } catch (err) {
    console.error('❌ Error fetching cleaner:', err);
    return NextResponse.json({ success: false, message: 'Error fetching cleaner' }, { status: 500 });
  }
}
