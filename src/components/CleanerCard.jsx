'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'
import RatingStars from '@/components/RatingStars'

const FALLBACK_IMAGE = '/default-avatar.png'

function getReviewSummary(cleaner = {}) {
  const siteRating = Number(cleaner?.rating || 0)
  const siteCount = Number(cleaner?.ratingCount || 0)
  const googleRating = Number(cleaner?.googleReviewRating || 0)
  const googleCount = Number(cleaner?.googleReviewCount || 0)

  if (siteCount > 0 && siteRating > 0) {
    return {
      value: siteRating,
      count: siteCount,
      source: 'Verified reviews',
      accent: 'text-emerald-700',
    }
  }

  if (googleCount > 0 && googleRating > 0) {
    return {
      value: googleRating,
      count: googleCount,
      source: 'Google reviews',
      accent: 'text-slate-600',
    }
  }

  return null
}

function getVisibleServices(cleaner = {}) {
  const detailed = Array.isArray(cleaner?.servicesDetailed)
    ? cleaner.servicesDetailed
        .filter((service) => service?.name && service?.active !== false)
        .map((service) => service.name)
    : []

  if (detailed.length) return detailed
  if (Array.isArray(cleaner?.services)) return cleaner.services.filter(Boolean)
  return []
}

function getAvailabilityHint(cleaner = {}) {
  const availability = cleaner?.availabilityMerged || cleaner?.availability || {}
  const days = Object.keys(availability || {})
  let count = 0
  days.forEach((day) => {
    Object.values(availability?.[day] || {}).forEach((slot) => { if (slot === true) count += 1 })
  })
  if (count >= 8) return 'Good availability'
  if (count > 0) return 'Limited availability'
  return 'Check availability'
}

export default function CleanerCard({ cleaner, isFavourite = false, onToggleFavourite, isPremium: forcedPremium = false }) {
  const [liked, setLiked] = useState(Boolean(isFavourite))

  useEffect(() => {
    setLiked(Boolean(isFavourite))
  }, [isFavourite])

  const reviewSummary = useMemo(() => getReviewSummary(cleaner), [cleaner])
  const services = useMemo(() => getVisibleServices(cleaner), [cleaner])
  const isPremium = Boolean(forcedPremium || cleaner?.isPremium)
  const hourlyRate = Number(cleaner?.rates || cleaner?.hourlyRate || 0)
  const availabilityHint = useMemo(() => getAvailabilityHint(cleaner), [cleaner])

  const handleFavourite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setLiked((prev) => !prev)
    if (typeof onToggleFavourite === 'function') onToggleFavourite(cleaner?._id)
  }

  return (
    <Link href={`/cleaners/${cleaner._id}`} aria-label={cleaner.companyName || 'View cleaner profile'}>
      <article
        className={`group relative block overflow-hidden rounded-[30px] border text-card-foreground transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg ${
          isPremium
            ? 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.98)_55%,rgba(248,250,252,0.98)_100%)] shadow-[0_18px_60px_rgba(217,119,6,0.14)] hover:shadow-[0_30px_90px_rgba(217,119,6,0.20)]'
            : 'border-slate-200 bg-white/95 shadow-sm hover:border-[#0C8FA3]/25 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]'
        }`}
      >
        {isPremium ? (
          <>
            <div className="absolute inset-x-0 top-0 z-10 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl" />
          </>
        ) : null}

        <div className="relative p-4">
          <div className="h-[170px] w-full overflow-hidden rounded-t-2xl rounded-[24px] bg-slate-100">
            <img
              src={(typeof cleaner.image === 'string' && cleaner.image.trim()) ? cleaner.image : FALLBACK_IMAGE}
              alt={cleaner.companyName || 'Cleaner profile'}
              className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = FALLBACK_IMAGE
              }}
            />
          </div>

          <div className={`absolute inset-x-4 bottom-4 h-28 rounded-b-[24px] ${isPremium ? 'bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent' : 'bg-gradient-to-t from-slate-950/35 via-transparent to-transparent'}`} />

          <Button
            variant="secondary"
            size="icon"
            className="absolute right-7 top-7 h-9 w-9 rounded-full border border-white/60 bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
            onClick={handleFavourite}
            aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Heart size={16} className={liked ? 'fill-red-500 text-red-500' : ''} />
          </Button>

          {isPremium ? (
            <div className="absolute left-7 top-7">
              <span className="rounded-full border border-amber-200/80 bg-[linear-gradient(135deg,#f5d76e,#e0b84f)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#3b2d00] shadow-[0_2px_14px_rgba(224,184,79,0.35)]">
                Premium
              </span>
            </div>
          ) : null}

          <div className="absolute bottom-7 right-7 rounded-full border border-white/40 bg-white/92 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
            {availabilityHint}
          </div>

          {isPremium && reviewSummary ? (
            <div className="absolute bottom-7 left-7 rounded-2xl border border-white/30 bg-white/92 px-4 py-3 shadow-lg backdrop-blur-sm">
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">{reviewSummary.value.toFixed(1)}</span>
                <span className="pb-1 text-sm font-semibold text-amber-600">★</span>
              </div>
              <div className="mt-0.5 text-[11px] font-medium text-slate-600">{reviewSummary.count} review{reviewSummary.count === 1 ? '' : 's'}</div>
            </div>
          ) : null}
        </div>

        <div className="p-4 pt-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={`truncate font-bold leading-tight text-slate-900 ${isPremium ? 'text-xl' : 'text-lg'}`}>
                {cleaner.companyName}
              </h3>
              {hourlyRate > 0 ? (
                <p className="mt-1 text-sm font-medium text-slate-500">From £{hourlyRate}/hr</p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {cleaner?.businessInsurance ? (
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${isPremium ? 'border-[#0C8FA3]/25 bg-[#EAFBFB] text-[#076D7E]' : 'border-[#0C8FA3]/15 bg-[#EAFBFB]/80 text-[#0C8FA3]'}`}>
                Insured
              </span>
            ) : null}
            {cleaner?.dbsChecked ? (
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${isPremium ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-blue-100 bg-blue-50/80 text-blue-700'}`}>
                DBS Checked
              </span>
            ) : null}
          </div>

          <div className={`mt-3 rounded-2xl border px-4 py-3 ${isPremium ? 'border-amber-100 bg-white/80' : 'border-slate-200 bg-slate-50/90'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {reviewSummary ? <RatingStars value={reviewSummary.value} count={reviewSummary.count} size={isPremium ? 17 : 15} /> : <span className="text-sm font-medium text-slate-500">New profile</span>}
              <span className="text-xs font-semibold text-[#0C8FA3]">Check availability</span>
            </div>
          </div>

          {services.length ? (
            <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-2">{services.slice(0, 3).join(', ')}{services.length > 3 ? '…' : ''}</p>
          ) : null}

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm font-semibold text-slate-700">Does this cleaner feel right?</span>
            <span className="text-sm font-bold text-[#0C8FA3] transition group-hover:translate-x-1">View →</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
