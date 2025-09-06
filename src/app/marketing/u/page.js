'use client'; import { useEffect, useState } from 'react';
export default function OneClickUnsub() {
  const [msg, setMsg] = useState('Processing…');
  useEffect(()=>{ const token = new URLSearchParams(window.location.search).get('token'); if(!token){ setMsg('Missing token'); return; }
  fetch('/api/marketing/unsubscribe', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ token })}).then(r=>r.json()).then(j=> setMsg(j.message || 'Unsubscribed')).catch(e=> setMsg(e.message)); },[]);
  return (<main className="container py-8"><h2 className="text-lg font-semibold mb-2">Unsubscribe</h2><div>{msg}</div><p className="text-sm text-slate-600 mt-2"><a className="underline" href="/marketing/signup">Subscribe again</a> at any time.</p></main>);
}
