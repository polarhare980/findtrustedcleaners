import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

export async function POST(req) {
  await connectToDatabase();

  try {
    const { realName, companyName, email, password, phone, rates, services, address } = await req.json();

    // Validate input
    if (!realName || !companyName || !email || !password || !phone || !rates || !services || !address) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'All fields are required' }),
        { status: 400 }
      );
    }

    // Check if cleaner already exists
    const existingCleaner = await Cleaner.findOne({ email });
    if (existingCleaner) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Cleaner already exists' }),
        { status: 400 }
      );
    }

    // Create new cleaner with hashed password
    const newCleaner = new Cleaner({
      realName,
      companyName,
      email,
      password, // This will get hashed automatically when saved
      phone,
      rates,
      services,
      address,
    });

    await newCleaner.save();

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Cleaner registered successfully' }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error during cleaner registration:', err);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500 }
    );
  }
}
