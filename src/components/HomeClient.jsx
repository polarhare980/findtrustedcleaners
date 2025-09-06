// src/components/HomeClient.jsx
'use client';

import React from 'react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url) => fetch(url, { credentials: 'include' }).then(r => r.json());

function CleanerCard({ cleaner }) {
  return (
    <div className="rounded-2xl p-5 bg-white/70 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={cleaner?.image || '/default-avatar.png'}
          alt={cleaner?.realName || 'Cleaner'}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold">{cleaner?.companyName || cleaner?.realName}</h3>
          {typeof cleaner?.googleReviewRating === 'number' && (
            <p className="text-sm opacity-80">
              ⭐ {cleaner.googleReviewRating.toFixed(1)} ({cleaner?.googleReviewCount || 0})
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm opacity-80">{cleaner?.address?.postcode || ''}</span>
        <Link
          href={`/cleaners/${cleaner?._id}`}
          className="px-4 py-2 rounded-xl bg-teal-600 text-white hover:opacity-90 transition"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

export default function HomeClient() {
  const { data, error, isLoading } = useSWR('/api/public-cleaners', fetcher);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-3">Find Trusted Cleaners</h1>
      <p className="text-base mb-8">
        Search and compare vetted cleaners in your area. Read reviews, check availability and book online.
      </p>

      {isLoading && <p>Loading cleaners…</p>}
      {error && <p className="text-red-600">Unable to load cleaners.</p>}

      <div className="grid md:grid-cols-3 gap-5">
        {data?.cleaners?.map((c) => <CleanerCard key={c._id} cleaner={c} />)}
      </div>

      <footer className="mt-12 border-t pt-6 text-sm opacity-80 flex gap-4">
        <Link href="/blog">Blog</Link>
        <Link href="/cleaners">All Cleaners</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </footer>
    </main>
  );
}
