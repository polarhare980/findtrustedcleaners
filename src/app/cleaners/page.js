'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function CleanerSearchFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [postcode, setPostcode] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [radius, setRadius] = useState('8')
  const [hydratedFromQuery, setHydratedFromQuery] = useState(false)

  // Hydrate only once from query params
  useEffect(() => {
    if (hydratedFromQuery) return

    const qpPostcode = searchParams.get('postcode') || ''
    const qpService = searchParams.get('service') || ''
    const qpRadius = searchParams.get('radius') || '8'

    setPostcode(qpPostcode)
    setServiceType(qpService)
    setRadius(qpRadius)

    setHydratedFromQuery(true)
  }, [searchParams, hydratedFromQuery])

  const handleSearch = () => {
    const params = new URLSearchParams()

    if (postcode) params.set('postcode', postcode)
    if (serviceType) params.set('service', serviceType)
    if (radius) params.set('radius', radius)

    router.replace(`/cleaners?${params.toString()}`)
  }

  const handleClear = () => {
    setPostcode('')
    setServiceType('')
    setRadius('8')
    router.replace('/cleaners')
  }

  return (
    <div>
      {/* Your existing UI remains unchanged */}
    </div>
  )
}
