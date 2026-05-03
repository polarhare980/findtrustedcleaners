'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'
import CleanerCard from '@/components/CleanerCard'
import { ALL_SERVICE_OPTIONS } from '@/lib/serviceOptions'

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
  const [radius, setRadius] = useState('8')
  const [hydratedFromQuery, setHydratedFromQuery] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cleaners, setCleaners] = useState([])
  const [searchMeta, setSearchMeta] = useState(null)

  useEffect(() => {
    if (hydratedFromQuery) return

    const qpPostcode = searchParams.get('postcode') || ''
    const qpService = searchParams.get('service') || searchParams.get('serviceType') || ''
    const qpRadius = searchParams.get('radius') || '8'

    setPostcode(qpPostcode)
    setServiceType(qpService)
    setRadius(qpRadius)
    setHydratedFromQuery(true)
  }, [searchParams, hydratedFromQuery])

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (postcode.trim()) params.set('postcode', postcode.trim())
    if (serviceType.trim()) params.set('serviceType', serviceType.trim())
    if (radius) params.set('radius', radius)
    return `/api/cleaners?${params.toString()}`
  }, [postcode, serviceType, radius])

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

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (postcode.trim()) params.set('postcode', postcode.trim())
    if (serviceType.trim()) params.set('service', serviceType.trim())
    if (radius) params.set('radius', radius)
    router.replace(`/cleaners${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handleClear = () => {
    setPostcode('')
    setServiceType('')
    setRadius('8')
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
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Trusted cleaner marketplace</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Find a cleaner</h1>
              <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
                Search by postcode, refine by service, and browse cleaner profiles with availability, reviews and trust signals in one place.
              </p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
              {loading ? 'Loading results…' : `${cleaners.length} cleaner${cleaners.length === 1 ? '' : 's'} found for ${summary}.`}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_180px_auto_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Service</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="ftc-select">
                <option value="">All cleaning services</option>
                {ALL_SERVICE_OPTIONS.map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Postcode</label>
              <input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Enter your postcode"
                className="ftc-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Radius</label>
              <select value={radius} onChange={(e) => setRadius(e.target.value)} className="ftc-select">
                <option value="5">5 miles</option>
                <option value="8">8 miles</option>
                <option value="12">12 miles</option>
                <option value="15">15 miles</option>
              </select>
            </div>

            <button onClick={handleSearch} className="ftc-button-primary w-full lg:w-auto">Search</button>
            <button onClick={handleClear} className="ftc-button-secondary w-full lg:w-auto">Clear</button>
          </div>

          {searchMeta?.usedDistanceSearch && postcode ? (
            <p className="mt-4 text-sm text-slate-500">
              Showing cleaners within roughly {searchMeta?.radiusMiles || radius} miles of {postcode.toUpperCase()}.
            </p>
          ) : null}
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
            <p>Start with your postcode, choose the service you need, then compare nearby cleaners without relying on random social media posts or endless quote chasing.</p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
