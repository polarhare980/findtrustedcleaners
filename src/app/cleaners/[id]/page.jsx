'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';

// ✅ Sanitation for embed code
function isSafeEmbed(code) {
  const hasIframe = code.includes('<iframe') && code.includes('src=');
  const forbidden = ['<script', '<style', 'onerror', 'onload', 'javascript:'];
  const lower = code.toLowerCase();
  const containsForbidden = forbidden.some(frag => lower.includes(frag));
  return hasIframe && !containsForbidden;
}

export default function PublicCleanerProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cleaner, setCleaner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    const fetchCleaner = async () => {
      try {
        const res = await fetch(`/api/public-cleaners/${id}`);
        const data = await res.json();
        setCleaner(data);
      } catch (err) {
        console.error('Failed to load cleaner profile', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCleaner();
  }, [id]);

  // ✅ Handle Stripe Checkout Request
  const handleStripeCheckout = async (day, time, price) => {
    try {
      const authRes = await fetch('/api/auth/me', { credentials: 'include' });
      const authData = await authRes.json();

      if (!authData.success || authData.user.type !== 'client') {
        alert('Please log in as a client to make a booking.');
        router.push('/login/clients');
        return;
      }

      const res = await fetch('/api/stripe/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId: cleaner._id, day, time, price }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error('Stripe session failed');

      // ✅ Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('❌ Stripe Checkout Error:', err.message);
      alert('There was a problem connecting to Stripe.');
    }
  };

  if (!mounted) return null;

  if (loading) return <p className="p-6 text-gray-500">Loading profile...</p>;
  if (!cleaner) return <p className="p-6 text-red-500">Cleaner not found</p>;

  return (
    <div className="max-w-xl mx-auto p-6 border shadow rounded-xl mt-6 bg-white">
      {/* Profile Image */}
      {cleaner.image && (
        <div className="flex justify-center mb-6">
          <img src={cleaner.image} alt={cleaner.realName} className="w-32 h-32 object-cover rounded-full border" />
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4 text-teal-700">{cleaner.realName}</h1>
      <p><strong>Postcode:</strong> {cleaner.postcode}</p>
      <p><strong>Hourly Rate:</strong> £{cleaner.rate || 'Not set'}</p>

      <div className="mt-4">
        <h2 className="font-semibold">Services Offered:</h2>
        {Array.isArray(cleaner.services) && cleaner.services.length > 0 ? (
          <ul className="list-disc list-inside">
            {cleaner.services.map((service, i) => (
              <li key={i}>{service}</li>
            ))}
          </ul>
        ) : (
          <p className="italic text-sm text-gray-500">No services listed</p>
        )}
      </div>

      {/* ✅ Reviews Section */}
      {(cleaner.googleReviewUrl || cleaner.facebookReviewUrl || cleaner.embedCode) && (
        <div className="mt-6">
          <h2 className="font-semibold text-teal-700 mb-2">Reviews</h2>

          {/* External Links */}
          <div className="space-y-2 text-sm">
            {cleaner.googleReviewUrl && (
              <a
                href={cleaner.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline block"
              >
                View Google Reviews
              </a>
            )}
            {cleaner.facebookReviewUrl && (
              <a
                href={cleaner.facebookReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline block"
              >
                View Facebook Page
              </a>
            )}
          </div>

          {/* Embedded Widget */}
          {cleaner.embedCode && isSafeEmbed(cleaner.embedCode) && (
            <div
              className="mt-4"
              dangerouslySetInnerHTML={{ __html: cleaner.embedCode }}
            />
          )}
        </div>
      )}

      {/* ✅ Availability Grid (Responsive) */}
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Availability:</h2>

        {/* Desktop Grid */}
        <div className="hidden sm:grid grid-cols-[80px_repeat(13,_1fr)] gap-1 text-sm">
          <div></div>
          {[...Array(13)].map((_, hour) => (
            <div key={hour} className="text-center font-bold text-gray-700">
              {7 + hour}:00
            </div>
          ))}
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
            <React.Fragment key={day}>
              <div className="font-semibold text-gray-800">{day}</div>
              {[...Array(13)].map((_, hourIndex) => {
                const hourKey = `${7 + hourIndex}`;
                const isAvailable = cleaner.availability?.[day]?.[hourKey] === true;

                return (
                  <div key={hourKey} className="h-8 w-full">
                    {isAvailable ? (
                      <button
                        onClick={() => handleStripeCheckout(day, hourKey, cleaner.rate)}
                        className="w-full h-full bg-green-500 hover:bg-green-600 text-white rounded"
                      >
                        Book
                      </button>
                    ) : (
                      <div className="w-full h-full bg-red-300 text-center rounded">✖</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile Stacked View */}
        <div className="sm:hidden space-y-4 mt-4">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
            <div key={day}>
              <h3 className="text-md font-semibold text-gray-700">{day}</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {[...Array(13)].map((_, hourIndex) => {
                  const hour = 7 + hourIndex;
                  const isAvailable = cleaner.availability?.[day]?.[`${hour}`] === true;

                  return (
                    <div key={hour} className="w-full">
                      {isAvailable ? (
                        <button
                          onClick={() => handleStripeCheckout(day, hour, cleaner.rate)}
                          className="w-full bg-green-500 hover:bg-green-600 text-white rounded py-1"
                        >
                          {hour}:00 Book
                        </button>
                      ) : (
                        <div className="w-full bg-red-300 text-center rounded py-1">
                          {hour}:00 ✖
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
