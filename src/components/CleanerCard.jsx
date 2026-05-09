'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'

const FALLBACK_IMAGE = '/default-avatar.png'

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
    Object.values(availability?.[day] || {}).forEach((slot) => {
      if (slot === true || slot === 'available') count += 1
    })
  })
  if (count > 0) return 'Next slot on profile'
  return 'Limited availability'
}

function getAvailabilityClasses(label = '') {
  const lower = label.toLowerCase()
  if (lower.includes('available today')) {
    return 'border-emerald-200/80 bg-emerald-50 text-emerald-800'
  }
  if (lower.includes('next') || lower.includes('tomorrow')) {
    return 'border-amber-200/80 bg-amber-50 text-amber-800'
  }
  return 'border-white/70 bg-white/90 text-slate-700'
}

export default function CleanerCard({ cleaner, isFavourite = false, onToggleFavourite, isPremium: forcedPremium = false }) {
  const [liked, setLiked] = useState(Boolean(isFavourite))

  useEffect(() => {
    setLiked(Boolean(isFavourite))
  }, [isFavourite])

  const services = useMemo(() => getVisibleServices(cleaner), [cleaner])
  const isPremium = Boolean(forcedPremium || cleaner?.isPremium)
  const primaryService = services?.[0] || 'Home cleaning'
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
    <Link href={`/cleaners/${cleaner._id}`} aria-label={cleaner.companyName || 'View cleaner profile'} className="block h-full">
      <article
        className={`group relative h-full overflow-hidden rounded-[30px] border bg-white transition-all duration-500 hover:-translate-y-1 ${
          isPremium
            ? 'border-amber-200/80 shadow-[0_22px_70px_rgba(217,119,6,0.14)] hover:shadow-[0_32px_90px_rgba(217,119,6,0.20)]'
            : 'border-white/80 shadow-[0_20px_65px_rgba(15,23,42,0.10)] hover:border-[#0C8FA3]/25 hover:shadow-[0_30px_85px_rgba(15,23,42,0.14)]'
        }`}
      >
        {isPremium ? (
          <div className="absolute inset-x-5 top-0 z-20 h-1 rounded-full bg-gradient-to-r from-amber-300 via-white to-amber-500" />
        ) : null}

        <div className="relative h-[300px] overflow-hidden bg-[linear-gradient(135deg,#eef7f8,#dfeaf0)] sm:h-[325px]">
          <img
            src={(typeof cleaner.image === 'string' && cleaner.image.trim()) ? cleaner.image : FALLBACK_IMAGE}
            alt={cleaner.companyName || 'Cleaner profile'}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = FALLBACK_IMAGE
            }}
          />

          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950/82 via-slate-950/30 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_34%)] opacity-0 transition duration-500 group-hover:opacity-100" />

          {isPremium ? (
            <span className="absolute left-4 top-4 rounded-full border border-amber-100/80 bg-[linear-gradient(135deg,#f7df8e,#e0b84f)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#3b2d00] shadow-[0_10px_28px_rgba(224,184,79,0.28)]">
              Premium
            </span>
          ) : null}

          <Button
            variant="secondary"
            size="icon"
            className={`absolute right-4 top-4 h-9 w-9 rounded-full border border-white/60 shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white ${
              liked ? 'bg-[#0C8FA3] text-white hover:text-white' : 'bg-white/80 text-slate-700'
            }`}
            onClick={handleFavourite}
            aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Heart size={16} className={liked ? 'fill-current' : ''} />
          </Button>

          <div className="absolute inset-x-4 bottom-4">
            <div className="rounded-[24px] border border-white/20 bg-white/[0.14] p-4 text-white shadow-[0_16px_45px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-semibold tracking-tight text-white">
                    {cleaner.companyName || cleaner.name || 'Trusted cleaner'}
                  </h3>
                  <p className="mt-1 truncate text-sm font-medium text-white/[0.75]">
                    {specialistLine}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {cleaner?.businessInsurance ? (
                  <span className="rounded-full border border-white/[0.18] bg-white/[0.14] px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xl">
                    Insured
                  </span>
                ) : null}
                {cleaner?.dbsChecked ? (
                  <span className="rounded-full border border-white/[0.18] bg-white/[0.14] px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xl">
                    DBS Checked
                  </span>
                ) : null}
                {cleaner?.verified ? (
                  <span className="rounded-full border border-white/[0.18] bg-white/[0.14] px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xl">
                    Verified
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-4">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] shadow-sm ${getAvailabilityClasses(availabilityHint)}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {availabilityHint}
          </span>
          <span className="text-xs font-bold text-slate-400 transition group-hover:text-[#0C8FA3]">
            View profile
          </span>
        </div>
      </article>
    </Link>
  )
}
