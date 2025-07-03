'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// ✅ Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

// ✅ Wrapper Component
export default function BookingPaymentWrapper({ cleanerId, day, time, price }) {
  const [clientSecret, setClientSecret] = useState(null);

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
        } else {
          alert('Failed to create payment intent.');
        }
      } catch (err) {
        console.error('Payment intent error:', err);
        alert('Payment setup failed.');
      }
    };

    createPaymentIntent();
  }, [cleanerId, day, time, price]);

  if (!clientSecret) return <div>Loading payment form...</div>;

  return (
    <Elements options={{ clientSecret }} stripe={stripePromise}>
      <BookingPaymentForm />
    </Elements>
  );
}

// ✅ Stripe Elements Payment Form
function BookingPaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href }, // Optional redirect
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Payment authorised! Waiting for cleaner confirmation.');
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
      {message && <div className="text-center mt-4">{message}</div>}
    </form>
  );
}
