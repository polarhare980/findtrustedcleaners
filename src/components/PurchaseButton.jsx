// File: src/components/PurchaseButton.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { secureFetch as _secureFetch } from '@/lib/secureFetch';

export default function PurchaseButton({
  cleanerId,
  selectedSlot,
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
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [viewerType, setViewerType] = useState('guest');
  const clickedRef = useRef(false);

  const secureFetch = async (url, init) => {
    try {
      if (typeof _secureFetch === 'function') return await _secureFetch(url, init);
    } catch (_) {}
    return fetch(url, { credentials: 'include', ...(init || {}) });
  };

  useEffect(() => {
    if (!showPopup) return;
    let alive = true;
    (async () => {
      try {
        const authRes = await secureFetch('/api/auth/me');
        const authData = await authRes.json().catch(() => ({}));
        if (!alive) return;
        if (authRes.ok && authData?.success && authData?.user) {
          setViewerType(authData.user.type || 'guest');
          setCustomerName((prev) => prev || authData.user.fullName || authData.user.name || '');
          setCustomerEmail((prev) => prev || authData.user.email || '');
          setCustomerPhone((prev) => prev || authData.user.phone || '');
        } else {
          setViewerType('guest');
        }
      } catch (_) {
        if (alive) setViewerType('guest');
      }
    })();
    return () => { alive = false; };
  }, [showPopup]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = showPopup ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = prev || 'unset'; };
  }, [showPopup]);

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

  const validateContact = () => {
    if (!String(customerName || '').trim()) return 'Please enter your name.';
    if (!String(customerEmail || '').trim() && !String(customerPhone || '').trim()) {
      return 'Please enter an email address or phone number.';
    }
    return '';
  };

  const handlePurchase = async () => {
    if (clickedRef.current) return;
    const slot = validateSlot();
    if (!slot) return;

    const contactError = validateContact();
    if (contactError) {
      setError(contactError);
      onPurchaseError?.(contactError);
      return;
    }

    const { day, hourNum } = slot;
    const serviceKey = selectedSlot?.serviceKey || undefined;
    const durationMins = selectedSlot?.durationMins || undefined;
    const bufferBeforeMins = selectedSlot?.bufferBeforeMins || undefined;
    const bufferAfterMins = selectedSlot?.bufferAfterMins || undefined;
    const isoDate = selectedSlot?.date || undefined;

    setLoading(true);
    setError('');
    clickedRef.current = true;
    onPurchaseStart?.();

    try {
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
          durationMins,
          bufferBeforeMins,
          bufferAfterMins,
          isoDate,
          customerName,
          customerEmail,
          customerPhone,
          notes,
        }),
      });

      const purchaseData = await purchaseRes.json().catch(() => ({}));
      if (!purchaseRes.ok || !purchaseData?.success) {
        const msg = purchaseData?.message || 'Could not send booking request.';
        setError(msg);
        onPurchaseError?.(msg);
        return;
      }

      const purchaseId = purchaseData.purchaseId || purchaseData.id || purchaseData._id;
      if (!purchaseId) {
        const msg = 'Booking request created but no ID returned.';
        setError(msg);
        onPurchaseError?.(msg);
        return;
      }

      setSuccess(true);
      onPurchaseSuccess?.(purchaseId);
    } catch (err) {
      console.error('❌ Purchase flow error:', err);
      const msg = 'Server error. Please try again.';
      setError(msg);
      onPurchaseError?.(msg);
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

  const slotReady = !!selectedSlot?.day && Number.isInteger(Number(selectedSlot?.hour));
  const buttonLabel = loading ? 'Sending request...' : !slotReady ? 'Select a Time Slot' : 'Request Booking';

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
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-4"
          onClick={(e) => e.target === e.currentTarget && !loading && handleCancel()}
        >
          <div className="flex min-h-full items-start justify-center py-4 sm:items-center sm:py-6">
            <div
              className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl overscroll-contain sm:max-h-[calc(100dvh-3rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 space-y-4 sm:p-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Send booking request</h2>
                  <p className="text-gray-600 mt-1">The cleaner will receive your details and can confirm the job directly.</p>
                </div>
                <button onClick={handleCancel} disabled={loading} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              {success ? (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-800">
                  Booking request sent. The cleaner can now see your details and your requested slot.
                </div>
              ) : (
                <>
                  {selectedSlot?.day ? (
                    <div className="rounded-xl bg-slate-50 border p-3 text-sm text-slate-700">
                      <div><strong>Slot:</strong> {selectedSlot.day} at {String(selectedSlot.hour).padStart(2, '0')}:00</div>
                      {selectedSlot?.date ? <div><strong>Date:</strong> {selectedSlot.date}</div> : null}
                      {selectedSlot?.serviceName ? <div><strong>Service:</strong> {selectedSlot.serviceName}</div> : null}
                      {selectedSlot?.durationMins ? <div><strong>Estimated duration:</strong> {selectedSlot.durationMins} mins</div> : null}
                    </div>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                      <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes for the cleaner</label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border rounded-xl px-3 py-2" placeholder="Parking, access, pets, preferred clean type..." />
                    </div>
                  </div>

                  {viewerType === 'client' ? (
                    <div className="text-xs text-slate-500">You are logged in as a client. We will also link this request to your account.</div>
                  ) : (
                    <div className="text-xs text-slate-500">No account is required. Your details will be passed to the cleaner with this request.</div>
                  )}

                  {error ? <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-700">{error}</div> : null}

                  <div className="flex gap-3 justify-end pt-2">
                    <button onClick={handleCancel} disabled={loading} className="px-4 py-2 rounded-xl border bg-white">Cancel</button>
                    <button onClick={handlePurchase} disabled={loading} className="px-5 py-2 rounded-xl bg-teal-600 text-white disabled:opacity-50">
                      {loading ? 'Sending...' : 'Send request'}
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
