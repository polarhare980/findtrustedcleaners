'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const HIGHLIGHT_OPTIONS = [
  'On time',
  'Friendly',
  'Good communication',
  'Quality of cleaning',
  'Would book again'
];

function StarButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-3xl transition-transform hover:scale-110 ${
        active ? 'text-amber-400' : 'text-slate-300'
      }`}
      aria-label={label}
    >
      ★
    </button>
  );
}

export default function ReviewTokenPageClient({ token: initialToken }) {
  const searchParams = useSearchParams();
  const queryToken = searchParams.get('review');

  const token = initialToken || queryToken || '';

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

    if (!token) {
      setMsg('Missing review token.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviews/${encodeURIComponent(token)}`);
        const j = await res.json().catch(() => ({}));

        if (!alive) return;

        setMeta(j);

        if (!j?.success) {
          setMsg(j?.message || 'This review link is not valid.');
        }

      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };

  }, [token]);

  function toggleHighlight(option) {
    setHighlights((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  }

  async function onSubmit(e) {
    e.preventDefault();

    setSubmitting(true);
    setMsg('');

    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          rating,
          text,
          highlights,
          wouldBookAgain
        })
      });

      const j = await res.json().catch(() => ({}));

      setMsg(
        j?.message ||
        (j?.success
          ? 'Thanks for your review.'
          : 'Unable to submit review.')
      );

    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        Loading review...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">

          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Verified booking review
          </div>

          <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
            Leave a review
          </h1>

          <p className="mt-2 text-slate-600">
            Only customers with a real booking link can leave feedback.
            That helps keep reviews trustworthy.
          </p>

          {msg && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {msg}
            </div>
          )}

          {!msg && (
            <form onSubmit={onSubmit} className="mt-6 space-y-6">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Overall rating
                </label>

                <div className="flex gap-1">
                  {[1,2,3,4,5].map((value) => (
                    <StarButton
                      key={value}
                      active={value <= rating}
                      onClick={() => setRating(value)}
                      label={`Rate ${value}`}
                    />
                  ))}
                </div>

              </div>

              <button
                disabled={submitting}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-white"
              >
                Submit verified review
              </button>

            </form>
          )}

        </div>

      </div>
    </main>
  );
}