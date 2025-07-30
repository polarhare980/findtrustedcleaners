import dbConnect from "@/lib/dbConnect";
import Cleaner from "@/models/Cleaner";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// 🧠 Compute bookingStatus from nested availability object
function determineBookingStatus(availability) {
  let hasAvailable = false;
  let hasPending = false;

  for (const day in availability) {
    for (const hour in availability[day]) {
      const val = availability[day][hour];
      if (val === true) hasAvailable = true;
      if (val === 'pending') hasPending = true;
    }
  }

  if (hasAvailable) return 'available';
  if (hasPending) return 'pending';
  return 'booked';
}

// GET - Fetch cleaner(s)
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const postcode = searchParams.get('postcode')?.trim() || '';
  const minRating = parseFloat(searchParams.get('minRating')) || 0;
  const bookingStatus = searchParams.get('bookingStatus') || 'all';
  const serviceType = searchParams.get('serviceType')?.trim();


  try {
    if (id) {
      const cleaner = await Cleaner.findById(id).select('-password');

      if (!cleaner) {
        return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        cleaner: {
          _id: cleaner._id,
          realName: cleaner.realName,
          companyName: cleaner.companyName,
          postcode: cleaner.postcode,
          image: cleaner.image || '/default-avatar.png',
          rates: cleaner.rates,
          isPremium: cleaner.isPremium,
          rating: cleaner.rating || null,
          availability: cleaner.availability || {},
          googleReviewUrl: cleaner.googleReviewUrl || null,
          facebookReviewUrl: cleaner.facebookReviewUrl || null,
          googleReviewRating: cleaner.googleReviewRating || null,
          googleReviewCount: cleaner.googleReviewCount || 0,
        }
      }, { status: 200 });
    }

    const query = {};

    // ✅ Expanded service area support
    if (postcode && postcode.length >= 2) {
      query.$or = [
        { 'address.postcode': { $regex: postcode, $options: 'i' } },
        { additionalPostcodes: { $regex: postcode, $options: 'i' } }
      ];
    }

    if (minRating > 0) {
      query.rating = { $gte: minRating };
    }

    if (serviceType) {
  query.services = { $in: [serviceType] };
}


    const rawCleaners = await Cleaner.find(query)
      .select('-password')
      .sort({ isPremium: -1 });

    const cleaners = rawCleaners.map(obj => {
      try {
        const c = typeof obj.toObject === 'function' ? obj.toObject() : JSON.parse(JSON.stringify(obj));

        const bookingStatusDerived = determineBookingStatus(c.availability || {});

        return {
          _id: c._id,
          realName: c.realName,
          companyName: c.companyName,
          postcode: c.postcode,
          image: c.image || '/default-avatar.png',
          rates: c.rates,
          isPremium: c.isPremium,
          rating: c.rating || null,
          availability: c.availability || {},
          googleReviewUrl: c.googleReviewUrl || null,
          facebookReviewUrl: c.facebookReviewUrl || null,
          googleReviewRating: c.googleReviewRating || null,
          googleReviewCount: c.googleReviewCount || 0,
          bookingStatus: bookingStatusDerived,
        };
      } catch (err) {
        console.error('❌ Failed to format cleaner object:', err);
        return null;
      }
    }).filter(Boolean);

    const finalFiltered = bookingStatus === 'all'
      ? cleaners
      : cleaners.filter(c => c.bookingStatus === bookingStatus);

    return NextResponse.json({ success: true, cleaners: finalFiltered }, { status: 200 });
  } catch (err) {
    console.error('❌ GET cleaner error:', err.message);
    return NextResponse.json({ success: false, message: 'Failed to fetch cleaner(s).' }, { status: 500 });
  }
}


// POST - Register new cleaner
export async function POST(req) {
  await dbConnect();
  const data = await req.json();

  try {
    const existing = await Cleaner.findOne({ email: data.email });

    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already in use.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const cleaner = await Cleaner.create({
      realName: data.realName,
      companyName: data.companyName,
      houseNameNumber: data.houseNameNumber,
      street: data.street,
      county: data.county,
      postcode: data.postcode,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      rates: data.rates,
      availability: data.availability,
      services: data.services,
      businessInsurance: data.businessInsurance,
      googleReviewRating: data.googleReviewRating || null,
      googleReviewCount: data.googleReviewCount || 0,
      googleReviewUrl: data.googleReviewUrl || '',
    });

    return NextResponse.json({ success: true, id: cleaner._id }, { status: 201 });
  } catch (err) {
    console.error('❌ Error creating cleaner:', err.message);
    return NextResponse.json({ success: false, message: 'Failed to create cleaner.' }, { status: 500 });
  }
}
