'use client';

import Link from 'next/link';

export default function BookingConfirmationPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl bg-white border shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-teal-700 mb-4">Booking Confirmed 🎉</h1>
        <p className="text-lg text-gray-700 mb-6">
          Thank you! Your booking request has been sent successfully.
        </p>

        <Link
          href="/clients/dashboard"
          className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg shadow hover:bg-teal-700 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
