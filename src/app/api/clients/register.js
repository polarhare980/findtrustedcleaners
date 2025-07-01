import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  await connectToDatabase();

  try {
    const { fullName, email, password, phone, address } = await req.json();

    // Validate input
    if (!fullName || !email || !password || !phone || !address) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'All fields are required' }),
        { status: 400 }
      );
    }

    // Check if client already exists
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Client already exists' }),
        { status: 400 }
      );
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new client with hashed password
    const newClient = new Client({
      fullName,
      email,
      password: hashedPassword, // Save the hashed password
      phone,
      address,
    });

    await newClient.save();

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Client registered successfully' }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error during client registration:', err);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500 }
    );
  }
}
