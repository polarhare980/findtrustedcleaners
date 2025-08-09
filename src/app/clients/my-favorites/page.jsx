'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MyFavouriteCleanersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [favourites, setFavourites] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/clients/favorites', { credentials: 'include' });
      if (res.status === 401) return router.push('/login/clients?next=/client/my-favorites');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load');
      setFavourites(data.favorites || []);
    } catch (e) {
      console.error(e);
      setError('Could not load your favourites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (cleanerId) => {
    try {
      const res = await fetch('/api/clients/toggle-favorite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId }),
      });
      if (res.status === 401) return router.push('/login/clients?next=/client/my-favorites');
      const data = await res.json();
      const ids = new Set((data.favourites || data.favorites || []).map(String));
      setFavourites(prev => prev.filter(c => ids.has(String(c._id))));
      setMsg(data.added ? '✅ Added to favourites' : '✅ Removed from favourites');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      console.error(e);
      setError('Could not update favourites.');
      setTimeout(() => setError(''), 2000);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-gradient-to-br from-teal-900/20 to-teal-700/10">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
          <p className="mt-3 text-gray-700">Loading your favourite cleaners…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-6 bg-gradient-to-br from-teal-900/20 to-teal-700/10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
            ❤️ My Favourite Cleaners
          </h1>
          <Link href="/cleaners" className="bg-teal-600 text-white px-6 py-3 rounded-xl shadow hover:bg-teal-700 transition">
            Browse Cleaners
          </Link>
        </div>

        {msg && <div className="mb-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow">{msg}</div>}
        {error && <div className="mb-6 bg-red-600 text-white px-6 py-3 rounded-xl shadow">{error}</div>}

        {favourites.length === 0 ? (
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 text-center shadow">
            <p className="text-gray-700 mb-4">You haven’t added any favourites yet.</p>
            <Link href="/cleaners" className="inline-block bg-teal-600 text-white px-6 py-3 rounded-[50px] shadow hover:bg-teal-700 transition">
              Find a Cleaner
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favourites.map((c) => (
              <article key={c._id} className="bg-white/90 border border-white/30 rounded-2xl p-5 shadow hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-teal-800">
                    {c.companyName || c.realName || 'Cleaner'}
                  </h3>
                  <button
                    onClick={() => toggle(c._id)}
                    className="text-red-500 hover:scale-110 transition-transform"
                    title="Remove from favourites"
                  >
                    ❤️
                  </button>
                </div>

                <div className="w-full h-40 rounded-xl overflow-hidden mb-3 bg-gray-100">
                  <img
                    src={(typeof c.image === 'string' && c.image.trim()) ? c.image : '/default-avatar.png'}
                    alt={c.companyName || c.realName || 'Cleaner'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {Array.isArray(c.services) && c.services.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {c.services.slice(0, 4).map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                        {s}
                      </span>
                    ))}
                    {c.services.length > 4 && <span className="text-xs text-gray-500">+{c.services.length - 4} more</span>}
                  </div>
                )}

                <div className="text-sm text-gray-700 mb-2">
                  {typeof c.rates === 'number' ? `💷 £${c.rates}/hr` : 'Rate not set'}
                </div>

                <div className="text-sm text-yellow-600 mb-4">
                  {c.googleReviewRating
                    ? <>⭐ {c.googleReviewRating} ({c.googleReviewCount || 0}) on Google</>
                    : (c.rating ? <>⭐ {c.rating} ({c.reviewCount || 0})</> : '⭐ Not rated yet')}
                </div>

                <div className="flex gap-2">
                  <Link href={`/cleaners/${c._id}`} className="text-xs bg-teal-600 text-white px-3 py-1 rounded-full hover:bg-teal-700 transition-colors">
                    View Profile
                  </Link>
                  <Link href={`/book/${c._id}`} className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-colors">
                    Book Now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
