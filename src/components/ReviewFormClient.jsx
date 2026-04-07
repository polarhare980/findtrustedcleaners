'use client';

import { useEffect, useMemo, useState } from 'react';

const HIGHLIGHT_OPTIONS = ['On time', 'Friendly', 'Good communication', 'Quality of cleaning', 'Would book again'];

function StarButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-2xl transition-transform hover:scale-110 ${active ? 'text-amber-400' : 'text-slate-300'}`}
      aria-label={label}
    >
      ★
    </button>
  );
}

export default function ReviewFormClient({ cleanerId }) {
  const [eligible, setEligible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [purchaseId, setPurchaseId] = useState('');
  const [text, setText] = useState('');
  const [highlights, setHighlights] = useState(['Would book again']);
  const [wouldBookAgain, setWouldBookAgain] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/clients/purchases/eligible?cleanerId=${encodeURIComponent(cleanerId)}`, { credentials: 'include' });
        const j = await res.json().catch(() => ({}));
        if (!alive) return;
        const rows = Array.isArray(j?.data) ? j.data : [];
        setEligible(rows);
        setPurchaseId(rows[0]?._id || '');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [cleanerId]);

  const selectedBooking = useMemo(
    () => eligible.find((item) => String(item._id) === String(purchaseId)) || null,
    [eligible, purchaseId]
  );

  function toggleHighlight(option) {
    setHighlights((prev) => (prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/clients/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cleanerId, purchaseId, rating, text, highlights, wouldBookAgain }),
      });
      const j = await res.json().catch(() => ({}));
      setMsg(j.message || (j.success ? 'Thanks for your review!' : 'Unable to submit review.'));
      if (j.success) {
        setText('');
        window.location.reload();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-sm text-slate-600">Checking your eligible bookings…</div>;

  if (eligible.length === 0) {
    return (
      <div className="text-sm text-slate-600">
        You don’t have any accepted or completed bookings with this cleaner left to review.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Leave a verified review</h3>
          <p className="text-sm text-slate-600">Your review is linked to a real booking, which helps keep feedback trustworthy.</p>
        </div>
        <div className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-semibold">
          Verified booking review
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Which booking are you reviewing?</label>
        <select
          value={purchaseId}
          onChange={(e) => setPurchaseId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
        >
          {eligible.map((item) => (
            <option key={item._id} value={item._id}>{item.label || item.serviceName || item._id}</option>
          ))}
        </select>
        {selectedBooking ? (
          <div className="mt-2 text-xs text-slate-500">
            {selectedBooking.isoDate || selectedBooking.day || ''}{selectedBooking.hour ? ` • ${String(selectedBooking.hour).padStart(2, '0')}:00` : ''}
          </div>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Overall rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <StarButton
              key={value}
              active={value <= rating}
              onClick={() => setRating(value)}
              label={`Rate ${value} star${value > 1 ? 's' : ''}`}
            />
          ))}
          <span className="ml-2 text-sm font-medium text-slate-700">{rating}/5</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">What stood out?</label>
        <div className="flex flex-wrap gap-2">
          {HIGHLIGHT_OPTIONS.map((option) => {
            const active = highlights.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleHighlight(option)}
                className={`rounded-full border px-3 py-2 text-sm transition ${active ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={wouldBookAgain}
            onChange={(e) => setWouldBookAgain(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600"
          />
          <span>
            <span className="font-medium text-slate-900">I would book this cleaner again</span>
            <span className="block text-slate-500">This helps other customers quickly judge trust and reliability.</span>
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Optional comment</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={1200}
          placeholder="Share anything helpful for future customers and the cleaner."
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3"
        />
        <div className="mt-1 text-right text-xs text-slate-400">{text.length}/1200</div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          disabled={submitting || !purchaseId}
          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
        <div className="text-xs text-slate-500">Reviews are only accepted from real completed or accepted bookings.</div>
      </div>

      {msg && <div className="text-sm mt-1 text-slate-700">{msg}</div>}
    </form>
  );
}
