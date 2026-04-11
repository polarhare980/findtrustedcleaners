'use client';

import { useEffect, useState } from 'react';

const HIGHLIGHT_OPTIONS = ['On time', 'Friendly', 'Good communication', 'Quality of cleaning', 'Would book again'];

function StarButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-3xl transition-transform hover:scale-110 ${active ? 'text-amber-400' : 'text-slate-300'}`}
      aria-label={label}
    >
      ★
    </button>
  );
}

export default function ReviewTokenPageClient({ token }) {
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [highlights, setHighlights] = useState(['Would book again']);
  const [wouldBookAgain, setWouldBookAgain] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviews/${encodeURIComponent(token)}`);
        const j = await res.json().catch(() => ({}));
        if (!alive) return;
        setMeta(j);
        if (!j?.success) setMsg(j?.message || 'This review link is not valid.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  function toggleHighlight(option) {
    setHighlights((prev) => (prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rating, text, highlights, wouldBookAgain }),
      });
      const j = await res.json().catch(() => ({}));
      setMsg(j?.message || (j?.success ? 'Thanks for your review.' : 'Unable to submit review.'));
      if (j?.success) {
        setMeta((prev) => ({ ...(prev || {}), alreadyReviewed: true, eligibility: { ...(prev?.eligibility || {}), allowed: false, reason: 'already_reviewed', message: 'A review has already been submitted for this booking.' } }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="max-w-3xl mx-auto p-4 md:p-8"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Loading review link…</div></main>;

  const booking = meta?.booking || {};
  const eligibility = meta?.eligibility || {};
  const blocked = !meta?.success || meta?.alreadyReviewed || !eligibility.allowed;
  const whenText = booking?.isoDate || booking?.day || '';
  const hourText = booking?.hour ? `${String(booking.hour).padStart(2, '0')}:00` : '';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Verified booking review</div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Leave a review</h1>
              <p className="mt-2 text-slate-600">Only customers with a real booking link can leave feedback. That helps keep reviews trustworthy.</p>
            </div>
          </div>

          {booking?.cleanerName ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{booking.cleanerName}</div>
              <div className="mt-1 text-sm text-slate-600">{[booking.serviceName, whenText, hourText].filter(Boolean).join(' • ')}</div>
            </div>
          ) : null}

          {msg ? <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${meta?.success ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{msg}</div> : null}
          {!msg && blocked && eligibility?.message ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{eligibility.message}</div> : null}

          {!blocked ? (
            <form onSubmit={onSubmit} className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Overall rating</label>
                <div className="flex items-center gap-1">{[1,2,3,4,5].map((value) => <StarButton key={value} active={value <= rating} onClick={() => setRating(value)} label={`Rate ${value} star${value > 1 ? 's' : ''}`} />)}<span className="ml-2 text-sm font-medium text-slate-700">{rating}/5</span></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">What stood out?</label>
                <div className="flex flex-wrap gap-2">{HIGHLIGHT_OPTIONS.map((option) => {
                  const active = highlights.includes(option);
                  return <button key={option} type="button" onClick={() => toggleHighlight(option)} className={`rounded-full border px-3 py-2 text-sm transition ${active ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'}`}>{option}</button>;
                })}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={wouldBookAgain} onChange={(e) => setWouldBookAgain(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600" />
                  <span><span className="font-medium text-slate-900">I would book this cleaner again</span><span className="block text-slate-500">This helps future customers understand trust and reliability.</span></span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Optional comment</label>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={1200} placeholder="Share anything helpful for future customers and the cleaner." className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3" />
                <div className="mt-1 text-right text-xs text-slate-400">{text.length}/1200</div>
              </div>

              <button disabled={submitting} className="rounded-2xl bg-slate-900 px-5 py-3 text-white disabled:opacity-60">{submitting ? 'Submitting…' : 'Submit verified review'}</button>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
