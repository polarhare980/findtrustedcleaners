'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CleanerSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Checking your premium upgrade...');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function confirmUpgrade() {
      if (!sessionId) {
        setMessage('We could not find your Stripe session. If Stripe charged you, open your dashboard and refresh once.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/stripe/confirm-upgrade?session_id=${encodeURIComponent(sessionId)}`, {
          method: 'POST',
          credentials: 'include',
        });

        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && data?.success) {
          setConfirmed(true);
          setMessage('Your premium upgrade is active. Your dashboard should now show premium access.');
        } else if (res.status === 202) {
          setMessage('Your payment has completed, but the upgrade is still syncing. Refresh your dashboard in a moment.');
        } else if (res.status === 401) {
          setMessage('Your payment completed, but you are no longer signed in on this domain. Sign in again and your premium status should load.');
        } else {
          setMessage(data?.error || 'Payment succeeded, but we could not confirm the premium unlock yet.');
        }
      } catch (err) {
        if (!cancelled) {
          setMessage('Payment succeeded, but confirmation failed on this page. Open your dashboard and refresh once.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    confirmUpgrade();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Premium Upgrade</h1>
        <p className="mb-6">{loading ? 'Verifying your upgrade...' : message}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cleaners/dashboard"
            className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200"
          >
            {confirmed ? 'Go to Premium Dashboard' : 'Go to Dashboard'}
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
