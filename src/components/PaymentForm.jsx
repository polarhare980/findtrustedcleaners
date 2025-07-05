// File: /src/components/PaymentForm.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

export default function PaymentForm({ bookingId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    const cardElement = elements.getElement(CardElement);

    try {
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(
        '', // The clientSecret is passed automatically via Elements wrapper
        {
          payment_method: { card: cardElement },
        },
        { handleActions: true }
      );

      if (stripeError) {
        console.error('Stripe error:', stripeError);
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'requires_capture') {
        // ✅ Payment successful, now pending manual capture
        console.log('✅ PaymentIntent:', paymentIntent);

        // 🔓 Unlock the cleaner by calling the purchases API
        const purchaseRes = await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            cleanerId: paymentIntent.metadata.cleanerId, // Passed from backend
          }),
        });

        const purchaseData = await purchaseRes.json();

        if (!purchaseData.success) {
          setError('Payment succeeded, but failed to unlock cleaner.');
          setLoading(false);
          return;
        }

        setSuccess(true);

        // ✅ Redirect after a short success message
        setTimeout(() => {
          router.push('/clients/dashboard');
        }, 2000);
      } else {
        setError('Payment failed or was not processed correctly.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border p-4 rounded">
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>

      {success && (
        <p className="text-green-600 text-center mt-4">
          Payment successful! Redirecting...
        </p>
      )}
    </form>
  );
}
