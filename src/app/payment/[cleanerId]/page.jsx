'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '@/components/PaymentForm'; // You will create this next

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PaymentPage() {
  const { cleanerId } = useParams();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // You may pass slot details via query string or session/local storage
  const slot = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('selectedSlot')) : null;
  const price = typeof window !== 'undefined' ? localStorage.getItem('bookingPrice') : null;

  useEffect(() => {
    if (!slot || !price) {
      setError('Missing booking information.');
      return;
    }

    const createPaymentIntent = async () => {
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

        const data = await res.json();

        if (!data.success) {
          setError('Failed to initiate payment.');
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
    };

    createPaymentIntent();
  }, [cleanerId, slot, price]);

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
