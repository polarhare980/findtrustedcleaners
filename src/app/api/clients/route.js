import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server'; // ✅ Correct import

export async function POST(req) {
  await connectToDatabase();

  try {
    const data = await req.json();

    // ✅ Check if the email is already registered
    const existing = await Client.findOne({ email: data.email });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already in use.' }, { status: 400 });
    }

    // ✅ Hash the password before saving
    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;

    const client = await Client.create(data);
    return NextResponse.json({ success: true, id: client._id });
  } catch (err) {
    console.error('❌ Error creating client:', err.message);
    return NextResponse.json({ success: false, message: 'Failed to create client.' }, { status: 500 });
  }
}
