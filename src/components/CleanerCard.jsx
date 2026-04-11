'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useState } from 'react'

export default function CleanerCard({ cleaner }) {
  const [liked, setLiked] = useState(false)

  return (
    <Link href={`/cleaners/${cleaner._id}`}>
      <div className="group bg-white/70 backdrop-blur-lg border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 p-5">
        
        {/* Image Section */}
        <div className="relative">
          <img
            src={cleaner.image || '/default-cleaner.jpg'}
            alt={cleaner.companyName}
            className="w-full h-44 object-cover rounded-xl"
          />

          {/* Heart Icon */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setLiked(!liked)
            }}
            className="absolute top-3 right-3 bg-white/60 backdrop-blur-md p-1.5 rounded-full opacity-80 hover:opacity-100 transition"
          >
            <Heart
              size={16}
              className={`${liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>

          {/* Premium Badge */}
          {cleaner.isPremium && (
            <div className="absolute top-3 left-3">
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-amber-200 to-amber-100 text-amber-800 border border-amber-200">
                Premium
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3">
          
          {/* Company Name */}
          <h3 className="text-lg font-semibold text-gray-800">
            {cleaner.companyName}
          </h3>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            {cleaner.businessInsurance && (
              <span className="px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                Insured
              </span>
            )}

            {cleaner.dbsChecked && (
              <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                DBS Checked
              </span>
            )}
          </div>

          {/* Services */}
          {cleaner.services && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {cleaner.services.join(', ')}
            </p>
          )}

          {/* Rate */}
          {cleaner.hourlyRate && (
            <div className="text-sm font-medium text-gray-700">
              From £{cleaner.hourlyRate}/hr
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
