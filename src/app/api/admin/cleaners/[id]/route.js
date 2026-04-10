import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';
import Purchase from '@/models/Purchase';
import Booking from '@/models/booking';
import Review from '@/models/Review';
import Client from '@/models/Client';
import User from '@/models/User';
import ResetToken from '@/models/ResetToken';

export const runtime = 'nodejs';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function getCleanerId(req, params) {
  const fromParams = params?.id;
  if (fromParams) return String(fromParams).trim();

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    return last ? decodeURIComponent(last).trim() : '';
  } catch {
    return '';
  }
}

export async function PATCH(req, { params }) {
  const { valid, response } = await protectApiRoute(req, 'admin');
  if (!valid) return response;

  const id = getCleanerId(req, params);
  const body = await req.json();
  if (!id) return json({ success: false, message: 'Missing id' }, 400);

  await dbConnect();

  const update = {};
  if (typeof body.slug === 'string') {
    const trimmed = body.slug.trim();
    if (trimmed) update.slug = trimmed;
  }
  if (typeof body.isVisible === 'boolean') update.isVisible = body.isVisible;

  try {
    const saved = await Cleaner.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!saved) return json({ success: false, message: 'Not found' }, 404);

    return json({
      success: true,
      data: { slug: saved.slug, isVisible: saved.isVisible },
      message: 'Cleaner updated',
    });
  } catch (e) {
    return json({ success: false, message: e.message }, 400);
  }
}

export async function DELETE(req, { params }) {
  const { valid, response } = await protectApiRoute(req, 'admin');
  if (!valid) return response;

  const id = getCleanerId(req, params);
  if (!id) return json({ success: false, message: 'Missing id' }, 400);

  await dbConnect();

  try {
    const cleaner = await Cleaner.findById(id).select('_id email companyName realName');
    if (!cleaner) {
      return json({ success: false, message: 'Cleaner not found' }, 404);
    }

    const cleanerId = cleaner._id;
    const cleanerEmail = cleaner.email;

    const [reviewsResult, purchasesResult, bookingsResult, favouritesResult, usersResult, resetTokensResult] = await Promise.all([
      Review.deleteMany({ cleanerId }),
      Purchase.deleteMany({ cleanerId }),
      Booking.deleteMany({ cleanerId }),
      Client.updateMany({ favorites: cleanerId }, { $pull: { favorites: cleanerId } }),
      User.deleteMany({
        $or: [
          { linkedId: cleanerId, type: 'cleaner' },
          ...(cleanerEmail ? [{ email: cleanerEmail }] : []),
        ],
      }),
      ResetToken.deleteMany({
        $or: [
          { userId: cleanerId },
          ...(cleanerEmail ? [{ email: cleanerEmail }] : []),
        ],
      }),
    ]);

    await Cleaner.findByIdAndDelete(cleanerId);

    return json({
      success: true,
      message: `${cleaner.companyName || cleaner.realName || 'Cleaner'} deleted`,
      deleted: {
        cleanerId: String(cleanerId),
        reviews: reviewsResult.deletedCount || 0,
        purchases: purchasesResult.deletedCount || 0,
        bookings: bookingsResult.deletedCount || 0,
        favouritesUpdated: favouritesResult.modifiedCount || 0,
        users: usersResult.deletedCount || 0,
        resetTokens: resetTokensResult.deletedCount || 0,
      },
    });
  } catch (e) {
    return json({ success: false, message: e.message || 'Failed to delete cleaner' }, 500);
  }
}
