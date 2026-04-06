import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import Purchase from '@/models/Purchase';
import Booking from '@/models/booking';
import { protectApiRoute, clearAuthCookieOnResponse } from '@/lib/auth';
import { NextResponse } from 'next/server';

function denied() {
  return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
}

export async function GET(req, context) {
  const params = await context?.params;
  const id = params?.id;

  await connectToDatabase();
  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
  if (user.type !== 'client' || String(user._id) !== String(id)) return denied();

  try {
    const client = await Client.findById(id).lean();
    if (!client) {
      return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, client }, { status: 200 });
  } catch (err) {
    console.error('❌ Client GET error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

export async function PUT(req, context) {
  const params = await context?.params;
  const id = params?.id;

  await connectToDatabase();
  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
  if (String(user._id) !== String(id) && user.type !== 'admin') return denied();

  try {
    const { fullName, phone, address } = await req.json();
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        fullName,
        phone,
        address: {
          houseNameNumber: address?.houseNameNumber || '',
          street: address?.street || '',
          county: address?.county || '',
          postcode: address?.postcode || '',
        },
      },
      { new: true }
    );

    if (!updatedClient) {
      return NextResponse.json({ success: false, message: 'Client not found for update' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client updated successfully', client: updatedClient }, { status: 200 });
  } catch (err) {
    console.error('❌ Client PUT error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  const params = await context?.params;
  const id = params?.id;

  await connectToDatabase();
  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
  if (String(user._id) !== String(id) && user.type !== 'admin') return denied();

  try {
    const deletedClient = await Client.findByIdAndDelete(id);
    if (!deletedClient) {
      return NextResponse.json({ success: false, message: 'Client not found for deletion' }, { status: 404 });
    }

    await Promise.all([
      Purchase.deleteMany({ clientId: id }),
      Booking.deleteMany({ clientId: id }),
    ]);

    const res = NextResponse.json({ success: true, message: 'Client deleted successfully' }, { status: 200 });
    clearAuthCookieOnResponse(res);
    return res;
  } catch (err) {
    console.error('❌ Client DELETE error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
