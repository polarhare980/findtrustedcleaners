import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Purchase from '@/models/Purchase';
import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/auth';

// 🔒 PUT - Update cleaner profile (Protected)
export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;
  const body = await req.json();

  const { valid, user, response } = await protectRoute(req);
  if (!valid) return response;

  console.log('🔐 PUT Access Check:');
  console.log('Session User ID:', user._id?.toString());
  console.log('Requested Param ID:', id);

  if (String(user._id?.toString()) !== String(id) && user.type !== 'admin') {
    console.log('🔐 PUT Access Denied: ID Mismatch');
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    // ✅ Fully allow all updates including image
    const updated = await Cleaner.findByIdAndUpdate(
      id,
      {
        ...body,
        googleReviewUrl: body.googleReviewUrl || '',
        facebookReviewUrl: body.facebookReviewUrl || '',
        embedCode: body.embedCode || '',
        image: body.image || '', // ✅ Support updating image
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

// 💬 GET - Fetch single cleaner profile (Public View + Private Unlock Check)
export async function GET(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  try {
    const cleaner = await Cleaner.findById(id).select('-password');
    if (!cleaner) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    // Base public data
    const publicData = {
      realName: cleaner.realName,
      postcode: cleaner.postcode,
      rates: cleaner.rates,
      services: cleaner.services,
      availability: cleaner.availability,
      image: cleaner.image || '/profile-placeholder.png', // ✅ Use correct field
    };

    let responseData = { ...publicData };
    let hasAccess = false;

    // Check session and purchase
    const { valid, user } = await protectRoute(req);

    if (valid && user && user.type === 'client') {
      const purchase = await Purchase.findOne({ clientId: user._id, cleanerId: id });

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

