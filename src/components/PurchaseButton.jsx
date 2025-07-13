'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchaseButton({ 
  cleanerId, 
  onPurchaseSuccess, 
  onPurchaseStart, 
  onPurchaseError,
  disabled = false 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    console.log('🧠 cleanerId:', cleanerId);
  }, [cleanerId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPopup]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showPopup && !loading) {
        handleCancel();
      }
    };

    if (showPopup) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showPopup, loading]);

  const handlePurchase = async () => {
    console.log('🟢 Purchase triggered');

    if (!cleanerId) {
      const errorMsg = 'Please register or log in to unlock cleaner contact details.';
      setError(errorMsg);
      onPurchaseError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError('');
    
    // Notify parent component that purchase is starting
    onPurchaseStart?.();

    try {
      // Check authentication
      const authRes = await fetch('/api/auth/me', { credentials: 'include' });
      const authData = await authRes.json();
      console.log('🔍 AUTH DEBUG:', authData);

      if (!authData.success || authData.user.type !== 'client') {
        localStorage.setItem('redirectAfterLogin', `/cleaners/${cleanerId}`);
        router.push('/login/clients');
        return;
      }

      // Create checkout session
      const res = await fetch('/api/stripe/create-client-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cleanerId }),
      });

      const data = await res.json();
      console.log('🧾 Stripe response:', data);

      if (res.ok && data.url) {
        setSuccess(true);
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        const errorMsg = data.error || 'Checkout failed.';
        setError(errorMsg);
        onPurchaseError?.(errorMsg);
      }
    } catch (err) {
      console.error('❌ Stripe purchase error:', err);
      const errorMsg = 'Server error. Please try again.';
      setError(errorMsg);
      onPurchaseError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowPopup(false);
    setError('');
    setSuccess(false);
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      handleCancel();
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setError('');
          setShowPopup(true);
        }}
        disabled={disabled || loading}
        className={`px-6 py-3 rounded-full font-medium transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
          disabled || loading
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800'
        }`}
      >
        {loading ? 'Processing...' : 'Unlock Contact Details (£2.99)'}
      </button>

      {showPopup && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={handleBackdropClick}
          style={{ zIndex: 9999 }} // Inline style as fallback
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <div className="p-6">
              {/* Header with close button */}
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