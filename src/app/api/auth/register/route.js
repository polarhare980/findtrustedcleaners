import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';

// 💡 UTILITY FUNCTIONS

function validateCleanerFields(body) {
  const {
    realName, companyName, email, password, phone, rates, services,
    houseNameNumber, street, county, postcode
  } = body;

  const validationErrors = [];

  if (!realName?.trim()) validationErrors.push('Real name is required');
  if (!companyName?.trim()) validationErrors.push('Company name is required');
  if (!email?.trim()) validationErrors.push('Email is required');
  if (!password) validationErrors.push('Password is required');
  if (!phone?.trim()) validationErrors.push('Phone number is required');
  if (rates === undefined || rates === null || rates === '' || isNaN(rates) || rates <= 0) validationErrors.push('Valid hourly rate is required');
  if (!Array.isArray(services) || services.length === 0) validationErrors.push('At least one service must be selected');
  if (!houseNameNumber?.trim()) validationErrors.push('House name/number is required');
  if (!street?.trim()) validationErrors.push('Street is required');
  if (!county?.trim()) validationErrors.push('County is required');
  if (!postcode?.trim()) validationErrors.push('Postcode is required');

  return validationErrors;
}

function validateClientFields(body) {
  const { fullName, phone, houseNameNumber, street, county, postcode, email, password } = body;

  const validationErrors = [];

  if (!fullName?.trim()) validationErrors.push('Full name is required');
  if (!email?.trim()) validationErrors.push('Email is required');
  if (!password) validationErrors.push('Password is required');
  if (!phone?.trim()) validationErrors.push('Phone number is required');
  if (!houseNameNumber?.trim()) validationErrors.push('House name/number is required');
  if (!street?.trim()) validationErrors.push('Street is required');
  if (!county?.trim()) validationErrors.push('County is required');
  if (!postcode?.trim()) validationErrors.push('Postcode is required');

  return validationErrors;
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

function createAuthCookie(token) {
  return serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// 🚀 MAIN API HANDLER

export async function POST(req) {
  await connectToDatabase();
  console.log('✅ Register route hit');

  try {
    const body = await req.json();
    const { userType, email, password } = body;

    if (!userType || !email || !password) {
      console.log('❌ Missing basic fields');
      return NextResponse.json({ success: false, message: 'User type, email, and password are required.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = userType === 'cleaner'
      ? await Cleaner.findOne({ email: trimmedEmail })
      : await Client.findOne({ email: trimmedEmail });

    if (existingUser) {
      console.log('❌ User already exists');
      return NextResponse.json({ success: false, message: 'User already exists.' }, { status: 409 });
    }

    let newUser;
    let validationErrors = [];

    if (userType === 'cleaner') {
      validationErrors = validateCleanerFields(body);

      if (validationErrors.length > 0) {
        console.log('❌ Cleaner validation errors:', validationErrors);
        return NextResponse.json({ success: false, message: 'Validation errors', errors: validationErrors }, { status: 400 });
      }

      const hashedPassword = await hashPassword(password);

      newUser = new Cleaner({
        realName: body.realName.trim(),
        companyName: body.companyName.trim(),
        email: trimmedEmail,
        password: hashedPassword,
        phone: body.phone.trim(),
        rates: Number(body.rates),
        services: body.services,
        houseNameNumber: body.houseNameNumber.trim(),
        street: body.street.trim(),
        county: body.county.trim(),
        postcode: body.postcode.trim(),
        availability: body.availability,
        businessInsurance: body.businessInsurance || false
      });

    } else if (userType === 'client') {
      validationErrors = validateClientFields(body);

      if (validationErrors.length > 0) {
        console.log('❌ Client validation errors:', validationErrors);
        return NextResponse.json({ success: false, message: 'Validation errors', errors: validationErrors }, { status: 400 });
      }

      const hashedPassword = await hashPassword(password);

      newUser = new Client({
        fullName: body.fullName.trim(),
        email: trimmedEmail,
        password: hashedPassword,
        phone: body.phone.trim(),
        address: {
          houseNameNumber: body.houseNameNumber.trim(),
          street: body.street.trim(),
          county: body.county.trim(),
          postcode: body.postcode.trim(),
        },
      });

    } else {
      console.log('❌ Invalid user type');
      return NextResponse.json({ success: false, message: 'Invalid user type.' }, { status: 400 });
    }

    await newUser.save();
    console.log('✅ User saved successfully');

    const stringifiedUserId = newUser._id.toString();
    const token = createToken({ _id: stringifiedUserId, type: userType });
    const cookie = createAuthCookie(token);

    return new NextResponse(JSON.stringify({ success: true, id: stringifiedUserId, type: userType }), {
      status: 201,
      headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('❌ Registration error:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
