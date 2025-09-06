'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MyFavouriteCleanersPage() {
  const router = useRouter();

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Data state
  const [favouriteIds, setFavouriteIds] = useState([]);   // list of ids
  const [favourites, setFavourites] = useState([]);        // list of cleaner docs for rendering
  const [isClient, setIsClient] = useState(false);         // logged-in client?

  // --- helpers ---------------------------------------------------------------

  const dedupeIds = (ids) => Array.from(new Set((ids || []).map(String)));

  // Try a batch fetch first: /api/cleaners?ids=comma-separated
  async function fetchCleanersByIds(ids) {
    const unique = dedupeIds(ids);
    if (!unique.length) return [];

    // 1) batch attempt
    try {
      const url = `/api/cleaners?ids=${encodeURIComponent(unique.join(','))}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.cleaners)) return data.cleaners;
      }
    } catch { /* ignore */ }

    // 2) fallback: fetch one-by-one if you have /api/cleaners/:id
    try {
      const results = [];
      await Promise.all(unique.map(async (id) => {
        try {
          const r = await fetch(`/api/cleaners/${id}`, { credentials: 'include' });
          if (r.ok) {
            const d = await r.json();
            // normalise: some APIs wrap single as { cleaner: {...} }
            const doc = d?.cleaner || d;
            if (doc && doc._id) results.push(doc);
          }
        } catch { /* ignore */ }
      }));
      return results;
    } catch { /* ignore */ }

    // 3) last resort: render minimal cards from ids only
    return unique.map((id) => ({ _id: id }));
  }

  async function loadFromServer() {
    // GET server favourites; server might return docs or ids
    const res = await fetch('/api/clients/favorites', { credentials: 'include' });
    if (res.status === 401) {
      // not logged in; caller will handle fallback
      throw Object.assign(new Error('Unauthenticated'), { code: 401 });
    }
    const data = await res.json();
    if (!data?.success) throw new Error(data?.message || 'Failed to load');

    const raw = data.favorites || data.favourites || [];
    // normalise to ids + docs
    const ids = raw.map((x) => String(x?._id || x));
    const haveDocs = raw.length && typeof raw[0] === 'object' && raw[0]?._id;

    let docs = haveDocs ? raw : await fetchCleanersByIds(ids);

    // keep state in sync
    setFavouriteIds(dedupeIds(ids));
    setFavourites(Array.isArray(docs) ? docs : []);
  }

  function loadLocalIds() {
    try {
      const saved = JSON.parse(localStorage.getItem('favourites') || '[]');
      return Array.isArray(saved) ? saved.map(String) : [];
    } catch {
      return [];
    }
  }

  async function loadFromLocal() {
    const ids = loadLocalIds();
    setFavouriteIds(ids);
    const docs = await fetchCleanersByIds(ids);
    setFavourites(docs);
  }

  // --- initial load ----------------------------------------------------------

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        // detect if logged in as client
        try {
          const me = await fetch('/api/auth/me', { credentials: 'include' });
          if (me.ok) {
            const d = await me.json();
            if (!ignore) setIsClient(d?.user?.type === 'client');
          }
        } catch { /* ignore */ }

        setLoading(true);

        // prefer server if logged in; else local
        if (isClient) {
          await loadFromServer();
          if (!ignore) setLoading(false);
          return;
        }

        // not a client / not logged in → local
        await loadFromLocal();
        if (!ignore) setLoading(false);
      } catch (e) {
        // unauth or server failure → fall back to local
        await loadFromLocal();
        if (!ignore) {
          setLoading(false);
          if (e?.code !== 401) {
            setError('Could not load your favourites from the server. Showing this device’s favourites.');
          }
        }
      }
    })();

    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  // --- toggle ---------------------------------------------------------------

  async function toggle(cleanerId) {
    const id = String(cleanerId);

    // optimistic local update
    const wasFav = favouriteIds.includes(id);
    const nextIds = wasFav ? favouriteIds.filter((x) => x !== id) : [...favouriteIds, id];
    setFavouriteIds(nextIds);
    localStorage.setItem('favourites', JSON.stringify(nextIds));

    // update docs list to reflect optimistic change
    if (wasFav) {
      setFavourites((prev) => prev.filter((c) => String(c._id) !== id));
    } else {
      // if we already have that card in memory from a previous load, keep it; else fetch it
      const already = favourites.find((c) => String(c._id) === id);
      if (!already) {
        const [doc] = await fetchCleanersByIds([id]);
        if (doc) setFavourites((prev) => [...prev, doc]);
      }
    }

    // if logged in, try server sync; otherwise we’re done
    if (!isClient) {
      setMsg(wasFav ? '✅ Removed from favourites' : '✅ Added to favourites');
      setTimeout(() => setMsg(''), 1800);
      return;
    }

    try {
      const res = await fetch('/api/clients/toggle-favorite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId: id }),
      });

      // Some deployments return 405/HTML on error — handle safely
      const ct = res.headers.get('content-type') || '';
      const isJSON = ct.includes('application/json');
      const data = isJSON ? await res.json() : null;

      if (!res.ok || !data?.success) {
        // rollback on hard server failure
        const rolledBack = wasFav ? [...favouriteIds, id] : favouriteIds.filter((x) => x !== id);
        setFavouriteIds(rolledBack);
        localStorage.setItem('favourites', JSON.stringify(rolledBack));
        // also rollback docs
        if (wasFav) {
          // we removed but should add it back visually → refetch the doc if missing
          const exists = favourites.find((c) => String(c._id) === id);
          if (!exists) {
            const [doc] = await fetchCleanersByIds([id]);
            if (doc) setFavourites((prev) => [...prev, doc]);
          }
        } else {
          // we added but should remove
          setFavourites((prev) => prev.filter((c) => String(c._id) !== id));
        }
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      // success → trust server ids if provided
      const serverIds = (data.favourites || data.favorites || []).map(String);
      if (serverIds.length) {
        setFavouriteIds(serverIds);
        localStorage.setItem('favourites', JSON.stringify(serverIds));
        // resync docs to server ids
        const docs = await fetchCleanersByIds(serverIds);
        setFavourites(docs);
      }

      setMsg(data.added ? '✅ Added to favourites' : '✅ Removed from favourites');
      setTimeout(() => setMsg(''), 1800);
    } catch (e) {
      console.warn('Server sync failed; staying local:', e?.message || e);
      setError('Could not update favourites on the server. Changes are saved on this device.');
      setTimeout(() => setError(''), 2000);
    }
  }

  // --- render ---------------------------------------------------------------

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
          <div className="flex gap-3">
            <Link href="/cleaners" className="bg-teal-600 text-white px-6 py-3 rounded-xl shadow hover:bg-teal-700 transition">
              Browse Cleaners
            </Link>
            {isClient && (
              <Link href="/clients/dashboard" className="bg-gray-700 text-white px-6 py-3 rounded-xl shadow hover:bg-gray-800 transition">
                Client Dashboard
              </Link>
            )}
          </div>
        </div>

        {msg && <div className="mb-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow">{msg}</div>}
        {error && <div className="mb-6 bg-red-600 text-white px-6 py-3 rounded-xl shadow">{error}</div>}

        {(!favourites || favourites.length === 0) ? (
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
                    aria-pressed="true"
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

                {!!(Array.isArray(c.services) && c.services.length) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {c.services.slice(0, 4).map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                        {s}
                      </span>
                    ))}
                    {c.services.length > 4 && (
                      <span className="text-xs text-gray-500">+{c.services.length - 4} more</span>
                    )}
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
