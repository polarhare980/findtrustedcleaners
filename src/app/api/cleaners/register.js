import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { createToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();

  try {
    const body = await req.json();
    console.log('📥 Received registration data:', JSON.stringify(body, null, 2));

    const { realName, companyName, email, password, phone, rates, services, address } = body;

    // Enhanced logging for debugging
    console.log('🔍 Field validation check:');
    console.log('realName:', realName, 'type:', typeof realName, 'trimmed:', realName?.trim());
    console.log('companyName:', companyName, 'type:', typeof companyName, 'trimmed:', companyName?.trim());
    console.log('email:', email, 'type:', typeof email, 'trimmed:', email?.trim());
    console.log('password:', password ? '[PROVIDED]' : '[MISSING]');
    console.log('phone:', phone, 'type:', typeof phone, 'trimmed:', phone?.trim());
    console.log('rates:', rates, 'type:', typeof rates);
    console.log('services:', services, 'type:', typeof services, 'isArray:', Array.isArray(services), 'length:', services?.length);
    console.log('address:', address, 'type:', typeof address);
    if (address) {
      console.log('  houseNameNumber:', address.houseNameNumber, 'trimmed:', address.houseNameNumber?.trim());
      console.log('  street:', address.street, 'trimmed:', address.street?.trim());
      console.log('  county:', address.county, 'trimmed:', address.county?.trim());
      console.log('  postcode:', address.postcode, 'trimmed:', address.postcode?.trim());
    }

    // Validate input with detailed error messages
    const validationErrors = [];

    if (!realName?.trim()) {
      validationErrors.push('Real name is required');
    }
    if (!companyName?.trim()) {
      validationErrors.push('Company name is required');
    }
    if (!email?.trim()) {
      validationErrors.push('Email is required');
    }
    if (!password) {
      validationErrors.push('Password is required');
    }
    if (!phone?.trim()) {
      validationErrors.push('Phone number is required');
    }
    if (rates === undefined || rates === null || rates === '' || isNaN(rates) || rates <= 0) {
      validationErrors.push('Valid hourly rate is required');
    }
    if (!Array.isArray(services)) {
      validationErrors.push('Services must be an array');
    } else if (services.length === 0) {
      validationErrors.push('At least one service must be selected');
    }
    if (!address || typeof address !== 'object') {
      validationErrors.push('Address is required');
    } else {
      if (!address.houseNameNumber?.trim()) {
        validationErrors.push('House name/number is required');
      }
      if (!address.street?.trim()) {
        validationErrors.push('Street is required');
      }
      if (!address.county?.trim()) {
        validationErrors.push('County is required');
      }
      if (!address.postcode?.trim()) {
        validationErrors.push('Postcode is required');
      }
    }

    if (validationErrors.length > 0) {
      console.log('❌ Validation failed:', validationErrors);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'Please fill in all required fields correctly.',
          errors: validationErrors
        }),
        { status: 400 }
      );
    }

    console.log('✅ All validation checks passed');

    // Check if cleaner already exists
    const existingCleaner = await Cleaner.findOne({ email: email.trim().toLowerCase() });
    if (existingCleaner) {
      console.log('❌ Cleaner already exists with email:', email);
      return new NextResponse(
        JSON.stringify({ success: false, message: 'A cleaner with this email already exists.' }),
        { status: 409 }
      );
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new cleaner
    console.log('💾 Creating new cleaner...');
    const newCleaner = new Cleaner({
      realName: realName.trim(),
      companyName: companyName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: phone.trim(),
      rates: Number(rates),
      services: services,
      address: {
        houseNameNumber: address.houseNameNumber.trim(),
        street: address.street.trim(),
        county: address.county.trim(),
        postcode: address.postcode.trim()
      },
    });

    await newCleaner.save();
    console.log('✅ Cleaner saved to database');

    // Create login token
    const stringifiedUserId = newCleaner._id.toString();
    const token = createToken({ _id: stringifiedUserId, type: 'cleaner' });

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('🎉 Cleaner registered and logged in successfully:', stringifiedUserId);

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Registration successful!',
        id: stringifiedUserId, 
        type: 'cleaner' 
      }),
      {
        status: 201,
        headers: { 
          'Set-Cookie': cookie, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (err) {
    console.error('💥 Error during cleaner registration:', err);
    
    // Handle specific MongoDB errors
    if (err.code === 11000) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'A cleaner with this email already exists.' 
        }),
        { status: 409 }
      );
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'Please check your input and try again.',
          errors: validationErrors
        }),
        { status: 400 }
      );
    }

    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: 'An unexpected error occurred. Please try again.' 
      }),
      { status: 500 }
    );
  }
}
