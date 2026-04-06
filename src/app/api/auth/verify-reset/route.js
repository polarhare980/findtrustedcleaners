import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      deprecated: true,
      message: 'Verification codes have been replaced by secure reset links. Please request a new password reset email.',
    },
    { status: 410 }
  );
}
