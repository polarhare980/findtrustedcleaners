'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    if (sessionId) {
      setMessage('✅ Payment successful! Your cleaner profile has been unlocked.');
    } else {
      setMessage('❌ No session ID found. Something went wrong.');
    }
  }, [sessionId]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Payment Complete</h1>
        <p className="mb-6">{message}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200"
          >
            Return to Home
          </Link>
          <Link
            href="/cleaners/dashboard"
            className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
