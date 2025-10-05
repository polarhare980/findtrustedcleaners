// src/components/CleanerCard.jsx
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ---------- Config / helpers ----------
const PUBLIC_CLEANER_API = (id) => `/api/public-cleaners/${id}`;

function getCleanerId(c) {
  // Prefer slug if you use it; otherwise id/_id
  return String(c?.slug || c?.id || c?._id || c?._id?.$oid || '').trim();
}

const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i)); // "7".."19"
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function truncate(txt, n = 120) {
  if (!txt) return '';
  return txt.length <= n ? txt : txt.slice(0, n - 1) + '…';
}

// ---------- Component ----------
export default function CleanerCard({
  cleaner,                 // minimal cleaner list item
  handleBookingRequest,    // optional: will be used to open profile/login gate
  isPremium,
  isFavourite,
  onToggleFavourite,
  showAvailability = true, // toggle mini-grid
}) {
  const router = useRouter();
  const rawId = useMemo(() => getCleanerId(cleaner), [cleaner]);
  const id = useMemo(() => encodeURIComponent(rawId), [rawId]);
  const href = rawId ? `/cleaners/${id}` : undefined;

  // Local hydrated profile
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Build a merged model for rendering
  const model = useMemo(() => {
    // Prefer hydrated profile fields; fall back to list item fields
    const p = profile || {};
    return {
      name: p.companyName || p.realName || cleaner?.companyName || cleaner?.realName || 'Cleaner',
      image: (typeof p.image === 'string' && p.image.trim()) ? p.image
           : (typeof cleaner?.image === 'string' && cleaner.image.trim()) ? cleaner.image
           : '/default-avatar.png',
      postcode: p?.address?.postcode || p?.postcode || cleaner?.address?.postcode || cleaner?.postcode || '',
      description: p?.description || cleaner?.description || '',
      services: Array.isArray(p?.services) && p.services.length ? p.services
               : (Array.isArray(cleaner?.services) ? cleaner.services : []),
      hourly:
        typeof p?.rates === 'number' ? p.rates
        : typeof p?.hourlyRate === 'number' ? p.hourlyRate
        : typeof cleaner?.rates === 'number' ? cleaner.rates
        : typeof cleaner?.hourlyRate === 'number' ? cleaner.hourlyRate
        : null,
      rating:
        p?.googleReviews?.rating ?? p?.rating ?? cleaner?.googleReviews?.rating ?? cleaner?.rating ?? null,
      ratingCount:
        p?.googleReviews?.count ?? p?.reviewCount ?? cleaner?.googleReviews?.count ?? cleaner?.reviewCount ?? null,
      dbs: p?.dbsChecked ?? cleaner?.dbsChecked ?? false,
      insured: p?.businessInsurance ?? cleaner?.businessInsurance ?? false,
      availability:
        p?.availability || cleaner?.availability || {}, // may be empty
      galleryCount: Array.isArray(p?.photos) ? p.photos.length : Array.isArray(cleaner?.photos) ? cleaner.photos.length : 0,
      years: p?.yearsExperience ?? cleaner?.yearsExperience ?? null,
    };
  }, [profile, cleaner]);

  // Hydrate full profile once per card (lightweight, cached by browser)
  useEffect(() => {
    if (!rawId) return;
    let alive = true;

    (async () => {
      try {
        setLoadingProfile(true);
        const res = await fetch(PUBLIC_CLEANER_API(rawId), { credentials: 'include' });
        const isJson = (res.headers.get('content-type') || '').includes('application/json');
        const json = isJson ? await res.json() : null;
        const payload = json?.cleaner || json?.data || json;
        if (alive && payload) setProfile(payload);
      } catch {
        // fail soft; show list fields only
      } finally {
        if (alive) setLoadingProfile(false);
      }
    })();

    return () => { alive = false; };
  }, [rawId]);

  // Fallback click → PROFILE (never payment)
  const handleCardOpen = useCallback((e) => {
    if (!href) return;
    const tag = e.target?.tagName?.toLowerCase();
    const interactive = ['button','a','svg','path','input','select','option','textarea','label'];
    if (interactive.includes(tag)) return;
    router.push(href);
  }, [href, router]);

  const handleCardKey = useCallback((e) => {
    if ((e.key === 'Enter' || e.key === ' ') && href) {
      e.preventDefault();
      router.push(href);
    }
  }, [href, router]);

  const onRequestBooking = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof handleBookingRequest === 'function' && rawId) {
      handleBookingRequest(rawId);
    } else if (href) {
      // conservative: open profile if no handler provided
      router.push(href);
    }
  }, [handleBookingRequest, rawId, href, router]);

  // Small availability renderer (premium only by default)
  const AvailabilityMini = () => {
    if (!showAvailability || !isPremium) return null;
    const avail = model.availability || {};
    return (
      <div className="mt-4 relative z-10 pointer-events-none">
        <h4 className="font-semibold text-teal-700 mb-2 text-center">Availability</h4>
        <div className="grid grid-cols-[52px_repeat(13,1fr)] text-[10px] border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-100 p-1 font-bold text-center">Day</div>
          {HOURS.map((h) => (
            <div key={`h-${h}`} className="bg-gray-100 p-1 text-center">{h}</div>
          ))}
          {DAYS.map((day) => {
            const row = avail?.[day] || {};
            return (
              <React.Fragment key={day}>
                <div className="bg-gray-50 p-1 font-medium text-center">{day.slice(0,3)}</div>
                {HOURS.map((h) => {
                  const v = row?.[h];
                  const statusVal = typeof v === 'object' ? v?.status : v;
                  let status = 'blocked';
                  if (statusVal === true || statusVal === 'available') status = 'available';
                  else if (statusVal === 'pending' || statusVal === 'pending_approval') status = 'pending';
                  else if (statusVal === 'booked') status = 'blocked';

                  const cls =
                    status === 'available' ? 'bg-green-100 text-green-800'
                    : status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800';

                  return (
                    <div key={`${day}-${h}`} className={cx('p-1 text-center', cls)} title={status}>
                      {status === 'available' ? '✅' : status === 'pending' ? '⏳' : '❌'}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <article
      className="relative rounded-2xl border p-4 shadow-sm hover:shadow-md transition bg-white/95 min-w-[300px] max-w-[350px] flex-[0_0_auto]"
      role={href ? 'link' : undefined}
      tabIndex={href ? 0 : -1}
      onClick={handleCardOpen}
      onKeyDown={handleCardKey}
    >
      {/* Overlay → PROFILE (never booking) */}
      {href && (
        <Link
          href={href}
          prefetch={false}
          className="absolute inset-0 z-40"
          aria-label={`Open profile for ${model.name}`}
        />
      )}

      {/* Top-right favourite */}
      <div className="text-right mb-2 relative z-50">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavourite?.(rawId); }}
          className={cx('text-2xl transition-transform duration-200 hover:scale-110',
            isFavourite ? 'text-red-500' : 'text-gray-400')}
          aria-pressed={!!isFavourite}
          title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          {isFavourite ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-4 relative z-10">
        {isPremium && (
          <span className="px-3 py-1 rounded-full text-white text-xs font-semibold shadow"
            style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
            Premium Cleaner
          </span>
        )}
        {model.insured && (
          <span className="px-3 py-1 rounded-full text-white text-xs font-semibold shadow"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
            ✔ Insured
          </span>
        )}
        {model.dbs && (
          <span className="px-3 py-1 rounded-full text-white text-xs font-semibold shadow"
            style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)' }}>
            ✔ DBS Checked
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative z-10 w-full h-[150px] rounded-xl overflow-hidden shadow">
        <img
          src={model.image}
          alt={model.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main info */}
      <div className="relative z-10 mt-3 text-left">
        <h3 className="text-lg font-semibold text-teal-800">{model.name}</h3>
        <p className="text-sm text-gray-600">{model.postcode}</p>

        {/* Rating / hourly / gallery */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-700">
          {model.rating != null && (
            <span>⭐ {model.rating}{model.ratingCount ? ` (${model.ratingCount})` : ''}</span>
          )}
          {typeof model.hourly === 'number' && (
            <span>💷 £{Number(model.hourly).toFixed(2)}/hr</span>
          )}
          {model.years != null && <span>🗓 {model.years} yrs exp.</span>}
          {model.galleryCount > 0 && <span>🖼 {model.galleryCount} photos</span>}
          {loadingProfile && <span className="opacity-70">updating…</span>}
        </div>

        {/* Services */}
        {Array.isArray(model.services) && model.services.length > 0 && (
          <div className="mt-2">
            <h4 className="font-semibold text-teal-700 text-sm mb-1">Services:</h4>
            <div className="flex flex-wrap gap-2">
              {model.services.slice(0, 6).map((s, i) => (
                <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                  {s}
                </span>
              ))}
              {model.services.length > 6 && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700 border">
                  +{model.services.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bio snippet */}
        {model.description && (
          <p className="mt-3 text-sm text-gray-700">
            {truncate(model.description, 140)}
          </p>
        )}

        {/* Availability mini-grid */}
        <AvailabilityMini />

        {/* Actions */}
        <div className="mt-4 flex justify-center gap-3 relative">
          <Link
            href={href || '#'}
            prefetch={false}
            onClick={(e) => { if (!href) e.preventDefault(); e.stopPropagation(); }}
            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 active:scale-[0.99] transition"
          >
            View profile
          </Link>

          <button
            type="button"
            onClick={onRequestBooking}
            className="px-3 py-2 rounded-xl text-white active:scale-[0.99] transition"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
          >
            Request booking
          </button>
        </div>
      </div>
    </article>
  );
}
