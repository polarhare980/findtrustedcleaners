import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';
import Link from 'next/link';
import RatingStars from '@/components/RatingStars';
import ReviewFormClient from '@/components/ReviewFormClient';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
async function fetchReviews(cleanerId) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  try { const res = await fetch(`${base}/api/public/cleaners/${cleanerId}/reviews`, { cache:'no-store' }); const json = await res.json(); return json?.data || []; } catch { return []; }
}
function ld(cleaner) {
  const data = { '@context':'https://schema.org','@type':'LocalBusiness', name: cleaner.companyName || cleaner.realName, url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/cleaners/' + (cleaner.slug || cleaner._id) };
  if (cleaner.ratingCount>0) data.aggregateRating = { '@type':'AggregateRating', ratingValue: Number(cleaner.ratingAvg||0).toFixed(1), reviewCount: cleaner.ratingCount };
  return JSON.stringify(data);
}
export default async function CleanerProfile({ params }) {
  const slug = params?.slug; let cleaner = null;
  if (process.env.USE_DEMO_DATA === 'true') cleaner = { _id:'c1', slug:'alice-johnson', realName:'Alice Johnson', companyName:'Sparkle Co.', ratingAvg:4.8, ratingCount:12, rates:{hourly:22} };
  else { await dbConnect(); cleaner = await Cleaner.findOne({ slug }, 'slug realName companyName rates ratingAvg ratingCount').lean(); }
  if (!cleaner) return <div className="container py-8">Cleaner not found.</div>;
  const reviews = await fetchReviews(cleaner._id);
  return (<main className="container py-6 space-y-6">
    <div><h1 className="text-2xl font-semibold">{cleaner.companyName || cleaner.realName}</h1>
      <div className="mt-1"><RatingStars value={Number(cleaner.ratingAvg||0)} count={Number(cleaner.ratingCount||0)} /></div>
      {cleaner.rates?.hourly && <div className="text-sm mt-1">Hourly rate: £{cleaner.rates.hourly}</div>}
      <div className="pt-2"><Link className="underline" href={`/`}>Back to list</Link></div>
    </div>
    <section className="space-y-3"><h3 className="text-lg font-semibold">Reviews</h3>
      {reviews.length===0 && <div className="text-sm text-slate-600">No reviews yet.</div>}
      <div className="space-y-2">{reviews.map((r, idx)=>(<div key={idx} className="rounded-xl border bg-white p-3 text-sm"><div className="font-medium">Rating: {r.rating} / 5</div>{r.text && <div className="text-slate-700 mt-1">{r.text}</div>}<div className="text-xs text-slate-500 mt-1">{new Date(r.createdAt).toLocaleDateString()}</div></div>))}</div>
    </section>
    <section className="space-y-3 rounded-2xl border p-4 bg-white/70"><h3 className="font-medium">Leave a review</h3><ReviewFormClient cleanerId={String(cleaner._id)} /></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(cleaner) }} />
  </main>);
}
