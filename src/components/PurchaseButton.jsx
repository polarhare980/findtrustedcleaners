'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchaseButton({ cleanerId, onPurchaseSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    console.log('🧠 cleanerId:', cleanerId);
  }, [cleanerId]);

  const handlePurchase = async () => {
    console.log('🟢 Purchase triggered');

    if (!cleanerId) {
      setError('Please register or log in to unlock cleaner contact details.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const authRes = await fetch('/api/auth/me', { credentials: 'include' });
      const authData = await authRes.json();
      console.log('🔍 AUTH DEBUG:', authData);

      if (!authData.success || authData.user.type !== 'client') {
        localStorage.setItem('redirectAfterLogin', `/cleaners/${cleanerId}`);
        router.push('/login/clients');
        return;
      }

      const res = await fetch('/api/stripe/create-client-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId }), // Only cleanerId
      });

      const data = await res.json();
      console.log('🧾 Stripe response:', data);

      if (res.ok && data.url) {
        setSuccess(true);
        window.location.href = data.url;
      } else {
        setError(data.error || 'Checkout failed.');
      }
    } catch (err) {
      console.error('❌ Stripe purchase error:', err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setError('');
          setShowPopup(true);
        }}
        className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
      >
        Unlock Cleaner Contact Info
      </button>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center">
            <h2 className="text-lg font-bold mb-4">Confirm Purchase</h2>
            <p className="mb-4">
              Unlock this cleaner’s contact details and send your booking request.
            </p>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            {success ? (
              <p className="text-green-600 font-semibold mb-4">Redirecting...</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handlePurchase}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 w-full"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm (£2.99)'}
                </button>
                <button
                  onClick={() => {
                    setShowPopup(false);
                    setError('');
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 w-full"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
