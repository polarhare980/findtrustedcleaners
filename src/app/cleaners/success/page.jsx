'use client';

import Link from 'next/link';
import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CleanerSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Checking your premium upgrade…');

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    async function confirmUpgrade(attempt = 0) {
      if (!sessionId) {
        setStatus('error');
        setMessage('We could not confirm the upgrade because the Stripe session ID is missing.');
        return;
      }

      try {
        const res = await fetch('/api/stripe/confirm-upgrade-session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && data?.success) {
          setStatus('success');
          setMessage('Your premium profile is now unlocked. Redirecting you to your dashboard…');
          timeoutId = window.setTimeout(() => router.replace('/cleaners/dashboard?upgrade=success'), 1400);
          return;
        }

        if (data?.pending && attempt < 6) {
          setStatus('pending');
          setMessage('Payment received. We are just finishing the premium unlock…');
          timeoutId = window.setTimeout(() => confirmUpgrade(attempt + 1), 2000);
          return;
        }

        setStatus('error');
        setMessage(data?.error || data?.message || 'Payment succeeded, but premium could not be confirmed automatically yet. Please open your dashboard and refresh once.');
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setMessage(error?.message || 'Payment succeeded, but premium could not be confirmed automatically yet.');
      }
    }

    confirmUpgrade();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [router, sessionId]);

  const title = status === 'success' ? '🎉 Premium unlocked!' : status === 'error' ? 'Payment complete' : '🎉 Almost there';

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      {status === 'success' ? <Confetti width={dimensions.width} height={dimensions.height} numberOfPieces={240} /> : null}

      <h1 className="text-4xl font-bold text-[#0D9488] mb-4">{title}</h1>
      <p className="text-lg text-gray-700 mb-6 max-w-xl">{message}</p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/cleaners/dashboard?upgrade=success"
          className="bg-[#0D9488] text-white px-6 py-3 rounded shadow hover:bg-teal-700"
        >
          Go to cleaner dashboard
        </Link>
        <Link
          href="/"
          className="bg-gray-200 text-[#0D9488] px-6 py-3 rounded shadow hover:bg-gray-300"
        >
          Go to home
        </Link>
      </div>
    </main>
  );
}
