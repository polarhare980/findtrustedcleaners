import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import { protectRoute } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET Client by ID (🔒 Protected)
export async function GET(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectRoute();
  if (!valid) return response;

  if (user.id !== params.id && user.type !== 'admin') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const client = await Client.findById(params.id).lean();

    if (!client) {
      return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client }, { status: 200 });
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// PUT - Update Client by ID (🔒 Protected)
export async function PUT(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectRoute();
  if (!valid) return response;

  if (user.id !== params.id && user.type !== 'admin') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const data = await req.json();

    const updatedClient = await Client.findByIdAndUpdate(params.id, data, { new: true });

    if (!updatedClient) {
      return NextResponse.json({ success: false, message: 'Client not found for update' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client updated successfully', client: updatedClient }, { status: 200 });
  } catch (err) {
    console.error('❌ MongoDB Update Error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
