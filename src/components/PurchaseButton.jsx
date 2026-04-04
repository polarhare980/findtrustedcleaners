// File: src/components/PurchaseButton.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { secureFetch as _secureFetch } from '@/lib/secureFetch';

export default function PurchaseButton({
  cleanerId,
  selectedSlot, // { day: 'Monday', hour: '10' | 10, serviceKey?, date?: 'YYYY-MM-DD' }
  onPurchaseSuccess,
  onPurchaseStart,
  onPurchaseError,
  disabled = false,
  priceGBP = 0,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const clickedRef = useRef(false);

  // Helper: safe secureFetch (fallback to fetch)
  const secureFetch = async (url, init) => {
    try {
      if (typeof _secureFetch === 'function') {
        return await _secureFetch(url, init);
      }
    } catch (_) {
      // fall through to plain fetch
    }
    return fetch(url, { credentials: 'include', ...(init || {}) });
  };

  // Re-open modal after login if user was redirected + restore slot
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hadIntent = localStorage.getItem('purchaseIntent') === 'true';
    if (hadIntent) {
      localStorage.removeItem('purchaseIntent');
      setShowPopup(true);
    }

    // if we stored a previous slot, only restore if no slot currently provided
    if (!selectedSlot?.day && localStorage.getItem('pendingSelectedSlot')) {
      // noop here; the parent page should control selectedSlot
      // we keep this in case you later wire it to read from storage
    }
  }, [selectedSlot?.day]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = showPopup ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = prev || 'unset'; };
  }, [showPopup]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showPopup && !loading) handleCancel();
    };
    if (showPopup) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showPopup, loading]);

  const validateSlot = () => {
    const day = selectedSlot?.day;
    const hourNum = Number(selectedSlot?.hour);
    if (!day || !Number.isInteger(hourNum)) {
      const errorMsg = 'Please select a time slot before continuing.';
      setError(errorMsg);
      onPurchaseError?.(errorMsg);
      return null;
    }
    return { day, hourNum };
  };

  const persistIntent = () => {
    if (typeof window === 'undefined') return;
    const nextPath = `/cleaners/${cleanerId}`;
    localStorage.setItem('purchaseIntent', 'true');
    localStorage.setItem('redirectAfterLogin', nextPath);
    // store selected slot so the UI can restore it after login if needed
    try {
      localStorage.setItem(
        'pendingSelectedSlot',
        JSON.stringify({
          day: selectedSlot?.day ?? null,
          hour: selectedSlot?.hour ?? null,
          date: selectedSlot?.date ?? null,
          serviceKey: selectedSlot?.serviceKey ?? null,
        })
      );
    } catch (_) {}
    router.push(`/login/clients?next=${encodeURIComponent(nextPath)}`);
  };

  const handlePurchase = async () => {
    if (clickedRef.current) return; // guard against double-clicks
    const slot = validateSlot();
    if (!slot) return;

    const { day, hourNum } = slot;
    const serviceKey = selectedSlot?.serviceKey || undefined;
    const isoDate = selectedSlot?.date || undefined;

    setLoading(true);
    setError('');
    clickedRef.current = true;
    onPurchaseStart?.();

    try {
      // 1) Auth check (must be a client)
      const authRes = await secureFetch('/api/auth/me');
      const authData = await authRes.json().catch(() => ({}));

      if (!authRes.ok || !authData?.success || authData?.user?.type !== 'client') {
        const errorMsg = 'You must be logged in as a client to book through the platform.';
        setError(errorMsg);
        onPurchaseError?.(errorMsg);
        persistIntent();
        return;
      }

      // 2) Create the booking request (server validates availability and computes span)
      const purchaseRes = await fetch('/api/clients/purchases', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cleanerId,
          day,
          hour: hourNum,
          amount: priceGBP,
          serviceKey,
          isoDate,
        }),
      });

      if (purchaseRes.status === 401 || purchaseRes.status === 403) {
        const msg = 'Please log in as a client to continue.';
        setError(msg);
        onPurchaseError?.(msg);
        persistIntent();
        return;
      }

      const purchaseData = await purchaseRes.json().catch(() => ({}));

      if (!purchaseRes.ok || !purchaseData?.success) {
        if (purchaseRes.status === 409) {
          const msg = purchaseData?.message || 'That time has just been taken. Please pick another slot.';
          setError(msg);
          onPurchaseError?.(msg);
          return;
        }
        const errorMsg = purchaseData?.message || 'Could not send booking request.';
        setError(errorMsg);
        onPurchaseError?.(errorMsg);
        return;
      }

      const purchaseId = purchaseData.purchaseId || purchaseData.id || purchaseData._id;
      if (!purchaseId) {
        const errorMsg = 'Booking request created but no ID returned.';
        setError(errorMsg);
        onPurchaseError?.(errorMsg);
        return;
      }

      setSuccess(true);
      onPurchaseSuccess?.(purchaseId);
      try {
        localStorage.removeItem('pendingSelectedSlot');
      } catch (_) {}
      return;
    } catch (err) {
      console.error('❌ Purchase flow error:', err);
      const errorMsg = 'Server error. Please try again.';
      setError(errorMsg);
      onPurchaseError?.(errorMsg);
    } finally {
      setLoading(false);
      clickedRef.current = false;
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

  const slotReady = !!selectedSlot?.day && Number.isInteger(Number(selectedSlot?.hour));
  const buttonLabel = loading
    ? 'Sending request...'
    : !slotReady
      ? 'Select a Time Slot'
      : 'Request Booking';

  return (
    <>
      <button
        onClick={() => { setError(''); setShowPopup(true); }}
        disabled={disabled || loading || !slotReady}
        className={`px-6 py-3 rounded-full font-medium transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
          disabled || loading || !slotReady
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
                  <div className="text-4xl mb-4">📅</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Send booking request</h2>
                  <p className="text-gray-600">
                    We&apos;ll send your chosen slot to the cleaner for approval. There is no client fee.
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
                    <p className="text-green-700 font-semibold">Booking request sent successfully.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-500">✅</span>
                      <p className="text-blue-700 font-semibold">What happens next:</p>
                    </div>
                    <ul className="text-blue-700 text-sm space-y-1 ml-6">
                      <li>• Your request is sent instantly</li>
                      <li>• The cleaner can accept or decline it</li>
                      <li>• You can still contact the cleaner directly from their profile</li>
                      <li>• Booking through the platform requires a client account</li>
                    </ul>
                  </div>

                  {/* Mini slot summary (defensive) */}
                  {slotReady && (
                    <div className="text-sm text-slate-600 mb-4">
                      Selected: <span className="font-semibold">{selectedSlot.day}</span>{' '}
                      <span className="font-mono">
                        {String(selectedSlot.hour).padStart(2, '0')}:00
                      </span>
                      {selectedSlot?.date ? <> — {selectedSlot.date}</> : null}
                    </div>
                  )}
                </>
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
                      Sending...
                    </div>
                  ) : success ? (
                    'Request sent'
                  ) : (
                    'Send request'
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
