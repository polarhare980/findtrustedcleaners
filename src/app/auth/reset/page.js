'use client'; import { useState } from 'react';
export default function ResetPage() {
  const [password, setPassword] = useState(''); const [msg, setMsg] = useState('');
  const token = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : '';
  async function onSubmit(e){ e.preventDefault(); setMsg(''); const res = await fetch('/api/auth/reset',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ token, password }) }); const j = await res.json(); setMsg(j.message || (j.success?'Password updated':'Reset failed')); }
  return (<main className="max-w-md mx-auto bg-white/70 p-6 rounded-2xl border"><h2 className="text-lg font-semibold mb-4">Set a new password</h2>
  <form onSubmit={onSubmit} className="space-y-3">
  <input className="w-full border rounded-xl p-2" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" type="password"/>
  <button className="px-3 py-2 rounded-xl bg-slate-900 text-white">Update password</button>{msg && <div className="text-sm">{msg}</div>}</form></main>); }
