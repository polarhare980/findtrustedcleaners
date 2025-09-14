'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false); // ✅ SSR Protection
  const [cleaner, setCleaner] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ SSR-safe Client Check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clientId = localStorage.getItem('clientId');
      if (!clientId) {
        router.push(`/login/clients?next=/cleaners/${id}/checkout`);
        return;
      }
      setMounted(true);
    }
  }, [id, router]);

  // ✅ Fetch cleaner details (fix: use data.cleaner or data.data)
  useEffect(() => {
    const fetchCleaner = async () => {
      try {
        const res = await fetch(`/api/public-cleaners/${id}`, { credentials: 'include' });
        const data = await res.json();
        setCleaner(data?.cleaner || data?.data || null);
      } catch (err) {
        console.error('Error fetching cleaner:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCleaner();
  }, [id]);

  // ✅ Prevent SSR build errors
  if (!mounted) return null;

  if (loading) return <div className="p-6">Loading…</div>;
  if (!cleaner) return <div className="p-6 text-red-600">Cleaner not found</div>;

  // Helper for rates (could be number or object)
  const hourlyRate =
    typeof cleaner.rates === 'number'
      ? cleaner.rates
      : (cleaner.rates && (cleaner.rates.hourly || cleaner.rates.regular)) || null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header / Summary */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-shrink-0">
          <img
            src={(typeof cleaner.image === 'string' && cleaner.image) || '/default-avatar.png'}
            alt={cleaner.companyName || cleaner.realName || 'Cleaner'}
            className="w-32 h-32 object-cover rounded-full border"
          />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">
            {cleaner.companyName || cleaner.realName || 'Cleaner'}
          </h2>
          <p className="text-sm text-gray-600">
            {cleaner.address?.postcode || ''}
          </p>
          {hourlyRate && (
            <p className="mt-2"><strong>Hourly Rate:</strong> £{hourlyRate}</p>
          )}
          <Link
            href={`/cleaners/${cleaner._id}`}
            className="inline-block mt-2 text-sm text-blue-600 underline"
          >
            View Full Profile
          </Link>
        </div>
      </div>

      {/* Availability (your existing UI here) */}
      <div className="p-6 border rounded-lg bg-white">
        <h3 className="text-xl font-semibold mb-4">Pick Availability</h3>
        <p className="text-gray-600 mb-2">
          Select your preferred time slot. The cleaner will confirm and then we’ll capture payment.
        </p>
        {/* TODO: your slot picker UI (unchanged) */}
      </div>

      {/* Payment Section (Placeholder) */}
      <div className="p-6 border rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold mb-4">Payment</h3>
        <p className="mb-4 text-gray-600">
          This is where the payment form will go (Stripe, PayPal, etc).
        </p>
        <button
          onClick={() => router.push('/booking/confirmation')}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded shadow"
        >
          Complete Booking
        </button>
      </div>
    </div>
  );
}
