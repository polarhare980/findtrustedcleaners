import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import { verifyToken } from '@/lib/auth'; // ✅ Correct path to JWT middleware
import { NextResponse } from 'next/server'; // ✅ Required for Next.js app routes

// GET Client by ID (🔒 Protected)
export async function GET(req, { params }) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken();

    // ✅ Correct field: should be user.type
    if (user.id !== params.id && user.type !== 'admin') {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    const client = await Client.findById(params.id).lean();

    if (!client) {
      return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client }, { status: 200 });
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 401 });
  }
}

// PUT - Update Client by ID (🔒 Protected)
export async function PUT(req, { params }) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken();

    // ✅ Correct field: should be user.type
    if (user.id !== params.id && user.type !== 'admin') {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    const data = await req.json();

    const updatedClient = await Client.findByIdAndUpdate(params.id, data, { new: true });

    if (!updatedClient) {
      return NextResponse.json({ success: false, message: 'Client not found for update' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client updated successfully', client: updatedClient }, { status: 200 });
  } catch (err) {
    console.error('❌ MongoDB Update Error:', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 401 });
  }
}
