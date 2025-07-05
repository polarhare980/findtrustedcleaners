'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchaseButton({ cleanerId, onPurchaseSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handlePurchase = async () => {
    if (!cleanerId) {
      setError('Missing cleaner ID. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ Check if user is logged in as a client
      const authRes = await fetch('/api/auth/me', { credentials: 'include' });
      const authData = await authRes.json();

      if (!authData.success || authData.user.type !== 'client') {
        // Save intended return path and redirect to login
        localStorage.setItem('redirectAfterLogin', `/cleaners/${cleanerId}`);
        router.push('/login/clients');
        return;
      }

      // ✅ Proceed with purchase
      const res = await fetch('/api/purchases', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onPurchaseSuccess(data.purchase);
        }, 2000);
      } else {
        setError(data.message || 'Purchase failed.');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
        className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
      >
        Unlock Cleaner Contact Info
      </button>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center">
            <h2 className="text-lg font-bold mb-4">Confirm Purchase</h2>
            <p className="mb-4">Unlock this cleaner's contact details and booking access?</p>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            {success ? (
              <p className="text-green-600 font-semibold mb-4">Cleaner Unlocked! Redirecting...</p>
            ) : (
              <div className="flex justify-center gap-4">
                <button
                  onClick={handlePurchase}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowPopup(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
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
