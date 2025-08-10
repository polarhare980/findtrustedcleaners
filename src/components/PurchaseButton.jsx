'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { secureFetch } from '@/lib/secureFetch';

export default function PurchaseButton({
  cleanerId,
  selectedSlot, // { day: 'Monday', hour: '10' }
  onPurchaseSuccess,
  onPurchaseStart,
  onPurchaseError,
  disabled = false,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('purchaseIntent') === 'true') {
      localStorage.removeItem('purchaseIntent');
      setShowPopup(true);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = showPopup ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showPopup]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showPopup && !loading) handleCancel();
    };
    if (showPopup) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showPopup, loading]);

  const handlePurchase = async () => {
    const day = selectedSlot?.day;
    const hour = selectedSlot?.hour;

    if (!day || !hour) {
      const errorMsg = 'Please select a time slot before continuing.';
      setError(errorMsg);
      onPurchaseError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError('');
    onPurchaseStart?.();

    try {
      // 1) Auth check
      const authRes = await secureFetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authData.success || authData.user?.type !== 'client') {
        const errorMsg = 'You must be logged in as a client to purchase.';
        setError(errorMsg);
        onPurchaseError?.(errorMsg);

        const nextPath = `/cleaners/${cleanerId}`;
        localStorage.setItem('purchaseIntent', 'true');
        localStorage.setItem('redirectAfterLogin', nextPath);
        router.push(`/login/clients?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      // 2) Create the Purchase (server sets status:'pending' and marks slot ⏳)
      //    IMPORTANT: this calls /api/clients/purchases (Step 2 you added)
      const purchaseRes = await fetch('/api/clients/purchases', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cleanerId,
          day,
          hour,
          amount: 2.99, // adjust if you change price server-side
        }),
      });

      const purchaseData = await purchaseRes.json();
      if (!purchaseRes.ok || !purchaseData?.success) {
        const errorMsg = purchaseData?.message || 'Could not create purchase.';
        setError(errorMsg);
        onPurchaseError?.(errorMsg);
        setLoading(false);
        return;
      }

      const purchaseId = purchaseData.purchase?._id;
      if (!purchaseId) {
        const errorMsg = 'Purchase created but no ID returned.';
        setError(errorMsg);
        onPurchaseError?.(errorMsg);
        setLoading(false);
        return;
      }

      // 3) Start Stripe checkout, pass purchaseId so webhook/return knows which purchase to attach
      const res = await fetch('/api/stripe/create-client-checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId, day, hour, purchaseId }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setSuccess(true);
        onPurchaseSuccess?.(purchaseId);
        window.location.href = data.url;
      } else {
        const errorMsg = data.error || 'Checkout failed.';
        setError(errorMsg);
        onPurchaseError?.(errorMsg);
      }
    } catch (err) {
      console.error('❌ Purchase flow error:', err);
      const errorMsg = 'Server error. Please try again.';
      setError(errorMsg);
      onPurchaseError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowPopup(false);
    setError('');
    setSuccess(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) handleCancel();
  };

  const buttonLabel = loading
    ? 'Processing...'
    : !selectedSlot?.day || !selectedSlot?.hour
      ? 'Select a Time Slot'
      : 'Unlock Contact Details (£2.99)';

  return (
    <>
      <button
        onClick={() => { setError(''); setShowPopup(true); }}
        disabled={disabled || loading || !selectedSlot?.day || !selectedSlot?.hour}
        className={`px-6 py-3 rounded-full font-medium transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
          disabled || loading
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800'
        }`}
      >
        {buttonLabel}
      </button>

      {showPopup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={handleBackdropClick}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="text-center flex-1">
                  <div className="text-4xl mb-4">🔓</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Unlock Contact Details</h2>
                  <p className="text-gray-600">
                    Get instant access to this cleaner's contact information and booking details.
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">❌</span>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {success ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <p className="text-green-700 font-semibold">Redirecting to payment...</p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-500">💳</span>
                    <p className="text-blue-700 font-semibold">What you'll get:</p>
                  </div>
                  <ul className="text-blue-700 text-sm space-y-1 ml-6">
                    <li>• Phone number</li>
                    <li>• Email address</li>
                    <li>• Company information</li>
                    <li>• Ability to book time slots</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={loading || success}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : success ? (
                    'Redirecting...'
                  ) : (
                    'Pay £2.99'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
