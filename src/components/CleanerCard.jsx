'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
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

export default function CleanerCard({ cleaner, isFavourite = false, onToggleFavourite }) {
  const [liked, setLiked] = useState(Boolean(isFavourite))

  useEffect(() => {
    setLiked(Boolean(isFavourite))
  }, [isFavourite])

  const reviewSummary = useMemo(() => getReviewSummary(cleaner), [cleaner])
  const services = useMemo(() => getVisibleServices(cleaner), [cleaner])
  const isPremium = Boolean(cleaner?.isPremium)
  const hourlyRate = Number(cleaner?.rates || cleaner?.hourlyRate || 0)
  const availabilityHint = useMemo(() => getAvailabilityHint(cleaner), [cleaner])

  const handleFavourite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setLiked((prev) => !prev)
    if (typeof onToggleFavourite === 'function') onToggleFavourite(cleaner?._id)
  }

  return (
    <Link href={`/cleaners/${cleaner._id}`}>
      <article
        className={`group relative overflow-hidden rounded-[28px] transition-all duration-300 ${
          isPremium
            ? 'border border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.98)_52%,rgba(248,250,252,0.98)_100%)] shadow-[0_18px_60px_rgba(217,119,6,0.14)] hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(217,119,6,0.18)]'
            : 'border border-slate-200 bg-white/90 shadow-sm hover:-translate-y-1 hover:shadow-lg'
        }`}
      >
        {isPremium ? <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" /> : null}

        <div className="relative p-5">
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src={(typeof cleaner.image === 'string' && cleaner.image.trim()) ? cleaner.image : FALLBACK_IMAGE}
              alt={cleaner.companyName || 'Cleaner profile'}
              className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${isPremium ? 'h-64' : 'h-56'}`}
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = FALLBACK_IMAGE
              }}
            />

            <div className={`absolute inset-0 ${isPremium ? 'bg-gradient-to-t from-slate-950/60 via-slate-950/5 to-transparent' : 'bg-gradient-to-t from-slate-950/30 via-transparent to-transparent'}`} />

            <button
              onClick={handleFavourite}
              className="absolute right-3 top-3 rounded-full bg-white/85 p-2 shadow-sm backdrop-blur-md transition hover:bg-white"
              aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Heart
                size={16}
                className={`${liked ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
              />
            </button>

            {isPremium ? (
              <div className="absolute left-3 top-3">
                <span className="rounded-full border border-amber-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800 shadow-sm">
                  Premium
                </span>
              </div>
            ) : null}

            <div className="absolute bottom-3 right-3 rounded-full border border-white/30 bg-white/92 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm">{availabilityHint}</div>

            {isPremium && reviewSummary ? (
              <div className="absolute bottom-3 left-3 rounded-2xl border border-white/20 bg-white/92 px-4 py-3 shadow-lg backdrop-blur-sm">
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black tracking-tight text-slate-900">{reviewSummary.value.toFixed(1)}</span>
                  <span className="pb-1 text-sm font-semibold text-amber-600">★</span>
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-slate-600">{reviewSummary.count} review{reviewSummary.count === 1 ? '' : 's'}</div>
              </div>
            ) : null}
          </div>

          <div className={`mt-4 ${isPremium ? 'space-y-3' : 'space-y-2.5'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className={`font-semibold text-slate-900 ${isPremium ? 'text-xl' : 'text-lg'}`}>
                  {cleaner.companyName}
                </h3>
                {hourlyRate > 0 ? (
                  <p className="mt-1 text-sm font-medium text-slate-500">From £{hourlyRate}/hr</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
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

            <div className={`rounded-2xl border px-4 py-3 ${isPremium ? 'border-amber-100 bg-white/80' : 'border-slate-200 bg-slate-50/90'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {reviewSummary ? <RatingStars value={reviewSummary.value} count={reviewSummary.count} size={isPremium ? 17 : 15} /> : <span className="text-sm font-medium text-slate-500">New profile</span>}
                <span className="text-xs font-semibold text-[#0C8FA3]">{availabilityHint}</span>
              </div>
            </div>

            {services.length ? (
              <p className="text-sm leading-6 text-slate-600 line-clamp-2">{services.slice(0, 3).join(', ')}{services.length > 3 ? '…' : ''}</p>
            ) : null}

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-semibold text-slate-700">Does this cleaner feel right?</span>
              <span className="text-sm font-bold text-[#0C8FA3] transition group-hover:translate-x-1">View →</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
