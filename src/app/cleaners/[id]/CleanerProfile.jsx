'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

const PUBLIC_CLEANER_API = (id) => `/api/public-cleaners/${id}`;
const PUBLIC_PURCHASES_API = (id) => `/api/public/purchases/cleaners/${id}`;

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 7..19

function hourLabel(h){ return `${String(h).padStart(2,'0')}:00`; }

export default function CleanerProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [cleaner, setCleaner] = useState(null);
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState({ day: null, time: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          fetch(PUBLIC_CLEANER_API(id)).then(r=>r.json()),
          fetch(PUBLIC_PURCHASES_API(id)).then(r=>r.json()).catch(()=>({ purchases: [] })),
        ]);
        if (!active) return;
        setCleaner(cRes?.cleaner || cRes?.data || null);
        setPending((pRes?.purchases || []).map(p => `${p.day}|${p.hour}`));
      } catch (e) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const isBlocked = (day, h) => pending.includes(`${day}|${String(h)}`);

  const onBook = () => {
    if (!selected.day || selected.time == null) return alert('Please select a day and hour');
    // Store slot and a basic price; Stripe page will read these
    const price = 2.99; // contact unlock / booking hold
    localStorage.setItem('selectedSlot', JSON.stringify({ day: selected.day, time: selected.time }));
    localStorage.setItem('bookingPrice', String(price));
    // Go to Stripe payment flow
    router.push(`/payment/${id}`);
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error || !cleaner) return <div className="p-6 text-red-600">{error || 'Cleaner not found'}</div>;

  return (
    <main className="max-w-5xl mx-auto p-4">
      <header className="flex items-center gap-4 mb-6">
        <img src={cleaner?.image || '/default-avatar.png'} className="w-16 h-16 rounded-full object-cover" alt={cleaner?.realName}/>
        <div>
          <h1 className="text-2xl font-bold">{cleaner?.companyName || cleaner?.realName}</h1>
          <p className="opacity-80 text-sm">{cleaner?.address?.postcode || ''}</p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="font-semibold mb-3">Select a slot</h2>
        <div className="grid grid-cols-8 gap-2">
          <div></div>
          {DAYS.map(d => <div key={d} className="text-xs font-semibold text-center">{d.slice(0,3)}</div>)}
          {HOURS.map(h => (
            <React.Fragment key={h}>
              <div className="text-xs text-right pr-2">{hourLabel(h)}</div>
              {DAYS.map(d => {
                const blocked = isBlocked(d, h);
                const selectedCell = selected.day === d && selected.time === h;
                return (
                  <button
                    key={d}
                    disabled={blocked}
                    onClick={()=>setSelected({ day: d, time: h })}
                    className={`h-8 rounded ${blocked ? 'bg-gray-300 cursor-not-allowed' : selectedCell ? 'bg-teal-600 text-white' : 'bg-white hover:bg-teal-50'} border`}
                    aria-label={`${d} ${hourLabel(h)}`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onBook} className="px-5 py-2 rounded-xl bg-teal-600 text-white">Book</button>
        </div>
      </section>
    </main>
  );
}
