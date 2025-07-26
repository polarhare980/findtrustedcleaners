import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { detectTextFromBuffer } from '@/lib/detectText'; // 🧠 OCR util
import { Buffer } from 'buffer';

export const POST = async (req) => {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded.' }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 🧠 Step 1: Detect text in the image
    const hasText = await detectTextFromBuffer(buffer);

    // 🧠 Step 2: Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'findtrustedcleaners',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      hasText, // ✅ OCR flag returned to frontend
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Upload error:', error.message);
    return NextResponse.json({ success: false, message: 'Upload failed.' }, { status: 500 });
  }
};
