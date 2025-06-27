import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export const POST = async (req) => {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded.' }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'findtrustedcleaners' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({ success: true, url: result.secure_url }, { status: 201 });
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    return NextResponse.json({ success: false, message: 'Upload failed.' }, { status: 500 });
  }
};
