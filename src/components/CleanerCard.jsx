'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CleanerCard({ cleaner }) {
  const router = useRouter();
  const id = cleaner?._id ? String(cleaner._id) : '';
  const href = id ? `/cleaners/${id}` : undefined;

  const handleCardOpen = (e) => {
    const tag = e.target?.tagName?.toLowerCase();
    const interactive = [
      'button',
      'a',
      'svg',
      'path',
      'input',
      'select',
      'option',
      'textarea',
      'label',
    ];
    if (interactive.includes(tag)) return;
    if (href) router.push(href);
  };

  const handleCardKey = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && href) {
      e.preventDefault();
      router.push(href);
    }
  };

  const handleBookingRequest = (e) => {
    // Booking should start from the profile page
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;

    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('clientId')
        : null;

    if (!clientId) {
      router.push(`/login/clients?next=/cleaners/${id}`);
    } else {
      router.push(`/cleaners/${id}`);
    }
  };

  return (
    <article
      className="relative rounded-2xl border p-4 shadow-sm hover:shadow-md transition"
      role={href ? 'link' : undefined}
      tabIndex={href ? 0 : -1}
      onClick={handleCardOpen}
      onKeyDown={handleCardKey}
    >
      {/* Full-card overlay → PROFILE only */}
      {href && (
        <Link
          href={href}
          prefetch={false}
          className="absolute inset-0 z-40"
          aria-label={`Open profile for ${cleaner?.name ?? 'cleaner'}`}
        />
      )}

      {/* Content */}
      <div className="relative z-50">
        <h3 className="text-lg font-semibold">
          {cleaner?.name || cleaner?.company || 'Cleaner'}
        </h3>
        {cleaner?.postcode && (
          <p className="text-sm opacity-70">{cleaner.postcode}</p>
        )}

        <div className="mt-3 flex gap-2">
          {href && (
            <Link
              href={href}
              prefetch={false}
              className="px-3 py-2 rounded-xl border"
              onClick={(e) => e.stopPropagation()}
            >
              View profile
            </Link>
          )}
          <button
            type="button"
            className="px-3 py-2 rounded-xl bg-black text-white"
            onClick={handleBookingRequest}
          >
            Request booking
          </button>
        </div>
      </div>
    </article>
  );
}
