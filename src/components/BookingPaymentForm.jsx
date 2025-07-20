'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { getCleanerId } from '@/lib/utils';

// ✅ Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

// ✅ Wrapper Component
export default function BookingPaymentWrapper({ cleaner, day, time, price }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const cleanerId = getCleanerId(cleaner);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const res = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ cleanerId, day, time, price }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId); // ✅ capture this
        } else {
          alert('Failed to create payment intent.');
        }
      } catch (err) {
        console.error('Payment intent error:', err);
        alert('Payment setup failed.');
      }
    };

    if (cleanerId) {
      createPaymentIntent();
    }
  }, [cleanerId, day, time, price]);

  if (!clientSecret) return <div>Loading payment form...</div>;

  return (
    <Elements options={{ clientSecret }} stripe={stripePromise}>
      <BookingPaymentForm
        cleaner={cleaner}
        day={day}
        time={time}
        stripePaymentIntentId={paymentIntentId}
      />
    </Elements>
  );
}

// ✅ Stripe Elements Payment Form
function BookingPaymentForm({ cleaner, day, time, stripePaymentIntentId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !stripePaymentIntentId) return;

    setLoading(true);
    setMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // ✅ Create booking in DB
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cleanerId: getCleanerId(cleaner),
          day,
          time,
          stripePaymentIntentId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(
          `/booking/confirmation?cleanerName=${encodeURIComponent(data.cleanerName)}&slotDay=${data.slotDay}&slotTime=${data.slotTime}`
        );
      } else {
        console.error('Booking error:', data.message);
        setMessage('Payment was successful but booking failed.');
      }
    } catch (err) {
      console.error('Booking creation error:', err);
      setMessage('Payment succeeded but something went wrong with booking.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded"
      >
        {loading ? 'Processing...' : 'Pay Now to Hold Booking'}
      </button>
      {message && <div className="text-center mt-4 text-red-600">{message}</div>}
    </form>
  );
}
