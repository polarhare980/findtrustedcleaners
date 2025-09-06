'use client'; import { useEffect, useState } from 'react';
export default function VerifyPage() {
  const [msg, setMsg] = useState('Verifying...');
  useEffect(()=>{ const t=new URLSearchParams(window.location.search).get('token'); if(!t) return setMsg('Missing token');
  fetch(`/api/auth/verify?token=${encodeURIComponent(t)}`).then(r=>r.json()).then(j=> setMsg(j.message || (j.success?'Verified!':'Invalid token'))).catch(e=>setMsg(e.message)); },[]);
  return (<main className="container py-8"><h2 className="text-lg font-semibold mb-2">Email verification</h2><div>{msg}</div></main>);
}
