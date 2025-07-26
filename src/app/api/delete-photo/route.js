import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(req) {
  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ success: false, message: 'Missing public_id' }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== 'ok') {
      return NextResponse.json({ success: false, message: 'Cloudinary delete failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    return NextResponse.json({ success: false, message: 'Error deleting image.' }, { status: 500 });
  }
}
