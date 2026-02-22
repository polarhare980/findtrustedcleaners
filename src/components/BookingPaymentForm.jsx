'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { getCleanerId } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function BookingPaymentWrapper({ cleaner, day, time, price }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const cleanerId = getCleanerId(cleaner);

  useEffect(() => {
    if (!cleanerId || !day || !time || !price) return;

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
          setPaymentIntentId(data.paymentIntentId);
        } else {
          alert(data?.message || 'Failed to create payment intent.');
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
      <BookingPaymentForm
        cleaner={cleaner}
        day={day}
        time={time}
        price={price}
        stripePaymentIntentId={paymentIntentId}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
      />
    </Elements>
  );
}

function BookingPaymentForm({
  cleaner,
  day,
  time,
  price,
  stripePaymentIntentId,
  selectedService,
  setSelectedService,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !stripePaymentIntentId) return;
    if (!selectedService) {
      setMessage('Please select a service before proceeding.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/bookings/cleaner/${getCleanerId(cleaner)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          day,
          hour: time,
          serviceKey: selectedService,
          stripePaymentIntentId,
          amount: typeof price === 'number' ? price : Number(price),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(
          `/booking/confirmation?cleanerName=${encodeURIComponent(
            cleaner.companyName || cleaner.realName
          )}&slotDay=${data.purchase.day}&slotTime=${data.purchase.hour}`
        );
      } else {
        console.error('Booking error:', data.message);
        setMessage('Payment succeeded but booking failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Booking creation error:', err);
      setMessage('Payment succeeded but booking request failed.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 font-medium mb-2">Select Service</label>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">-- Choose a service --</option>
          {cleaner.servicesDetailed?.map((s) => (
            <option key={s.key} value={s.key}>
              {s.name} ({s.defaultDurationMins} mins)
            </option>
          ))}
        </select>
      </div>

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