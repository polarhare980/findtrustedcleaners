import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner.js';
import Client from '@/models/Client.js';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

const FULL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i));

function sanitizeAvailability(input = {}) {
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

function slugifyServiceKey(name = '') {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function buildSimpleServicesDetailed(services = []) {
  return (services || [])
    .filter(Boolean)
    .map((name) => ({
      key: slugifyServiceKey(name),
      name: String(name).trim(),
      active: true,
      defaultDurationMins: 60,
    }));
}

function sendCookie(userId, userType) {
  const token = createToken({ _id: userId, type: userType });
  const cookie = serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return new NextResponse(JSON.stringify({ success: true, id: userId, type: userType }), {
    status: 201,
    headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
  });
}

export async function POST(req) {
  await connectToDatabase();

  try {
    const body = await req.json();
    const { userType, email, password } = body || {};

    if (!userType || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    if (userType === 'cleaner') {
      const {
        realName,
        companyName,
        phone,
        rates,
        services,
        houseNameNumber,
        street,
        town,
        county,
        postcode,
        availability,
        businessInsurance = false,
        dbsChecked = false,
      } = body || {};

      if (!realName || !companyName || !phone || !houseNameNumber || !street || !county || !postcode) {
        return NextResponse.json({ success: false, message: 'All required cleaner fields must be completed.' }, { status: 400 });
      }
      if (!Array.isArray(services) || services.length === 0) {
        return NextResponse.json({ success: false, message: 'Please select at least one service.' }, { status: 400 });
      }

      const existingCleaner = await Cleaner.findOne({ email: trimmedEmail }).lean();
      if (existingCleaner) {
        return NextResponse.json({ success: false, message: 'Cleaner already exists.' }, { status: 409 });
      }

      const numericRate =
        rates === '' || rates == null
          ? undefined
          : Number(String(rates).replace(/[^0-9.]/g, ''));

      if (numericRate !== undefined && (!Number.isFinite(numericRate) || numericRate < 0)) {
        return NextResponse.json({ success: false, message: 'Hourly rate must be a valid number.' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(String(password).trim(), 10);

      const newCleaner = await Cleaner.create({
        realName: String(realName).trim(),
        companyName: String(companyName).trim(),
        email: trimmedEmail,
        password: hashedPassword,
        phone: String(phone).trim(),
        rates: numericRate,
        services: services.map((s) => String(s).trim()).filter(Boolean),
        servicesDetailed: buildSimpleServicesDetailed(services),
        address: {
          houseNameNumber: String(houseNameNumber).trim(),
          street: String(street).trim(),
          town: String(town || '').trim(),
          county: String(county).trim(),
          postcode: String(postcode).trim(),
        },
        availability: sanitizeAvailability(availability),
        businessInsurance: !!businessInsurance,
        dbsChecked: !!dbsChecked,
      });

      return sendCookie(newCleaner._id.toString(), 'cleaner');
    }

    if (userType === 'client') {
      const { fullName, phone, houseNameNumber, street, county, postcode } = body || {};

      if (!fullName || !phone || !houseNameNumber || !street || !county || !postcode) {
        return NextResponse.json({ success: false, message: 'All client fields are required.' }, { status: 400 });
      }

      const existingClient = await Client.findOne({ email: trimmedEmail }).lean();
      if (existingClient) {
        return NextResponse.json({ success: false, message: 'Client already exists.' }, { status: 409 });
      }

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

      return sendCookie(newClient._id.toString(), 'client');
    }

    return NextResponse.json({ success: false, message: 'Invalid user type.' }, { status: 400 });
  } catch (err) {
    console.error('❌ Registration error:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
