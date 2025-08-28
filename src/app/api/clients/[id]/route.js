import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import { protectApiRoute } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET Client by ID (🔒 Protected)
export async function GET(req, context) {
  const { params } = context;

  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  if (user.type !== 'client' || String(user._id) !== String(params.id)) {
    console.log('🔐 GET Access Denied:');
    console.log('Session User ID:', user._id);
    console.log('Requested Param ID:', params.id);
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
export async function PUT(req, context) {
  const { params } = context;

  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  console.log('🔐 PUT Access Check:');
  console.log('Session User ID:', user._id);
  console.log('Requested Param ID:', params.id);

  if (String(user._id) !== String(params.id) && user.type !== 'admin') {
    console.log('🔐 PUT Access Denied: ID Mismatch');
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const { fullName, phone, address } = await req.json();

    const updatedClient = await Client.findByIdAndUpdate(
      params.id,
      {
        fullName,
        phone,
        address: {
          houseNameNumber: address.houseNameNumber,
          street: address.street,
          county: address.county,
          postcode: address.postcode,
        },
      },
      { new: true }
    );

    if (!updatedClient) {
      return NextResponse.json({ success: false, message: 'Client not found for update' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client updated successfully', client: updatedClient }, { status: 200 });
  } catch (err) {
    console.error('❌ MongoDB Update Error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// DELETE - Delete Client by ID (🔒 Protected)
export async function DELETE(req, context) {
  const { params } = context;

  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  console.log('🔐 DELETE Access Check:');
  console.log('Session User ID:', user._id);
  console.log('Requested Param ID:', params.id);

  if (String(user._id) !== String(params.id) && user.type !== 'admin') {
    console.log('🔐 DELETE Access Denied: ID Mismatch');
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const deletedClient = await Client.findByIdAndDelete(params.id);

    if (!deletedClient) {
      return NextResponse.json({ success: false, message: 'Client not found for deletion' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client deleted successfully' }, { status: 200 });
  } catch (err) {
    console.error('❌ MongoDB Delete Error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
