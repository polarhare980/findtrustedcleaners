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
  const [cleaner, setCleaner] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // ✅ Handle Booking Request
  const handleBookingRequest = async (day, time) => {
    const clientId = localStorage.getItem('clientId');

    if (!clientId) {
      alert('Please log in as a client to make a booking.');
      return;
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cleanerId: cleaner._id,
          clientId,
          day,
          time,
        }),
      });

      if (!res.ok) throw new Error('Booking failed');
      alert(`Booking request sent for ${day} at ${time}:00!`);
    } catch (err) {
      console.error('❌ Booking Request Error:', err.message);
      alert('There was a problem sending the booking request.');
    }
  };

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

<button
  onClick={() => {
    const clientId = localStorage.getItem('clientId');
    if (!clientId) {
      router.push(`/register/client?next=/cleaners/${cleaner._id}/checkout`);
    } else {
      router.push(`/cleaners/${cleaner._id}/checkout`);
    }
  }}
  className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded shadow"
>
  Book this Cleaner
</button>

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
                        onClick={() => handleBookingRequest(day, hourKey)}
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
                          onClick={() => handleBookingRequest(day, hour)}
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
