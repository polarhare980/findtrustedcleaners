import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { protectApiRoute } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.findtrustedcleaners.com';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { valid, user, response } = await protectApiRoute(req);
    if (!valid) return response;
    if (user?.type !== 'cleaner') return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const cleanerId = String(body?.cleanerId || user?._id || user?.id || '');
    if (!cleanerId) return NextResponse.json({ error: 'Missing cleanerId' }, { status: 400 });

    await connectToDatabase();
    const cleaner = await Cleaner.findById(cleanerId);
    if (!cleaner) return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 });

    let customerId = cleaner.stripeCustomerId;
    if (!customerId && cleaner.email) {
      const list = await stripe.customers.list({ email: cleaner.email, limit: 1 });
      if (list?.data?.[0]) {
        customerId = list.data[0].id;
        cleaner.stripeCustomerId = customerId;
        await cleaner.save();
      }
    }

    if (!customerId) return NextResponse.json({ error: 'No Stripe customer found for this cleaner yet.' }, { status: 400 });

    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${SITE_URL}/cleaners/dashboard` });
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    console.error('❌ Portal error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create portal session' }, { status: 500 });
  }
}
