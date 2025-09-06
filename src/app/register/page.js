'use client'; import { useState } from 'react';
export default function RegisterPage() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [type, setType] = useState('client'); const [msg, setMsg] = useState('');
  async function onSubmit(e){ e.preventDefault(); setMsg(''); const res = await fetch('/api/auth/register',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name, email, password, type }), credentials:'include' }); const j = await res.json(); setMsg(j.message || (j.success?'Registered!':'Failed')); }
  return (<main className="max-w-md mx-auto bg-white/70 p-6 rounded-2xl border"><h2 className="text-lg font-semibold mb-4">Create an account</h2>
  <form onSubmit={onSubmit} className="space-y-3">
  <input className="w-full border rounded-xl p-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Name or Company"/>
  <input className="w-full border rounded-xl p-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email"/>
  <input className="w-full border rounded-xl p-2" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password"/>
  <div className="text-sm">Account type:</div><div className="flex gap-4">
  <label className="inline-flex items-center gap-2"><input type="radio" name="type" value="client" checked={type==='client'} onChange={e=>setType(e.target.value)}/>Client</label>
  <label className="inline-flex items-center gap-2"><input type="radio" name="type" value="cleaner" checked={type==='cleaner'} onChange={e=>setType(e.target.value)}/>Cleaner</label>
  </div><button className="px-3 py-2 rounded-xl bg-slate-900 text-white">Register</button>{msg && <div className="text-sm">{msg}</div>}</form></main>); }
