import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    return NextResponse.json({ success: true, user: decoded });
  } catch (err) {
    console.error('❌ Auth check error:', err.message);
    return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
  }
}
