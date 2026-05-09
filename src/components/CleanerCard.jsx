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
  if (cleaner?.nextAvailableLabel) return cleaner.nextAvailableLabel
  const availability = cleaner?.availabilityMerged || cleaner?.availability || {}
  const todayName = new Date().toLocaleDateString('en-GB', { weekday: 'long' })
  const todaySlots = availability?.[todayName] || {}
  const availableToday = Object.values(todaySlots).some((slot) => {
    if (slot === true || slot === 'available') return true
    return Boolean(slot && typeof slot === 'object' && (slot.status === 'available' || slot.available === true))
  })
  if (availableToday) return 'Available today'
  const days = Object.keys(availability || {})
  let count = 0
  days.forEach((day) => {
    Object.values(availability?.[day] || {}).forEach((slot) => { if (slot === true || slot === 'available') count += 1 })
  })
  if (count > 0) return 'Next availability on profile'
  return 'Unavailable today'
}

export default function CleanerCard({ cleaner, isFavourite = false, onToggleFavourite, isPremium: forcedPremium = false }) {
  const [liked, setLiked] = useState(Boolean(isFavourite))

  useEffect(() => {
    setLiked(Boolean(isFavourite))
  }, [isFavourite])

  const services = useMemo(() => getVisibleServices(cleaner), [cleaner])
  const isPremium = Boolean(forcedPremium || cleaner?.isPremium)
  const primaryService = services?.[0] || 'Cleaning'
  const specialistLine = primaryService.toLowerCase().includes('clean')
    ? primaryService
    : `${primaryService} specialist`
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
        className={`group relative overflow-hidden rounded-[22px] border transition-all duration-300 hover:-translate-y-0.5 ${
          isPremium
            ? 'border-amber-200/80 bg-white shadow-[0_16px_45px_rgba(217,119,6,0.13)] hover:shadow-[0_24px_70px_rgba(217,119,6,0.18)]'
            : 'border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] hover:border-[#0C8FA3]/25 hover:shadow-[0_22px_60px_rgba(15,23,42,0.11)]'
        }`}
      >
        {isPremium ? (
          <div className="absolute inset-x-0 top-0 z-20 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
        ) : null}

        <div className="relative h-[235px] overflow-hidden bg-slate-100 sm:h-[250px]">
          <img
            src={(typeof cleaner.image === 'string' && cleaner.image.trim()) ? cleaner.image : FALLBACK_IMAGE}
            alt={cleaner.companyName || 'Cleaner profile'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = FALLBACK_IMAGE
            }}
          />

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

          {isPremium ? (
            <span className="absolute left-4 top-4 rounded-full border border-amber-100/80 bg-[linear-gradient(135deg,#f5d76e,#e0b84f)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#3b2d00] shadow-[0_2px_14px_rgba(224,184,79,0.35)]">
              Premium
            </span>
          ) : null}

          <Button
            variant="secondary"
            size="icon"
            className={`absolute right-4 top-4 h-9 w-9 rounded-full border border-white/50 shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white ${
              liked ? 'bg-[#0C8FA3] text-white hover:text-white' : 'bg-white/78 text-slate-700'
            }`}
            onClick={handleFavourite}
            aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Heart size={16} className={liked ? 'fill-current' : ''} />
          </Button>

          <span className={`absolute bottom-4 left-4 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm backdrop-blur-md ${
            availabilityHint.toLowerCase().includes('available today')
              ? 'border-emerald-100/80 bg-emerald-50/92 text-emerald-800'
              : availabilityHint.toLowerCase().includes('next')
                ? 'border-amber-100/80 bg-amber-50/92 text-amber-800'
                : 'border-white/40 bg-white/82 text-slate-700'
          }`}>
            {availabilityHint}
          </span>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="truncate text-lg font-bold leading-tight text-slate-950">
              {cleaner.companyName}
            </h3>
            <p className="mt-1 truncate text-sm font-medium text-slate-500">
              {specialistLine}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {cleaner?.businessInsurance ? (
              <span className="rounded-full border border-[#0C8FA3]/15 bg-[#EAFBFB]/90 px-3 py-1 text-[11px] font-semibold text-[#076D7E]">
                Insured
              </span>
            ) : null}
            {cleaner?.dbsChecked ? (
              <span className="rounded-full border border-blue-100 bg-blue-50/90 px-3 py-1 text-[11px] font-semibold text-blue-700">
                DBS Checked
              </span>
            ) : null}
            {cleaner?.verified ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700">
                Verified
              </span>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  )
}
