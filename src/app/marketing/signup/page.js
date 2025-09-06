'use client'; import { useState } from 'react';
export default function MarketingSignup() {
  const [email, setEmail] = useState(''); const [msg, setMsg] = useState('');
  async function onSubmit(e){ e.preventDefault(); setMsg(''); const res = await fetch('/api/marketing/subscribe',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email }) }); const j=await res.json(); setMsg(j.message || (j.success?'Please check your email.':'Unable to subscribe.')); }
  return (<main className="max-w-md mx-auto bg-white/70 p-6 rounded-2xl border"><h2 className="text-lg font-semibold mb-3">Subscribe for tips & offers</h2>
  <form onSubmit={onSubmit} className="space-y-2"><input type="email" className="w-full border rounded-xl p-2" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
  <button className="px-3 py-2 rounded-xl bg-slate-900 text-white">Subscribe</button>{msg && <div className="text-sm">{msg}</div>}</form></main>);
}
