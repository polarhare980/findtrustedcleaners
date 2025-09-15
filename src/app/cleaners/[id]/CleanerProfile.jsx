'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ---- Public endpoints ----
const PUBLIC_CLEANER_API = (id) => `/api/public-cleaners/${id}`;
const PUBLIC_PURCHASES_API = (id) => `/api/public/purchases/cleaners/${id}`;

// ---- Constants ----
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 07:00..19:00
const hourLabel = (h) => `${String(h).padStart(2,'0')}:00`;

export default function CleanerProfile() {
  const { id } = useParams();
  const router = useRouter();

  const [cleaner, setCleaner] = useState(null);
  const [pending, setPending] = useState([]); // purchases spans for grid overlays
  const [selected, setSelected] = useState({ day: null, time: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---- Load cleaner public profile + pending spans ----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [cRes, pRes] = await Promise.all([
          fetch(PUBLIC_CLEANER_API(id), { credentials: 'include' }).then((r) => r.json()),
          fetch(PUBLIC_PURCHASES_API(id), { credentials: 'include' })
            .then((r) => r.json())
            .catch(() => ({ purchases: [] })),
        ]);
        if (!alive) return;

        if (!cRes || !cRes.cleaner) throw new Error('Cleaner not found');
        setCleaner(cRes.cleaner);
        setPending(Array.isArray(pRes?.purchases) ? pRes.purchases : []);
        setError('');
      } catch (e) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // ---- Helpers ----
  const availability = cleaner?.availability || {};
  const normalizedPhotos = (cleaner?.photos || []).map((p) => {
    if (!p) return null;
    if (typeof p === 'string') return { url: p, public_id: '', hasText: false };
    return {
      url: p.url || p.secure_url || p.secureUrl || p.src || '',
      public_id: p.public_id || '',
      hasText: !!p.hasText,
    };
  }).filter(Boolean);

  const googleReviews = cleaner?.googleReviews || null; // { rating, count, url }

  // Quick badge stack
  const badges = useMemo(() => {
    const b = [];
    if (cleaner?.premium) b.push({ key: 'premium', label: 'Premium', tone: 'from-amber-400 to-yellow-500' });
    if (cleaner?.insurance) b.push({ key: 'insured', label: 'Insured', tone: 'from-emerald-400 to-teal-500' });
    if (cleaner?.dbsCheck) b.push({ key: 'dbs', label: 'DBS Checked', tone: 'from-blue-400 to-indigo-500' });
    return b;
  }, [cleaner]);

  // Determine whether a slot is selectable (available and not pending)
  function isSlotAvailable(day, hour) {
    const dayMap = availability?.[day] || availability?.[day?.slice(0,3)] || {};
    const raw = dayMap?.[String(hour)] ?? dayMap?.[hour];
    if (raw === 'unavailable' || raw === false) return false;

    // block if pending purchases match this day/hour (simple overlay)
    const blocked = pending?.some((p) => {
      // p may include { day: 'Monday', hours: [9,10], status: 'pending' }
      const pd = p?.day;
      const ph = p?.hours;
      if (!pd || !Array.isArray(ph)) return false;
      return pd === day && ph.includes(hour);
    });
    return !blocked;
  }

  function onSelect(day, hour) {
    setSelected({ day, time: hour });
  }

  function onBook() {
    // Push into same-page booking section
    const el = document.getElementById('booking-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <div className="animate-pulse rounded-2xl p-8 bg-white/50 backdrop-blur shadow">Loading profile…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <div className="rounded-2xl p-6 bg-rose-50 text-rose-700 border border-rose-200">{error}</div>
      </main>
    );
  }

  if (!cleaner) return null;

  return (
    <main className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <header className="rounded-2xl bg-white/60 backdrop-blur shadow p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar / Hero */}
        <div className="w-full md:w-64 shrink-0">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl shadow">
            {/* Pick first safe photo (no text) as cover */}
            {normalizedPhotos.length > 0 ? (
              <img
                src={normalizedPhotos.find((p) => !p.hasText)?.url || normalizedPhotos[0].url}
                alt={cleaner.company || cleaner.name || 'Cleaner'}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-slate-400">No photo</div>
            )}
          </div>
        </div>

        {/* Title & meta */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-teal-800">
              {cleaner.company || cleaner.name || 'Cleaner'}
            </h1>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span key={b.key} className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${b.tone} shadow`}>{b.label}</span>
              ))}
            </div>
          </div>

          {/* Reviews */}
          {googleReviews && (
            <div className="flex items-center gap-3 text-sm text-slate-700 mb-3">
              <span className="font-semibold">⭐ {googleReviews.rating?.toFixed ? googleReviews.rating.toFixed(1) : googleReviews.rating}</span>
              <span>({googleReviews.count || 0} reviews)</span>
              {googleReviews.url && (
                <a href={googleReviews.url} target="_blank" rel="noreferrer" className="underline text-teal-700 hover:text-teal-900">View Google reviews</a>
              )}
            </div>
          )}

          {/* Rate */}
          {typeof cleaner.hourlyRate === 'number' && (
            <div className="text-slate-800 text-lg font-semibold mb-4">£{cleaner.hourlyRate}/hour</div>
          )}

          {/* Description (sanitized on API) */}
          {cleaner.description && (
            <p className="text-slate-700 leading-relaxed">{cleaner.description}</p>
          )}
        </div>

        {/* Call to action (keeps contact gated) */}
        <div className="w-full md:w-60">
          <div className="rounded-2xl p-5 bg-white/70 border border-slate-100 shadow flex flex-col gap-3">
            <div className="text-sm text-slate-600">Interested?</div>
            <button onClick={onBook} className="w-full rounded-xl py-2.5 font-semibold bg-teal-600 text-white hover:bg-teal-700 transition">
              Request a Booking
            </button>
            <div className="text-xs text-slate-500">
              Contact details are shared <span className="font-semibold">after</span> a booking request is placed and approved.
            </div>
          </div>
        </div>
      </header>

      {/* Gallery */}
      {normalizedPhotos.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-teal-900 mb-3">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {normalizedPhotos.map((p, i) => (
              <div key={p.public_id || i} className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow">
                <img
                  src={p.url}
                  alt={`Cleaner photo ${i + 1}`}
                  className={`w-full h-40 md:h-44 object-cover ${p.hasText ? 'blur-sm' : ''}`}
                />
                {p.hasText && (
                  <div className="absolute inset-0 grid place-items-center text-xs font-semibold text-slate-700 bg-white/60">
                    Contact info hidden for safety
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {Array.isArray(cleaner?.services) && cleaner.services.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-teal-900 mb-3">Services</h2>
          <ul className="flex flex-wrap gap-2">
            {cleaner.services.map((s, i) => (
              <li key={i} className="px-3 py-1.5 rounded-full bg-white/70 border border-slate-100 text-sm text-slate-700 shadow">
                {typeof s === 'string' ? s : s?.name || 'Service'}
              </li>) )}
          </ul>
        </section>
      )}

      {/* Availability + Booking */}
      <section id="booking-section" className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-teal-900">Availability</h2>
          <div className="text-xs text-slate-500">Green = available · Red = unavailable · Grey = pending</div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white/60 shadow">
          <div className="grid" style={{ gridTemplateColumns: `120px repeat(${HOURS.length}, minmax(44px,1fr))` }}>
            {/* Header row */}
            <div className="p-2.5 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">Day</div>
            {HOURS.map((h) => (
              <div key={`h-${h}`} className="p-2.5 bg-slate-50 text-slate-500 text-xs text-center">
                {hourLabel(h)}
              </div>
            ))}

            {/* Rows */}
            {DAYS.map((day) => (
              <React.Fragment key={day}>
                <div className="p-2.5 text-slate-700 text-sm font-semibold bg-white/80 sticky left-0">{day}</div>
                {HOURS.map((h) => {
                  const available = isSlotAvailable(day, h);
                  const isSelected = selected.day === day && selected.time === h;

                  // show grey if blocked by pending purchase
                  const isPending = pending?.some((p) => p?.day === day && Array.isArray(p?.hours) && p.hours.includes(h));

                  const base = 'h-9 md:h-10 border-t border-l last:border-r text-xs grid place-items-center cursor-pointer select-none';
                  const cls = isPending
                    ? `${base} bg-slate-200 text-slate-500`
                    : available
                      ? `${base} bg-emerald-100/70 hover:bg-emerald-200/70`
                      : `${base} bg-rose-100/60 text-rose-600`;

                  return (
                    <button
                      key={`${day}-${h}`}
                      className={`${cls} ${isSelected ? 'ring-2 ring-teal-500' : ''}`}
                      onClick={() => available && onSelect(day, h)}
                      disabled={!available}
                      aria-pressed={isSelected}
                      aria-label={`${day} ${hourLabel(h)}`}
                    >
                      {hourLabel(h)}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Booking CTA */}
        <div className="mt-5 flex flex-col sm:flex-row items-stretch gap-3">
          <button
            onClick={() => {
              if (!selected.day || !selected.time) return alert('Please select a day and time');
              // Route to purchase/booking flow, preserving selection in query
              const q = new URLSearchParams({ day: selected.day, hour: String(selected.time) }).toString();
              router.push(`/book/${id}?${q}`);
            }}
            className="px-5 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition shadow"
          >
            Continue to Booking
          </button>
          <div className="text-xs text-slate-500 self-center">You’ll confirm details and share contact info after submitting a booking request.</div>
        </div>
      </section>

      {/* Safety: do NOT show direct contact */}
      <section className="mt-10">
        <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          For safety and fairness, cleaner phone and email are hidden until a booking is requested and approved.
        </div>
      </section>
    </main>
  );
}
