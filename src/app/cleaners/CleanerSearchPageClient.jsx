'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'
import CleanerCard from '@/components/CleanerCard'


const CLEANING_PATHS = [
  { id: 'home', label: 'Home Cleaning', description: 'Weekly, regular or one-off home cleaning.', services: ['Regular Cleaning', 'One-Off Deep Clean', 'End of Tenancy', 'Moving House Cleaning'] },
  { id: 'specialist', label: 'Specialist Cleaning', description: 'Ovens, carpets, windows, gutters and more.', services: ['Oven Cleaning', 'Carpet Cleaning', 'Window Cleaning', 'Pressure Washing', 'Gutter Cleaning'] },
]

const TIME_PREFERENCES = ['Any time', 'Weekday morning', 'Weekday afternoon', 'Evening', 'Weekend']

const fetchJson = async (url) => {
  const res = await fetch(url, { credentials: 'include' })
  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json() : {}
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || 'Failed to load cleaners')
  }
  return data
}

export default function CleanerSearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [postcode, setPostcode] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [cleaningPath, setCleaningPath] = useState('home')
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

  useEffect(() => {
    if (hydratedFromQuery) return

    const qpPostcode = searchParams.get('postcode') || ''
    const qpService = searchParams.get('service') || searchParams.get('serviceType') || ''
    const qpRadius = searchParams.get('radius') || '8'
    const qpPath = searchParams.get('path') || 'home'
    const qpTime = searchParams.get('time') || 'Any time'

    setPostcode(qpPostcode)
    setServiceType(qpService)
    setCleaningPath(qpPath === 'specialist' ? 'specialist' : 'home')
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
    if (serviceType.trim()) params.set('serviceType', serviceType.trim())
    if (radius) params.set('radius', radius)
    return `/api/cleaners/matched?${params.toString()}`
  }, [postcode, serviceType, cleaningPath, timePreference, radius, exactLocation])

  useEffect(() => {
    if (!hydratedFromQuery) return

    let active = true

    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const data = await fetchJson(apiUrl)
        if (!active) return
        setCleaners(Array.isArray(data?.cleaners) ? data.cleaners : [])
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

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (postcode.trim()) params.set('postcode', postcode.trim())
    if (serviceType.trim()) params.set('service', serviceType.trim())
    if (cleaningPath) params.set('path', cleaningPath)
    if (timePreference && timePreference !== 'Any time') params.set('time', timePreference)
    if (radius) params.set('radius', radius)
    router.replace(`/cleaners${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handleClear = () => {
    setPostcode('')
    setServiceType('')
    setCleaningPath('home')
    setTimePreference('Any time')
    setRadius('8')
    setExactLocation(null)
    router.replace('/cleaners')
  }

  const summary = useMemo(() => {
    const parts = []
    if (serviceType) parts.push(serviceType)
    if (postcode) parts.push(`near ${postcode.toUpperCase()}`)
    return parts.length ? parts.join(' ') : 'all available cleaners'
  }, [postcode, serviceType])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_38%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />

      <section className="site-section pt-8 pb-4">
        <div className="overflow-hidden rounded-[34px] border border-white/70 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fffe_100%)] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Cleaner matching</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Available cleaners today</h1>
                <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">Choose what you need, add a postcode if you want to tighten the match, then compare trusted cleaners with the soonest availability.</p>
              </div>
              <div className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm font-semibold text-teal-900">
                {loading ? 'Finding matches…' : `${cleaners.length} cleaner${cleaners.length === 1 ? '' : 's'} found for ${summary}.`}
              </div>
            </div>
          </div>
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Step 1</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">What do you need help with?</h2>
              <div className="mt-4 grid gap-3">
                {CLEANING_PATHS.map((path) => {
                  const active = cleaningPath === path.id
                  return (
                    <button key={path.id} type="button" onClick={() => { setCleaningPath(path.id); setServiceType('') }} className={`rounded-[26px] border p-5 text-left transition ${active ? 'border-teal-300 bg-teal-50 shadow-[0_16px_40px_rgba(20,184,166,0.14)]' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-teal-200'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-950">{path.label}</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{path.description}</p>
                        </div>
                        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${active ? 'border-teal-300 bg-white text-teal-800' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{active ? '✓' : '→'}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Step 2</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Add the basics</h2>
              <div className="mt-5 grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Postcode</label>
                  <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Enter your postcode" className="ftc-input bg-white" />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={handleUseExactLocation} disabled={isLocating} className="rounded-full border border-teal-200 bg-white px-3 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-50 disabled:cursor-wait disabled:opacity-70">
                      {isLocating ? 'Finding your area…' : 'Use my exact area'}
                    </button>
                    {locationError ? <span className="text-xs font-medium text-amber-700">{locationError}</span> : null}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Preferred time</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {TIME_PREFERENCES.map((time) => (
                      <button key={time} type="button" onClick={() => setTimePreference(time)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${timePreference === time ? 'border-teal-300 bg-teal-700 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-teal-800'}`}>{time}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Specific job</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(CLEANING_PATHS.find((path) => path.id === cleaningPath)?.services || []).map((service) => (
                      <button key={service} type="button" onClick={() => setServiceType(serviceType === service ? '' : service)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${serviceType === service ? 'border-teal-300 bg-white text-teal-900 shadow-sm' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-teal-200 hover:text-teal-800'}`}>{service}</button>
                    ))}
                  </div>
                </div>
                <details className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <summary className="cursor-pointer font-semibold text-slate-800">Optional: widen distance</summary>
                  <div className="mt-3">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Search distance</label>
                    <select value={radius} onChange={(e) => setRadius(e.target.value)} className="ftc-select bg-white">
                      <option value="5">5 miles</option><option value="8">8 miles</option><option value="12">12 miles</option><option value="15">15 miles</option>
                    </select>
                  </div>
                </details>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button onClick={handleSearch} className="ftc-button-primary w-full sm:w-auto">Show matching cleaners</button>
                <button onClick={handleClear} className="ftc-button-secondary w-full sm:w-auto">Start again</button>
              </div>
              {searchMeta?.usedDistanceSearch ? (<p className="mt-4 text-sm text-slate-500">Best available cleaners are shown first.</p>) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="site-section pb-12">
        {error ? (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            <p className="text-base font-medium text-slate-700">Loading cleaners…</p>
          </div>
        ) : cleaners.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cleaners.map((cleaner) => (
              <CleanerCard key={cleaner._id} cleaner={cleaner} />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-10 text-center shadow-sm">
            <div className="mx-auto flex max-w-3xl flex-col items-center">
              <div className="mb-4 inline-flex rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">Search tips</div>
              <h2 className="text-2xl font-semibold text-slate-900">No cleaners found yet</h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                There may not be a match for this exact search yet. Try broadening your radius, using a nearby postcode, or removing the service filter to see more local options.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button onClick={() => setRadius('12')} className="ftc-button-secondary">Broaden radius</button>
                <button onClick={() => setPostcode('')} className="ftc-button-secondary">Try nearby postcode</button>
                <button onClick={() => setServiceType('')} className="ftc-button-secondary">Remove service filter</button>
                <button
                  onClick={() => {
                    setPostcode('')
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

      <section className="site-section pb-12">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Compare trusted local cleaners before you book</h2>
          <div className="mt-4 grid gap-5 text-sm leading-7 text-slate-600 md:grid-cols-3">
            <p>Use FindTrustedCleaners.com to search for domestic cleaners, deep cleaning, end of tenancy cleaning, oven cleaning, carpet cleaning and other local cleaning services.</p>
            <p>Cleaner profiles can show service details, availability, reviews, photos, insurance badges and useful trust signals so you can make a more informed choice.</p>
            <p>Start with your postcode, choose the service you need, then compare nearby cleaners without relying on random social media posts or endless quote chasing. Explore <a href="/services/domestic-cleaning" className="font-semibold text-teal-700 underline">domestic cleaning</a>, <a href="/services/deep-cleaning" className="font-semibold text-teal-700 underline">deep cleaning</a>, <a href="/services/end-of-tenancy-cleaning" className="font-semibold text-teal-700 underline">end of tenancy cleaning</a>, or browse popular areas such as <a href="/locations/worthing" className="font-semibold text-teal-700 underline">Worthing</a> and <a href="/locations/littlehampton" className="font-semibold text-teal-700 underline">Littlehampton</a>.</p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
