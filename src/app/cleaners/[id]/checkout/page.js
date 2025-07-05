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
      }
      setMounted(true);
    }
  }, [id, router]);

  useEffect(() => {
    const fetchCleaner = async () => {
      try {
        const res = await fetch(`/api/public-cleaners/${id}`);
        const data = await res.json();
        setCleaner(data);
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

  if (loading) return <p className="p-10 text-center text-gray-500">Loading checkout...</p>;
  if (!cleaner) return <p className="p-10 text-center text-red-500">Cleaner not found.</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 mt-6 bg-white shadow-lg rounded-lg border">
      <h1 className="text-3xl font-bold text-teal-700 mb-6">Checkout</h1>

      {/* Mini Profile Summary */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-shrink-0">
          {cleaner.image && (
            <img src={cleaner.image} alt={cleaner.realName} className="w-32 h-32 object-cover rounded-full border" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{cleaner.realName}</h2>
          <p className="mb-1"><strong>Company:</strong> {cleaner.companyName || 'N/A'}</p>
          <p className="mb-1"><strong>Postcode:</strong> {cleaner.postcode}</p>
          <p className="mb-1"><strong>Hourly Rate:</strong> £{cleaner.rates}</p>
          <Link
            href={`/cleaners/${cleaner._id}`}
            className="inline-block mt-2 text-sm text-blue-600 underline"
          >
            View Full Profile
          </Link>
        </div>
      </div>

      {/* Payment Section (Placeholder) */}
      <div className="p-6 border rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold mb-4">Payment</h3>
        <p className="mb-4 text-gray-600">This is where the payment form will go (Stripe, PayPal, etc).</p>

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