'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { secureFetch as _secureFetch } from '@/lib/secureFetch';

export default function BookingRequestPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cleaner, setCleaner] = useState(null);
  const [loadingCleaner, setLoadingCleaner] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewerType, setViewerType] = useState('guest');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const secureFetch = async (url, init) => {
    try {
      if (typeof _secureFetch === 'function') return await _secureFetch(url, init);
    } catch (_) {}
    return fetch(url, { credentials: 'include', ...(init || {}) });
  };

  const slot = useMemo(() => {
    const day = searchParams.get('day') || '';
    const hour = Number(searchParams.get('hour'));
    const date = searchParams.get('date') || '';
    const serviceKey = searchParams.get('serviceKey') || '';
    const serviceName = searchParams.get('serviceName') || '';
    const durationMins = Number(searchParams.get('durationMins') || 0);
    const bufferBeforeMins = Number(searchParams.get('bufferBeforeMins') || 0);
    const bufferAfterMins = Number(searchParams.get('bufferAfterMins') || 0);

    return {
      day,
      hour,
      date,
      serviceKey,
      serviceName,
      durationMins,
      bufferBeforeMins,
      bufferAfterMins,
      isValid: !!day && Number.isInteger(hour),
    };
  }, [searchParams]);

  useEffect(() => {
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

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`/api/public-cleaners/${id}`, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        setCleaner(data?.cleaner || data?.data || null);
      } catch (_) {
        if (alive) setCleaner(null);
      } finally {
        if (alive) setLoadingCleaner(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const validateContact = () => {
    if (!String(customerName || '').trim()) return 'Please enter your name.';
    if (!String(customerEmail || '').trim() && !String(customerPhone || '').trim()) {
      return 'Please enter an email address or phone number.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!slot.isValid) {
      setError('Your chosen slot is missing. Please go back and select a time again.');
      return;
    }

    const contactError = validateContact();
    if (contactError) {
      setError(contactError);
      return;
    }

    setSubmitting(true);

    try {
      const purchaseRes = await fetch('/api/clients/purchases', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cleanerId: id,
          day: slot.day,
          hour: slot.hour,
          amount: 0,
          serviceKey: slot.serviceKey || undefined,
          durationMins: slot.durationMins || undefined,
          bufferBeforeMins: slot.bufferBeforeMins || 0,
          bufferAfterMins: slot.bufferAfterMins || 0,
          isoDate: slot.date || undefined,
          customerName,
          customerEmail,
          customerPhone,
          notes,
        }),
      });

      const purchaseData = await purchaseRes.json().catch(() => ({}));
      if (!purchaseRes.ok || !purchaseData?.success) {
        setError(purchaseData?.message || 'Could not send booking request.');
        return;
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Booking request error:', err);
      setError('Server error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cleanerName = cleaner?.companyName || cleaner?.realName || 'Cleaner';

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={`/cleaners/${id}`}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
          >
            ← Back to cleaner profile
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Booking request</div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Send your details to {cleanerName}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You are now on a normal booking page, not a popup, so the form will scroll properly on mobile.
              </p>
            </div>

            {success ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
                <div className="text-lg font-semibold">Booking request sent</div>
                <p className="mt-2 text-sm leading-6">
                  The cleaner has received your requested slot and contact details. They can now review and respond.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/cleaners/${id}`}
                    className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    Return to profile
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Your name</label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes for the cleaner</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={5}
                      placeholder="Parking, access, pets, preferred clean type..."
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                {viewerType === 'client' ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    You are logged in as a client. This request will also be linked to your account.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    No account is required. Your details will be passed to the cleaner with this request.
                  </div>
                )}

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
                ) : null}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !slot.isValid}
                    className="rounded-full bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-teal-700 hover:to-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send request'}
                  </button>
                  <Link
                    href={`/cleaners/${id}`}
                    className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            )}
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Selected booking</div>

            {loadingCleaner ? (
              <div className="mt-4 text-sm text-slate-500">Loading cleaner details...</div>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-4">
                  <img
                    src={(typeof cleaner?.image === 'string' && cleaner.image) || '/default-avatar.png'}
                    alt={cleanerName}
                    className="h-16 w-16 rounded-2xl object-cover border border-slate-200"
                  />
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{cleanerName}</div>
                    <div className="text-sm text-slate-500">{cleaner?.address?.postcode || cleaner?.postcode || ''}</div>
                  </div>
                </div>

                <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div><strong>Day:</strong> {slot.day || 'Not selected'}</div>
                  <div><strong>Time:</strong> {slot.isValid ? `${String(slot.hour).padStart(2, '0')}:00` : 'Not selected'}</div>
                  {slot.date ? <div><strong>Date:</strong> {slot.date}</div> : null}
                  {slot.serviceName ? <div><strong>Service:</strong> {slot.serviceName}</div> : null}
                  {slot.durationMins ? <div><strong>Estimated duration:</strong> {slot.durationMins} mins</div> : null}
                </div>

                {!slot.isValid ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    No valid slot was passed into this page. Go back to the cleaner profile and choose an available time first.
                  </div>
                ) : null}
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
