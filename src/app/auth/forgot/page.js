'use client'; import { useState } from 'react';
export default function ForgotPage() {
  const [email, setEmail] = useState(''); const [msg, setMsg] = useState('');
  async function onSubmit(e){ e.preventDefault(); setMsg(''); const res = await fetch('/api/auth/forgot',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email }) }); const j = await res.json(); setMsg(j.message || 'Check your email'); }
  return (<main className="max-w-md mx-auto bg-white/70 p-6 rounded-2xl border"><h2 className="text-lg font-semibold mb-4">Reset your password</h2>
  <form onSubmit={onSubmit} className="space-y-3">
  <input className="w-full border rounded-xl p-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email"/>
  <button className="px-3 py-2 rounded-xl bg-slate-900 text-white">Send reset link</button>{msg && <div className="text-sm">{msg}</div>}</form></main>); }
