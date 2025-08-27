'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '@/components/PaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PaymentPage() {
  const { cleanerId } = useParams();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      // 1) Auth check (must be a logged-in CLIENT)
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const me = await meRes.json();
        if (!me?.success || me?.user?.type !== 'client') {
          const next = `/payment/${cleanerId}`;
          router.replace(`/login/clients?next=${encodeURIComponent(next)}`);
          return;
        }
      } catch {
        const next = `/payment/${cleanerId}`;
        router.replace(`/login/clients?next=${encodeURIComponent(next)}`);
        return;
      }

      // 2) Get slot + price from storage
      const slotRaw = typeof window !== 'undefined' ? localStorage.getItem('selectedSlot') : null;
      const slot = slotRaw ? (() => { try { return JSON.parse(slotRaw); } catch { return null; } })() : null;
      const price = typeof window !== 'undefined' ? localStorage.getItem('bookingPrice') : null;

      if (!slot || !price) {
        setError('Missing booking information.');
        setLoading(false);
        return;
      }

      // 3) Create PaymentIntent (server will re-check auth)
      try {
        const res = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            cleanerId,
            day: slot.day,
            time: slot.time,
            price,
          }),
        });

        // If session expired between steps, redirect to login
        if (res.status === 401) {
          const next = `/payment/${cleanerId}`;
          router.replace(`/login/clients?next=${encodeURIComponent(next)}`);
          return;
        }

        const data = await res.json();
        if (!res.ok || !data?.success) {
          setError(data?.message || 'Failed to initiate payment.');
          setLoading(false);
          return;
        }

        setClientSecret(data.clientSecret);
        setBookingId(data.bookingId);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Server error.');
      } finally {
        setLoading(false);
      }
    })();
  }, [cleanerId, router]);

  if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;
  if (loading) return <div className="p-6 text-center">Loading Payment...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 mt-6 border shadow rounded-xl bg-white">
      <h1 className="text-2xl font-bold mb-4 text-teal-700 text-center">Secure Payment</h1>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm bookingId={bookingId} />
      </Elements>
    </div>
  );
}
