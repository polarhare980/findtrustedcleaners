import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import Cleaner from '@/models/Cleaner';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectToDatabase();

  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'No token provided' }, { status: 401 });
    }

    const data = await verifyToken({ headers: { get: () => `Bearer ${token}` } }); // ✅ match your verifyToken cookie reader

    if (!data?.id || !data?.type) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const Model = data.type === 'client' ? Client : Cleaner;
    const user = await Model.findById(data.id).select('-password');

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (err) {
    console.error('❌ Token verification error:', err.message);
    return NextResponse.json({ success: false, message: 'Token verification failed' }, { status: 401 });
  }
}
