import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { detectTextFromBuffer } from '@/lib/detectText';
import { Buffer } from 'buffer';

// Ensure long-running Node runtime with more time budget.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // seconds; bump if your plan allows

// Utility: promise timeout
function withTimeout(promise, ms, onTimeoutMsg = 'Timed out') {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(onTimeoutMsg)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

export const POST = async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded.' }, { status: 400 });
    }

    // Optional: basic validation (prevents huge/unsupported files stalling the route)
    const contentType = file.type || '';
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowed.includes(contentType)) {
      return NextResponse.json({ success: false, message: 'Unsupported file type.' }, { status: 415 });
    }
    // If `size` exists on your runtime's File: guard extremes (tweak to taste)
    const size = file.size ?? 0;
    const MAX_BYTES = 8 * 1024 * 1024; // 8MB
    if (size && size > MAX_BYTES) {
      return NextResponse.json({ success: false, message: 'File too large.' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1) OCR with a soft timeout (don’t block the route)
    let hasText = false;
    try {
      hasText = await withTimeout(
        detectTextFromBuffer(buffer),
        8000, // 8s soft limit for OCR
        'OCR timed out'
      );
    } catch (ocrErr) {
      // Non-fatal — just log
      console.warn('🕒 OCR skipped:', ocrErr?.message || ocrErr);
      hasText = false;
    }

    // 2) Upload to Cloudinary with a hard timeout
    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'findtrustedcleaners',
          resource_type: 'image',
          // You can also set transformation/format here if needed
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    const result = await withTimeout(
      uploadPromise,
      45000, // 45s hard limit for upload phase
      'Cloud upload timed out'
    );

    return NextResponse.json(
      {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        hasText,
      },
      { status: 201 }
    );
  } catch (error) {
    // Map timeouts to 504 so the client can show a clear message
    const msg = String(error?.message || '');
    const isTimeout =
      msg.includes('timed out') ||
      msg.includes('ETIMEOUT') ||
      msg.includes('Cloud upload timed out');

    const status = isTimeout ? 504 : 500;
    console.error('❌ Upload error:', msg);
    return NextResponse.json(
      { success: false, message: isTimeout ? 'Upload timed out.' : 'Upload failed.' },
      { status }
    );
  }
};
