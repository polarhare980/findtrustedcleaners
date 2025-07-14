'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    if (sessionId) {
      // Optional: you can verify the session ID by calling your backend
      setMessage('✅ Payment successful! Your cleaner profile has been unlocked.');
    } else {
      setMessage('❌ No session ID found. Something went wrong.');
    }
  }, [sessionId]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Payment Complete</h1>
        <p>{message}</p>
      </div>
    </main>
  );
}
