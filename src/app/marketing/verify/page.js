'use client'; import { useEffect, useState } from 'react';
export default function MarketingVerify() {
  const [msg, setMsg] = useState('Verifying...');
  useEffect(()=>{ const token = new URLSearchParams(window.location.search).get('token'); if (!token) return setMsg('Missing token');
  fetch(`/api/marketing/verify?token=${encodeURIComponent(token)}`).then(r=>r.json()).then(j=>setMsg(j.message||'Verified')).catch(e=>setMsg(e.message)); },[]);
  return (<main className="container py-8"><h2 className="text-lg font-semibold mb-2">Newsletter</h2><div>{msg}</div></main>);
}
