import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();

  try {
    const body = await req.json();
    console.log('📥 Received cleaner registration data:', JSON.stringify(body, null, 2));

    const { realName, companyName, email, password, phone, rates, services, houseNameNumber, street, county, postcode, availability, businessInsurance } = body;

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

    if (validationErrors.length > 0) {
      console.log('❌ Validation failed:', validationErrors);
      return NextResponse.json({
        success: false,
        message: 'Please fill in all required fields correctly.',
        errors: validationErrors
      }, { status: 400 });
    }

    const existingCleaner = await Cleaner.findOne({ email: email.trim().toLowerCase() });
    if (existingCleaner) {
      console.log('❌ Cleaner already exists with email:', email);
      return NextResponse.json({ success: false, message: 'A cleaner with this email already exists.' }, { status: 409 });
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    const newCleaner = new Cleaner({
      realName: realName.trim(),
      companyName: companyName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: phone.trim(),
      rates: Number(rates),
      services,
      houseNameNumber: houseNameNumber.trim(),
      street: street.trim(),
      county: county.trim(),
      postcode: postcode.trim(),
      availability,
      businessInsurance
    });

    await newCleaner.save();
    console.log('✅ Cleaner saved to database');

    const token = createToken({ _id: newCleaner._id.toString(), type: 'cleaner' });

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful!',
      id: newCleaner._id.toString(),
      type: 'cleaner'
    }, {
      status: 201,
      headers: { 'Set-Cookie': cookie }
    });

  } catch (err) {
    console.error('💥 Error during cleaner registration:', err);

    if (err.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'A cleaner with this email already exists.'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    }, { status: 500 });
  }
}
