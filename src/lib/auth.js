// File: /app/api/auth/me/route.js

import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // ✅ Correct: Call verifyToken with no arguments
    const decoded = verifyToken();

    if (!decoded) {
      return NextResponse.json({ success: false, message: 'No token provided or invalid' }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: decoded });
  } catch (err) {
    console.error('❌ Auth check error:', err.message);
    return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
  }
}
