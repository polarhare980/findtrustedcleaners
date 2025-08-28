import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { protectApiRoute } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

export async function POST(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid || user.type !== 'cleaner') return response;

  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ success: false, message: 'Missing public_id' }, { status: 400 });
    }

    // 1. Confirm image belongs to the cleaner
    const cleaner = await Cleaner.findById(user._id);
    if (!cleaner) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    const imageToRemove = cleaner.photos?.find((p) => p.public_id === public_id);
    if (!imageToRemove) {
      return NextResponse.json({ success: false, message: 'Image not found in your gallery' }, { status: 403 });
    }

    // 2. Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);
    if (result.result !== 'ok') {
      return NextResponse.json({ success: false, message: 'Cloudinary delete failed' }, { status: 500 });
    }

    // 3. Remove from MongoDB
    cleaner.photos = cleaner.photos.filter((p) => p.public_id !== public_id);
    await cleaner.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error in delete-photo route:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
