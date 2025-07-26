'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const day = searchParams.get('day');
  const hour = searchParams.get('hour');
  const cleanerName = searchParams.get('cleanerName');

  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 text-center">
      {/* 🎊 Confetti Animation */}
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} />}

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-teal-800/15 to-teal-700/10"></div>

      {/* Main content */}
      <div className="relative z-10 max-w-xl">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8"
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-4"
          >
            Booking Confirmed 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg text-gray-700 mb-4"
          >
            Thank you! Your booking request has been sent successfully.
          </motion.p>

          {(day || hour || cleanerName) && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-sm text-gray-600 mb-6"
            >
              {cleanerName && <span>Cleaner: <strong>{cleanerName}</strong>. </span>}
              {day && hour && (
                <span>
                  Time booked: <strong>{day} at {hour}:00</strong>.
                </span>
              )}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              href="/clients/dashboard"
              className="inline-block bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ease-in-out font-medium"
            >
              Go to Dashboard
            </Link>

            <Link
              href="/"
              className="inline-block bg-white/80 backdrop-blur-sm border border-white/30 text-gray-800 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-white/90 transition-all duration-300 ease-in-out font-medium"
            >
              Return Home
            </Link>
          </motion.div>
        </motion.div>

        {/* Confirmation icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            We’ll notify you once the cleaner approves or declines the booking.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
