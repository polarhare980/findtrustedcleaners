import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner.js';
import Client from '@/models/Client.js';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

const FULL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i)); // "7".."19"

function sanitizeAvailability(input = {}) {
  // Build a dense base: default 'unavailable', keep only true where explicitly available
  const out = {};
  for (const day of FULL_DAYS) {
    out[day] = {};
    for (const h of HOURS) {
      const raw = input?.[day]?.[h];
      out[day][h] = raw === true ? true : 'unavailable';
    }
  }
  return out;
}

function sendCookie(userId, userType) {
  const token = createToken({ _id: userId, type: userType });
  const cookie = serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return new NextResponse(JSON.stringify({ success: true, id: userId, type: userType }), {
    status: 201,
    headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
  });
}

export async function POST(req) {
  await connectToDatabase();
  console.log('✅ Unified Register route hit');

  try {
    const body = await req.json();
    console.log('📨 Incoming registration payload:', body);

    const { userType, email, password } = body || {};
    if (!userType || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // =========================
    // CLEANER REGISTRATION
    // =========================
    if (userType === 'cleaner') {
      const {
        realName,
        companyName,
        phone,
        rates,
        services,
        // address fields sent flat from form:
        houseNameNumber,
        street,
        county,
        postcode,
        availability,                 // from UI (may already be dense)
        businessInsurance = false,
        dbsChecked = false,
      } = body || {};

      // Basic validation
      if (
        !realName || !companyName || !phone || rates == null ||
        !houseNameNumber || !street || !county || !postcode
      ) {
        return NextResponse.json({ success: false, message: 'All cleaner fields are required.' }, { status: 400 });
      }
      if (!Array.isArray(services) || services.length === 0) {
        return NextResponse.json({ success: false, message: 'Please select at least one service.' }, { status: 400 });
      }

      const existingCleaner = await Cleaner.findOne({ email: trimmedEmail }).lean();
      if (existingCleaner) {
        console.log('❌ Cleaner already exists:', trimmedEmail);
        return NextResponse.json({ success: false, message: 'Cleaner already exists.' }, { status: 409 });
      }

      // Ensure numeric rate
      const numericRate = Number(rates);
      if (!Number.isFinite(numericRate) || numericRate <= 0) {
        return NextResponse.json({ success: false, message: 'Hourly rate must be a positive number.' }, { status: 400 });
      }

      // Normalize availability to dense base
      const cleanAvailability = sanitizeAvailability(availability);

      // Hash password (Cleaner model typically doesn’t have pre-save hashing)
      const hashedPassword = await bcrypt.hash(String(password).trim(), 10);

      const newCleaner = await Cleaner.create({
        realName: String(realName).trim(),
        companyName: String(companyName).trim(),
        email: trimmedEmail,
        password: hashedPassword,
        phone: String(phone).trim(),
        rates: numericRate,
        services,
        // Map into nested address object expected by the model
        address: {
          houseNameNumber: String(houseNameNumber).trim(),
          street: String(street).trim(),
          county: String(county).trim(),
          postcode: String(postcode).trim(),
        },
        availability: cleanAvailability,
        businessInsurance: !!businessInsurance,
        dbsChecked: !!dbsChecked,
      });

      console.log('✅ Cleaner saved:', newCleaner._id.toString());
      return sendCookie(newCleaner._id.toString(), 'cleaner');
    }

    // =========================
    // CLIENT REGISTRATION
    // =========================
    if (userType === 'client') {
      const {
        fullName,
        phone,
        houseNameNumber,
        street,
        county,
        postcode,
      } = body || {};

      if (!fullName || !phone || !houseNameNumber || !street || !county || !postcode) {
        return NextResponse.json({ success: false, message: 'All client fields are required.' }, { status: 400 });
      }

      const existingClient = await Client.findOne({ email: trimmedEmail }).lean();
      if (existingClient) {
        console.log('❌ Client already exists:', trimmedEmail);
        return NextResponse.json({ success: false, message: 'Client already exists.' }, { status: 409 });
      }

      // Note: assuming Client model has pre('save') hashing
      const newClient = await Client.create({
        fullName: String(fullName).trim(),
        email: trimmedEmail,
        password: String(password).trim(),
        phone: String(phone).trim(),
        address: {
          houseNameNumber: String(houseNameNumber).trim(),
          street: String(street).trim(),
          county: String(county).trim(),
          postcode: String(postcode).trim(),
        },
      });

      console.log('✅ Client saved:', newClient._id.toString());
      return sendCookie(newClient._id.toString(), 'client');
    }

    return NextResponse.json({ success: false, message: 'Invalid user type.' }, { status: 400 });
  } catch (err) {
    console.error('❌ Registration error:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
