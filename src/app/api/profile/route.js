import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import Cleaner from '@/models/Cleaner';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  await connectToDatabase();

  try {
    const token = cookies().get('token')?.value;
    if (!token) return Response.json({ success: false, message: 'No token provided' }, { status: 401 });

    const data = verifyToken(token);
    if (!data?.id || !data?.type) return Response.json({ success: false, message: 'Invalid token' }, { status: 401 });

    const Model = data.type === 'client' ? Client : Cleaner;
    const user = await Model.findById(data.id).select('-password');
    if (!user) return Response.json({ success: false, message: 'User not found' }, { status: 404 });

    return Response.json({ success: true, user });
  } catch (err) {
    console.error('❌ Token verification error:', err.message);
    return Response.json({ success: false, message: 'Token verification failed' }, { status: 401 });
  }
}
