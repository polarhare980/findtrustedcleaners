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
      const cleaner = await Cleaner.findById(id).select('-password');
      if (!cleaner) {
        return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, cleaners: [cleaner] }, { status: 200 });
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

    // ✅ Prioritise premium cleaners first
    const cleaners = await Cleaner.find(query)
      .select('-password')
      .sort({ isPremium: -1 }); // Premium first

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

    // Ensure the new fields (address and insurance) are saved
    const cleaner = await Cleaner.create({
      realName: data.realName,
      companyName: data.companyName,
      houseNameNumber: data.houseNameNumber,  // New field
      street: data.street,                    // New field
      county: data.county,                    // New field
      postcode: data.postcode,
      email: data.email,
      phone: data.phone,
      password: data.password,
      rates: data.rates,
      availability: data.availability,
      services: data.services,
      businessInsurance: data.businessInsurance, // New field for business insurance
    });

    console.log('✅ Cleaner created:', cleaner._id);

    return NextResponse.json({ success: true, id: cleaner._id }, { status: 201 });
  } catch (err) {
    console.error('❌ Error creating cleaner:', err.message);
    return NextResponse.json({ success: false, message: 'Failed to create cleaner.' }, { status: 500 });
  }
}
