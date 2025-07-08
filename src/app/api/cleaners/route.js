import dbConnect from "@/lib/dbConnect";
import Cleaner from "@/models/Cleaner";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// GET - Fetch cleaner(s) with optional filters (💬 Public)
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const postcode = searchParams.get('postcode')?.trim() || '';
  const minRating = parseFloat(searchParams.get('minRating')) || 0;
  const bookingStatus = searchParams.get('bookingStatus') || 'all';

  try {
    if (id) {
      console.log('🔍 API hit: Cleaner ID received:', id);

      const cleaner = await Cleaner.findById(id).select('-password');

      if (!cleaner) {
        console.log('❌ Cleaner not found for ID:', id);
        return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
      }

      console.log('✅ Cleaner found:', cleaner._id);

      // ✅ Return only public fields
      const publicCleaner = {
        _id: cleaner._id,
        realName: cleaner.realName,
        companyName: cleaner.companyName,
        postcode: cleaner.postcode,
        image: cleaner.image || '/profile-placeholder.png',
        rates: cleaner.rates,
        isPremium: cleaner.isPremium,
        rating: cleaner.rating || null,
        availability: cleaner.availability || {},
        googleReviewUrl: cleaner.googleReviewUrl || null,
        facebookReviewUrl: cleaner.facebookReviewUrl || null,
      };

      return NextResponse.json({ success: true, cleaner: publicCleaner }, { status: 200 });
    }

    const query = {};

    if (postcode && postcode.length >= 2) {
      query.postcode = { $regex: postcode, $options: 'i' };
    }

    if (minRating > 0) {
      query.rating = { $gte: minRating };
    }

    if (bookingStatus !== 'all') {
      query.bookingStatus = bookingStatus;
    }

    const rawCleaners = await Cleaner.find(query)
      .select('-password')
      .sort({ isPremium: -1 }); // Premium first

    const cleaners = rawCleaners.map(c => ({
      _id: c._id,
      realName: c.realName,
      companyName: c.companyName,
      postcode: c.postcode,
      image: c.image || '/profile-placeholder.png',
      rates: c.rates,
      isPremium: c.isPremium,
      rating: c.rating || null,
      availability: c.availability || {}, // ✅ include it
      googleReviewUrl: c.googleReviewUrl || null,
      facebookReviewUrl: c.facebookReviewUrl || null,
    }));

    console.log('✅ Found', cleaners.length, 'cleaner(s) for search query.');

    return NextResponse.json({ success: true, cleaners }, { status: 200 });
  } catch (err) {
    console.error('❌ GET cleaner error:', err.message);
    return NextResponse.json({ success: false, message: 'Failed to fetch cleaner(s).' }, { status: 500 });
  }
}

// POST - Register new cleaner (💬 Public)
export async function POST(req) {
  await dbConnect();
  const data = await req.json();
  console.log('👉 Received cleaner data:', data);

  try {
    const existing = await Cleaner.findOne({ email: data.email });

    if (existing) {
      console.log('⚠️ Email already registered:', data.email);
      return NextResponse.json({ success: false, message: 'Email already in use.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;

    const cleaner = await Cleaner.create({
      realName: data.realName,
      companyName: data.companyName,
      houseNameNumber: data.houseNameNumber,
      street: data.street,
      county: data.county,
      postcode: data.postcode,
      email: data.email,
      phone: data.phone,
      password: data.password,
      rates: data.rates,
      availability: data.availability,
      services: data.services,
      businessInsurance: data.businessInsurance,
    });

    console.log('✅ Cleaner created:', cleaner._id);

    return NextResponse.json({ success: true, id: cleaner._id }, { status: 201 });
  } catch (err) {
    console.error('❌ Error creating cleaner:', err.message);
    return NextResponse.json({ success: false, message: 'Failed to create cleaner.' }, { status: 500 });
  }
}
