'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ClientPaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [message, setMessage] = useState('Verifying your payment...');
  const [cleanerId, setCleanerId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setMessage('❌ No session ID found. Something went wrong.');
      setLoading(false);
      return;
    }

    fetch(`/api/stripe/confirm-purchase?session_id=${sessionId}`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage('✅ Payment successful! You now have access to this cleaner’s full profile.');
          if (data.cleanerId) setCleanerId(data.cleanerId); // must return cleanerId in response
        } else {
          setMessage('❌ Payment could not be verified. Please contact support.');
        }
      })
      .catch(() => {
        setMessage('❌ Something went wrong while verifying your payment.');
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Payment Complete</h1>
        <p className="mb-6">{message}</p>

        {!loading && (
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <Link
              href="/"
              className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200"
            >
              Return to Home
            </Link>
            <Link
              href="/clients/dashboard"
              className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-all duration-200"
            >
              Go to Dashboard
            </Link>
            {cleanerId && (
              <Link
                href={`/cleaners/${cleanerId}`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200"
              >
                Back to Cleaner Profile
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
