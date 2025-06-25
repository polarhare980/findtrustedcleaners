import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';

export async function GET(req, { params }) {
  await dbConnect();
  const { id } = params;

  try {
    const cleaner = await Cleaner.findById(id).select(['realName', 'postcode', 'rates', 'availability', 'services'].join(''));
    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 });
    }

    return NextResponse.json(cleaner);
  } catch (error) {
    console.error('API error fetching cleaner:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}