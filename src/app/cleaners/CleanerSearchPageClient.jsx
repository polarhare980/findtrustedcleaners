'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'
import CleanerCard from '@/components/CleanerCard'

const SEARCH_MODES = [
  {
    id: 'domestic',
    label: 'Domestic cleaning',
    title: 'Find a domestic cleaner',
    description: 'Regular home cleaning, one-off house cleans and everyday help around the home.',
  },
  {
    id: 'specialist',
    label: 'Specialist cleaning',
    title: 'Choose a specialist service',
    description: 'Ovens, carpets, windows, gutters and other specific cleaning jobs.',
  },
]

const DOMESTIC_SERVICE = 'Regular Cleaning'

const SPECIALIST_SERVICES = [
  'Oven Cleaning',
  'Carpet Cleaning',
  'Window Cleaning',
  'Gutter Cleaning',
  'Pressure Washing',
  'End of Tenancy',
  'One-Off Deep Clean',
  'Moving House Cleaning',
  'Spring Cleaning',
  'After-party Cleaning',
]

const TIME_PREFERENCES = ['Any time', 'Today', 'Tomorrow', 'This week', 'Weekend']

const fetchJson = async (url) => {
  const res = await fetch(url, { credentials: 'include' })
  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json() : {}
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || 'Failed to load cleaners')
  }
  return data
}

function compactServiceLabel(serviceType = '') {
  return serviceType
    .replace('One-Off ', '')
    .replace('Regular Cleaning', 'Domestic')
    .replace('End of Tenancy', 'Moving out')
    .replace('Window Cleaning', 'Windows')
    .replace('Pressure Washing', 'Pressure wash')
}

function isSlotAvailable(slot) {
  if (slot === true || slot === 'available') return true
  return Boolean(slot && typeof slot === 'object' && (slot.status === 'available' || slot.available === true))
}

function isAvailableToday(cleaner = {}) {
  const availability = cleaner?.availabilityMerged || cleaner?.availability || {}
  const todayName = new Date().toLocaleDateString('en-GB', { weekday: 'long' })
  return Object.values(availability?.[todayName] || {}).some(isSlotAvailable)
}

function sortBestAvailable(cleaners = []) {
  return [...cleaners].sort((a, b) => {
    const todayDiff = Number(isAvailableToday(b)) - Number(isAvailableToday(a))
    if (todayDiff) return todayDiff
    const distanceA = Number.isFinite(a?.distanceMiles) ? a.distanceMiles : 9999
    const distanceB = Number.isFinite(b?.distanceMiles) ? b.distanceMiles : 9999
    if (distanceA !== distanceB) return distanceA - distanceB
    return Number(Boolean(b?.isPremium)) - Number(Boolean(a?.isPremium))
  })
}

export default function CleanerSearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [postcode, setPostcode] = useState('')
  const [searchMode, setSearchMode] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [timePreference, setTimePreference] = useState('Any time')
  const [radius, setRadius] = useState('8')
  const [hydratedFromQuery, setHydratedFromQuery] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cleaners, setCleaners] = useState([])
  const [searchMeta, setSearchMeta] = useState(null)
  const [exactLocation, setExactLocation] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [activeCleanerIndex, setActiveCleanerIndex] = useState(0)
  const swipeStartX = useRef(null)

  useEffect(() => {
    if (hydratedFromQuery) return

    const qpPostcode = searchParams.get('postcode') || ''
    const qpService = searchParams.get('service') || searchParams.get('serviceType') || ''
    const qpRadius = searchParams.get('radius') || '8'
    const qpMode = searchParams.get('mode') || searchParams.get('path') || ''
    const qpTime = searchParams.get('time') || 'Any time'

    const resolvedMode = qpMode === 'specialist' || qpMode === 'domestic'
      ? qpMode
      : qpService && qpService !== DOMESTIC_SERVICE
        ? 'specialist'
        : qpService === DOMESTIC_SERVICE
          ? 'domestic'
          : ''

    setPostcode(qpPostcode)
    setSearchMode(resolvedMode)
    setServiceType(resolvedMode === 'domestic' ? DOMESTIC_SERVICE : qpService)
    setTimePreference(qpTime)
    setRadius(qpRadius)
    setHydratedFromQuery(true)
  }, [searchParams, hydratedFromQuery])

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (postcode.trim()) params.set('postcode', postcode.trim())
    if (exactLocation?.lat && exactLocation?.lng) {
      params.set('lat', String(exactLocation.lat))
      params.set('lng', String(exactLocation.lng))
    }
    if (searchMode === 'domestic') {
      params.set('category', 'domestic')
    } else if (serviceType.trim()) {
      params.set('serviceType', serviceType.trim())
    }
    if (radius) params.set('radius', radius)
    return `/api/cleaners/matched?${params.toString()}`
  }, [postcode, serviceType, searchMode, radius, exactLocation])

  useEffect(() => {
    if (!hydratedFromQuery) return

    let active = true

    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const data = await fetchJson(apiUrl)
        if (!active) return
        setCleaners(sortBestAvailable(Array.isArray(data?.cleaners) ? data.cleaners : []))
        setSearchMeta(data?.searchMeta || null)
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Failed to load cleaners')
        setCleaners([])
        setSearchMeta(null)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [apiUrl, hydratedFromQuery])

  useEffect(() => {
    setActiveCleanerIndex(0)
  }, [serviceType, postcode, radius, exactLocation])

  useEffect(() => {
    if (activeCleanerIndex > 0 && activeCleanerIndex >= cleaners.length) {
      setActiveCleanerIndex(0)
    }
  }, [activeCleanerIndex, cleaners.length])

  const handleUseExactLocation = () => {
    setLocationError('')
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Your browser does not support exact location. Use a postcode instead.')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setExactLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setIsLocating(false)
      },
      () => {
        setLocationError('Location permission was not allowed. Use your postcode instead.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 1000 * 60 * 10 }
    )
  }

  const updateRoute = ({ mode = searchMode, service = serviceType } = {}) => {
    const params = new URLSearchParams()
    if (postcode.trim()) params.set('postcode', postcode.trim())
    if (mode) params.set('mode', mode)
    if (service?.trim()) params.set('service', service.trim())
    if (timePreference && timePreference !== 'Any time') params.set('time', timePreference)
    if (radius) params.set('radius', radius)
    router.replace(`/cleaners${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handleModeSelect = (mode) => {
    setSearchMode(mode)
    const nextService = mode === 'domestic' ? DOMESTIC_SERVICE : ''
    setServiceType(nextService)
    updateRoute({ mode, service: nextService })
  }

  const handleSpecialistSelect = (service) => {
    setSearchMode('specialist')
    setServiceType(serviceType === service ? '' : service)
  }

  const handleSearch = () => updateRoute()

  const handleClear = () => {
    setPostcode('')
    setSearchMode('')
    setServiceType('')
    setTimePreference('Any time')
    setRadius('8')
    setExactLocation(null)
    setActiveCleanerIndex(0)
    router.replace('/cleaners')
  }

  const goToCleaner = (direction) => {
    if (!cleaners.length) return
    setActiveCleanerIndex((current) => {
      if (direction === 'next') return current === cleaners.length - 1 ? 0 : current + 1
      return current === 0 ? cleaners.length - 1 : current - 1
    })
  }

  const activeCleaner = cleaners[activeCleanerIndex]
  const locationLabel = postcode ? postcode.toUpperCase() : exactLocation ? 'your area' : 'near you'

  const handleSwipeStart = (event) => {
    swipeStartX.current = event.touches?.[0]?.clientX ?? null
  }

  const handleSwipeEnd = (event) => {
    if (swipeStartX.current === null) return
    const endX = event.changedTouches?.[0]?.clientX
    if (typeof endX !== 'number') return
    const diff = swipeStartX.current - endX
    swipeStartX.current = null
    if (Math.abs(diff) < 45) return
    goToCleaner(diff > 0 ? 'next' : 'previous')
  }

  const summary = useMemo(() => {
    const parts = []
    if (serviceType) parts.push(compactServiceLabel(serviceType))
    if (postcode) parts.push(`near ${postcode.toUpperCase()}`)
    return parts.length ? parts.join(' ') : 'trusted local cleaners'
  }, [postcode, serviceType])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(12,143,163,0.14),transparent_32rem),radial-gradient(circle_at_88%_18%,rgba(15,23,42,0.08),transparent_28rem),linear-gradient(180deg,#f3f8fa_0%,#e8f1f5_44%,#dfeaf0_100%)] text-slate-900">
      <PublicHeader />

      <section className="site-section pt-5 pb-5 sm:pt-8">
        <div className="relative isolate overflow-hidden rounded-[32px] border border-white/20 bg-slate-950 text-white shadow-[0_30px_100px_rgba(15,23,42,0.24)] sm:rounded-[42px]">
          <div className="absolute inset-0 bg-[url('/images/cleaner-arriving-luxury-home.jpg')] bg-cover bg-center opacity-55" />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.86)_42%,rgba(12,143,163,0.42)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/95 to-transparent" />
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#0C8FA3]/35 blur-3xl" />

          <div className="relative px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
            <span className="inline-flex rounded-full border border-white/[0.12] bg-white/[0.10] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100 shadow-sm backdrop-blur-xl sm:text-xs">
              Simpler cleaner search
            </span>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              What kind of cleaner do you need?
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-100 sm:text-xl sm:leading-8">
              Start with domestic cleaning for the closest available match, or choose specialist cleaning for a specific job.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {SEARCH_MODES.map((mode) => {
                const active = searchMode === mode.id
                const imageClass = mode.id === 'domestic'
                  ? "bg-[url('/images/services/regular-cleaning.jpg')]"
                  : "bg-[url('/images/service-cards-kitchen-bg.png')]"

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeSelect(mode.id)}
                    className={`group relative min-h-[190px] overflow-hidden rounded-[28px] border p-5 text-left shadow-[0_18px_55px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 sm:min-h-[230px] ${
                      active ? 'border-cyan-200 bg-white text-white ring-2 ring-cyan-200/60' : 'border-white/[0.18] bg-white/[0.10] text-white'
                    }`}
                  >
                    <span className={`absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105 ${imageClass}`} />
                    <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.15)_0%,rgba(2,6,23,0.62)_54%,rgba(2,6,23,0.92)_100%)]" />
                    <span className="relative flex h-full min-h-[150px] flex-col justify-end sm:min-h-[190px]">
                      <span className="flex items-end justify-between gap-4">
                        <span>
                          <span className="block text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">{mode.label}</span>
                          <span className="mt-2 block max-w-md text-sm font-medium leading-6 text-white/78 sm:text-base">{mode.description}</span>
                        </span>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-xl font-black text-slate-950 shadow-lg transition group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {searchMode === 'specialist' ? (
              <div className="mt-5 rounded-[26px] border border-white/[0.14] bg-slate-950/45 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/80">Choose specialist job</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {SPECIALIST_SERVICES.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => handleSpecialistSelect(service)}
                      className={`rounded-2xl border px-3 py-3 text-left text-sm font-bold transition ${
                        serviceType === service
                          ? 'border-cyan-200 bg-white text-slate-950'
                          : 'border-white/[0.12] bg-white/[0.10] text-white/[0.82] hover:bg-white/[0.16] hover:text-white'
                      }`}
                    >
                      {compactServiceLabel(service)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-[28px] border border-white/[0.16] bg-white/[0.14] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.16)] backdrop-blur-2xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="Enter postcode"
                  className="h-14 flex-1 rounded-2xl border border-white/60 bg-white px-5 text-lg font-semibold text-slate-950 shadow-lg outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#0C8FA3] px-8 text-base font-black text-white shadow-xl shadow-[#0C8FA3]/25 transition hover:-translate-y-0.5 hover:bg-[#087C8E] sm:min-w-36"
                >
                  Search
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-slate-200">
                <button
                  type="button"
                  onClick={handleUseExactLocation}
                  disabled={isLocating}
                  className="font-bold text-cyan-100 transition hover:text-white disabled:cursor-wait disabled:opacity-70"
                >
                  {isLocating ? 'Finding your area…' : 'Use my exact area'}
                </button>
                {locationError ? <span className="font-medium text-amber-200">{locationError}</span> : null}
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {TIME_PREFERENCES.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setTimePreference(time)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold shadow-sm backdrop-blur-xl transition ${
                    timePreference === time
                      ? 'border-white bg-white text-slate-950'
                      : 'border-white/[0.14] bg-white/[0.10] text-white/[0.78] hover:bg-white/[0.16] hover:text-white'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <details className="rounded-2xl border border-white/[0.12] bg-white/[0.10] px-4 py-3 text-sm text-slate-200 backdrop-blur-xl sm:min-w-56">
                <summary className="cursor-pointer font-bold text-white">Refine distance</summary>
                <div className="mt-3">
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="w-full rounded-2xl border border-white/[0.12] bg-slate-950/70 px-4 py-3 text-white outline-none"
                  >
                    <option value="5">5 miles</option>
                    <option value="8">8 miles</option>
                    <option value="12">12 miles</option>
                    <option value="15">15 miles</option>
                  </select>
                </div>
              </details>

              <div className="flex gap-3">
                <button onClick={handleSearch} className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-50">
                  Update results
                </button>
                <button onClick={handleClear} className="inline-flex items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.10] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.16]">
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section pb-12">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#0C8FA3]">Live availability</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Available cleaners today
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium leading-6 text-slate-600">
            {loading ? 'Finding trusted local cleaners…' : `Closest matches based on your area and availability. ${cleaners.length} cleaner${cleaners.length === 1 ? '' : 's'} matched for ${summary}.`}
          </p>
        </div>

        {searchMeta?.usedDistanceSearch ? (
          <p className="mb-5 rounded-full border border-teal-100 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur-xl">
            Best available cleaners are shown first. Domestic search starts with the nearest available match.
          </p>
        ) : null}

        {!searchMode ? (
          <div className="rounded-[34px] border border-white/70 bg-white/90 p-10 text-center shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="mx-auto mb-4 inline-flex rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">Start here</div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Choose domestic or specialist cleaning</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">Domestic takes customers straight to the closest available cleaner. Specialist opens specific options such as oven, carpet, window, gutter and end of tenancy cleaning.</p>
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-[34px] border border-white/70 bg-white/90 p-12 text-center shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#0C8FA3] border-t-transparent" />
            <p className="text-base font-semibold text-slate-700">Loading available cleaners…</p>
          </div>
        ) : cleaners.length ? (
          <div className="mx-auto max-w-xl">
            <div className="mb-4 flex items-center justify-between rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-xl">
              <span>{activeCleanerIndex + 1} of {cleaners.length}</span>
              <span>{activeCleanerIndex === 0 ? 'Best match' : 'Swipe for next'}</span>
            </div>

            <div
              className="touch-pan-y"
              onTouchStart={handleSwipeStart}
              onTouchEnd={handleSwipeEnd}
            >
              <CleanerCard cleaner={activeCleaner} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => goToCleaner('previous')}
                className="rounded-full border border-white/80 bg-white/85 px-5 py-3 text-sm font-black text-slate-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => goToCleaner('next')}
                className="rounded-full bg-[#0C8FA3] px-5 py-3 text-sm font-black text-white shadow-xl shadow-[#0C8FA3]/20 transition hover:-translate-y-0.5 hover:bg-[#087C8E]"
              >
                Next cleaner
              </button>
            </div>

            <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
              {cleaners.slice(0, 8).map((cleaner, index) => (
                <span
                  key={cleaner._id || index}
                  className={`h-1.5 rounded-full transition-all ${index === activeCleanerIndex ? 'w-7 bg-[#0C8FA3]' : 'w-1.5 bg-slate-300'}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/90 p-10 text-center shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#0C8FA3]/40 to-transparent" />
            <div className="mx-auto flex max-w-3xl flex-col items-center">
              <div className="mb-4 inline-flex rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">Expanding availability</div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">New cleaners coming soon</h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                We are currently onboarding trusted cleaners in this area. Try a wider distance or remove the service filter to see the nearest available matches.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button onClick={() => setRadius('12')} className="ftc-button-secondary">Widen distance</button>
                <button onClick={() => setServiceType(searchMode === 'domestic' ? DOMESTIC_SERVICE : '')} className="ftc-button-secondary">Remove specialist filter</button>
                <button
                  onClick={() => {
                    setPostcode('')
                    setSearchMode('')
                    setServiceType('')
                    setRadius('8')
                    router.replace('/cleaners')
                  }}
                  className="ftc-button-primary"
                >
                  Show all cleaners
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="sr-only" aria-label="Cleaner search information">
        <h2>Compare trusted local cleaners before you book</h2>
        <p>Use FindTrustedCleaners.com to search for domestic cleaners, deep cleaning, end of tenancy cleaning, oven cleaning, carpet cleaning and other local cleaning services.</p>
        <p>Cleaner profiles can show service details, availability, reviews, photos, insurance badges and useful trust signals so you can make a more informed choice.</p>
        <p>
          Start with domestic cleaning for everyday home cleaning, or specialist cleaning for oven cleaning, carpet cleaning, window cleaning, gutter cleaning, pressure washing and moving-related cleaning.
        </p>
      </section>

      <PublicFooter />
    </main>
  )
}
