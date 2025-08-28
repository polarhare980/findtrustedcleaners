'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Head from 'next/head';

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const cleanerName = searchParams.get('cleanerName');
  const slotDay = searchParams.get('slotDay');
  const slotTime = searchParams.get('slotTime');

  useEffect(() => {
    // Optional: redirect to home if accessed without booking params
    if (!cleanerName || !slotDay || !slotTime) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 10000); // redirect after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [cleanerName, slotDay, slotTime, router]);

  return (
    <>
      <Head>
        <title>Booking Confirmed | FindTrustedCleaners</title>
      </Head>

      <main className="max-w-2xl mx-auto px-4 py-10 text-gray-800">
        <h1 className="text-4xl font-bold text-teal-800 mb-6 text-center">
          Booking Confirmation
        </h1>

        <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-xl shadow mb-6">
          ✅ Your booking request has been sent! The cleaner must approve before payment is captured.
        </div>

        <p className="text-base mb-6">
          You’ll receive an email when the cleaner responds. This profile will remain marked as
          <strong className="text-yellow-700"> pending</strong> until then.
        </p>

        {cleanerName && slotDay && slotTime && (
          <div className="bg-white border p-4 rounded-xl shadow text-sm">
            <p><strong>Cleaner:</strong> {cleanerName}</p>
            <p><strong>Day:</strong> {slotDay}</p>
            <p><strong>Time:</strong> {slotTime}</p>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          Redirecting to homepage shortly...
        </p>
      </main>
    </>
  );
}
