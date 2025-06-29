'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function BookingConfirmationPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl bg-white border shadow-lg rounded-lg p-8">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-teal-700 mb-4"
        >
          Booking Confirmed 🎉
        </motion.h1>

        <p className="text-lg text-gray-700 mb-6">
          Thank you! Your booking request has been sent successfully.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/clients/dashboard"
            className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg shadow hover:bg-teal-700 transition"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/"
            className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg shadow hover:bg-gray-300 transition"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}

