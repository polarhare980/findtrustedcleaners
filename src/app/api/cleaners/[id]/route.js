import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Purchase from '@/models/Purchase'; // ✅ New: Purchase Model
import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/auth';

// PUT - Update cleaner profile (🔒 Protected)
export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;
  const body = await req.json();

  // 🔐 Validate JWT token using protectRoute
  const { valid, user, response } = await protectRoute();
  if (!valid) return response;

  // ✅ Only the owner or admin can update
  if (user.id !== id && user.type !== 'admin') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
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

// GET - Fetch single cleaner profile (💬 Public with Private Split)
export async function GET(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  try {
    const cleaner = await Cleaner.findById(id).select('-password');
    if (!cleaner) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    // Public Data
    const publicData = {
      realName: cleaner.realName,
      postcode: cleaner.postcode,
      rates: cleaner.rates,
      services: cleaner.services,
      availability: cleaner.availability,
      profileImage: cleaner.profileImage || '/profile-placeholder.png',
    };

    // By default, only return public data
    let responseData = { ...publicData };
    let hasAccess = false;

    // 🔐 Check if the user has purchased access
    const { valid, user } = await protectRoute();

    if (valid && user && user.type === 'client') {
      const purchase = await Purchase.findOne({ clientId: user.id, cleanerId: id });

      if (purchase) {
        hasAccess = true;

        responseData = {
          ...publicData,
          phone: cleaner.phone,
          email: cleaner.email,
          companyName: cleaner.companyName,
        };
      }
    }

    return NextResponse.json({ success: true, cleaner: responseData, hasAccess });
  } catch (err) {
    console.error('❌ Error fetching cleaner:', err.message);
    return NextResponse.json({ success: false, message: 'Error fetching cleaner' }, { status: 500 });
  }
}
