'use client'

import { useEffect, useMemo, useState } from 'react'
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

  const activeMode = SEARCH_MODES.find((mode) => mode.id === searchMode)
  const activeCleaner = cleaners[activeCleanerIndex]
  const locationLabel = postcode ? postcode.toUpperCase() : exactLocation ? 'your area' : 'near you'

  const summary = useMemo(() => {
    const parts = []
    if (serviceType) parts.push(compactServiceLabel(serviceType))
    if (postcode) parts.push(`near ${postcode.toUpperCase()}`)
    return parts.length ? parts.join(' ') : 'trusted local cleaners'
  }, [postcode, serviceType])

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(12,143,163,0.14),transparent_32rem),radial-gradient(circle_at_88%_18%,rgba(15,23,42,0.08),transparent_28rem),linear-gradient(180deg,#f3f8fa_0%,#e8f1f5_44%,#dfeaf0_100%)] text-slate-900">
      <PublicHeader />

      <section className="site-section pt-4 pb-5 sm:pt-10">
        <div className="relative isolate w-full max-w-full overflow-hidden rounded-[28px] border border-white/20 bg-slate-950 text-white shadow-[0_30px_100px_rgba(15,23,42,0.24)]">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(2,6,23,0.96)_0%,rgba(15,23,42,0.86)_48%,rgba(12,143,163,0.36)_100%)]" />
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#0C8FA3]/35 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-cyan-200/10 blur-3xl" />

          <div className="relative grid min-w-0 gap-6 p-4 sm:gap-8 sm:p-8 lg:grid-cols-[1.03fr_0.97fr] lg:p-10">
            <div className="flex min-h-0 min-w-0 flex-col justify-between sm:min-h-[430px]">
              <div>
                <span className="inline-flex max-w-full rounded-full border border-white/[0.12] bg-white/[0.10] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100 shadow-sm backdrop-blur-xl sm:px-4 sm:text-xs sm:tracking-[0.22em]">
                  Simpler cleaner search
                </span>
                <h1 className="mt-5 max-w-3xl break-words text-[2.55rem] font-semibold leading-[0.95] tracking-[-0.055em] text-white sm:mt-6 sm:text-6xl lg:text-7xl">
                  What kind of cleaner do you need?
                </h1>
                <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-200 sm:mt-6 sm:text-2xl sm:leading-8">
                  Start with domestic cleaning for the closest available match, or choose specialist cleaning for a specific job.
                </p>
              </div>

              <div className="mt-8">
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  {SEARCH_MODES.map((mode) => {
                    const active = searchMode === mode.id
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleModeSelect(mode.id)}
                        className={`min-w-0 overflow-hidden rounded-[22px] border p-4 text-left backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 sm:rounded-[26px] sm:p-5 ${
                          active
                            ? 'border-cyan-200 bg-white text-slate-950 shadow-[0_18px_45px_rgba(255,255,255,0.18)]'
                            : 'border-white/[0.14] bg-white/[0.10] text-white hover:bg-white/[0.16]'
                        }`}
                      >
                        <span className="text-base font-black tracking-tight">{mode.label}</span>
                        <span className={`mt-2 block break-words text-sm leading-6 ${active ? 'text-slate-600' : 'text-white/[0.68]'}`}>{mode.description}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-5 flex min-w-0 flex-col gap-3 sm:mt-6 sm:flex-row">
                  <input
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="Enter postcode"
                    className="
    w-full
    h-14
    rounded-2xl
    bg-white
    text-slate-900
    placeholder:text-slate-500
    px-5
    text-lg
    font-medium
    border border-white/40
    shadow-lg
    focus:outline-none
    focus:ring-2
    focus:ring-cyan-400
    focus:border-cyan-300
    transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="inline-flex h-14 items-center justify-center rounded-full bg-[#0C8FA3] px-7 text-base font-bold text-white shadow-xl shadow-[#0C8FA3]/20 transition hover:-translate-y-0.5 hover:bg-[#087C8E]"
                  >
                    Search
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
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
            </div>

            <div className="min-w-0 rounded-[26px] border border-white/[0.14] bg-white/[0.12] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.16)] backdrop-blur-2xl sm:rounded-[34px] sm:p-5">
              <div className="min-w-0 rounded-[22px] border border-white/[0.12] bg-white/[0.10] p-4 sm:rounded-[28px] sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/[0.80]">Your route</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{activeMode?.title || 'Choose domestic or specialist'}</h2>
                  </div>
                  <div className="rounded-full border border-white/[0.12] bg-white/[0.10] px-3 py-1.5 text-xs font-bold text-white/[0.80]">
                    {loading ? 'Live' : `${cleaners.length} found`}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {searchMode === 'domestic'
                    ? 'Domestic cleaning skips the extra choices and shows the best nearby match first.'
                    : searchMode === 'specialist'
                      ? 'Pick one specialist service below. Domestic cleaning is intentionally not repeated here.'
                      : 'Most customers only need to decide between everyday home cleaning and a specific specialist job.'}
                </p>

                {searchMode === 'specialist' ? (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/[0.48]">Specialist job</p>
                    <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                      {SPECIALIST_SERVICES.map((service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => handleSpecialistSelect(service)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition break-words ${
                            serviceType === service
                              ? 'border-cyan-200 bg-white text-slate-950'
                              : 'border-white/[0.12] bg-white/[0.08] text-white/[0.78] hover:bg-white/[0.14] hover:text-white'
                          }`}
                        >
                          {compactServiceLabel(service)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/[0.48]">Timing</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {TIME_PREFERENCES.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setTimePreference(time)}
                        className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition ${
                          timePreference === time
                            ? 'border-cyan-200 bg-white text-slate-950'
                            : 'border-white/[0.12] bg-white/[0.08] text-white/[0.74] hover:bg-white/[0.14] hover:text-white'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <details className="mt-5 rounded-2xl border border-white/[0.12] bg-white/[0.08] px-4 py-3 text-sm text-slate-200">
                  <summary className="cursor-pointer font-bold text-white">Refine distance</summary>
                  <div className="mt-3">
                    <select
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.12] bg-slate-950/60 px-4 py-3 text-white outline-none"
                    >
                      <option value="5">5 miles</option>
                      <option value="8">8 miles</option>
                      <option value="12">12 miles</option>
                      <option value="15">15 miles</option>
                    </select>
                  </div>
                </details>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button onClick={handleSearch} className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-50">
                    Update results
                  </button>
                  <button onClick={handleClear} className="inline-flex items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.08] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.14]">
                    Reset
                  </button>
                </div>
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
              {searchMode === 'domestic' ? `Closest available domestic cleaner ${postcode || exactLocation ? `near ${locationLabel}` : 'near you'}` : `Available cleaners ${postcode || exactLocation ? `near ${locationLabel}` : 'near you'}`}
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium leading-6 text-slate-600">
            {loading ? 'Finding trusted local cleaners…' : `${cleaners.length} cleaner${cleaners.length === 1 ? '' : 's'} matched for ${summary}.`}
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
          searchMode === 'domestic' ? (
            <div className="mx-auto max-w-xl">
              <div className="mb-4 flex items-center justify-between rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-xl">
                <span>{activeCleanerIndex + 1} of {cleaners.length}</span>
                <span>{activeCleanerIndex === 0 ? 'Best match' : 'Next available option'}</span>
              </div>

              <CleanerCard cleaner={activeCleaner} />

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
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {cleaners.map((cleaner) => (
                <CleanerCard key={cleaner._id} cleaner={cleaner} />
              ))}
            </div>
          )
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
