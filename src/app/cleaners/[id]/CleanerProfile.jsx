'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import React from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingPaymentWrapper from '@/components/BookingPaymentForm';
import PurchaseButton from '@/components/PurchaseButton';

function isSafeEmbed(code) {
  const hasIframe = code.includes('<iframe') && code.includes('src=');
  const forbidden = ['<script', '<style', 'onerror', 'onload', 'javascript:'];
  const lower = code.toLowerCase();
  const containsForbidden = forbidden.some(frag => lower.includes(frag));
  return hasIframe && !containsForbidden;
}

export default function CleanerProfile() {
  const { id } = useParams();

  const [mounted, setMounted] = useState(false);
  const [cleaner, setCleaner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    const fetchCleaner = async () => {
      try {
        const res = await fetch(`/api/cleaners/${id}`, { credentials: 'include' });

        if (!res.ok) {
          setError('Cleaner not found or server error.');
          return;
        }

        const data = await res.json();

        if (!data || !data.success || !data.cleaner) {
          setError('Cleaner not found.');
          return;
        }

        setCleaner(data.cleaner);
        setHasAccess(data.hasAccess);
      } catch (err) {
        console.error('Failed to load cleaner profile', err);
        setError('Failed to fetch cleaner profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchCleaner();
  }, [id]);

  if (!mounted) return null;
  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <main className="p-6 text-red-600 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 border shadow rounded-xl mt-6 bg-white">
      {cleaner.image && (
        <div className="flex justify-center mb-6">
          <img src={cleaner.image} alt={cleaner.realName} className="w-32 h-32 object-cover rounded-full border" />
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4 text-teal-700">{cleaner.realName}</h1>
      <p><strong>Postcode:</strong> {cleaner.postcode}</p>
      <p><strong>Hourly Rate:</strong> £{cleaner.rate || 'Not set'}</p>

      {hasAccess ? (
        <>
          <p><strong>Phone:</strong> {cleaner.phone}</p>
          <p><strong>Email:</strong> {cleaner.email}</p>
          <p><strong>Company Name:</strong> {cleaner.companyName}</p>
        </>
      ) : (
        <>
          <p className="text-gray-500 italic mb-4">Contact details are locked. Unlock to view and book.</p>
          <PurchaseButton
            cleanerId={cleaner._id}
            onPurchaseSuccess={(cleanerData) => {
              setHasAccess(true);
              setCleaner((prev) => ({
                ...prev,
                phone: cleanerData.phone,
                email: cleanerData.email,
                companyName: cleanerData.cleanerName,
              }));
            }}
          />
        </>
      )}

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

      {(cleaner.googleReviewUrl || cleaner.facebookReviewUrl || cleaner.embedCode) && (
        <div className="mt-6">
          <h2 className="font-semibold text-teal-700 mb-2">Reviews</h2>

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

          {cleaner.embedCode && isSafeEmbed(cleaner.embedCode) && (
            <div className="mt-4" dangerouslySetInnerHTML={{ __html: cleaner.embedCode }} />
          )}
        </div>
      )}

      <div className="mt-6">
  <h2 className="font-semibold mb-2">Availability:</h2>

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
                hasAccess ? (
                  <button
                    onClick={() => setSelectedSlot({ day, hour: hourKey })}
                    className="w-full h-full bg-green-500 hover:bg-green-600 text-white rounded"
                  >
                    Book
                  </button>
                ) : (
                  <div className="w-full h-full bg-green-300 text-center rounded">✔ Available</div>
                )
              ) : (
                <div className="w-full h-full bg-red-300 text-center rounded">✖</div>
              )}
            </div>
          );
        })}
      </React.Fragment>
    ))}
  </div>

  {/* Mobile View */}
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
                  hasAccess ? (
                    <button
                      onClick={() => setSelectedSlot({ day, hour: `${hour}` })}
                      className="w-full bg-green-500 hover:bg-green-600 text-white rounded py-1"
                    >
                      {hour}:00 Book
                    </button>
                  ) : (
                    <div className="w-full bg-green-300 text-center rounded py-1">
                      {hour}:00 ✔
                    </div>
                  )
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


      {hasAccess && selectedSlot && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2 text-center">
            Booking for {selectedSlot.day} at {selectedSlot.hour}:00
          </h2>
          <BookingPaymentWrapper
            cleanerId={cleaner._id}
            day={selectedSlot.day}
            time={selectedSlot.hour}
            price={cleaner.rate}
          />
        </div>
      )}
    </div>
  );
}
