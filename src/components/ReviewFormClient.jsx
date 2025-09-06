'use client'; import { useEffect, useState } from 'react';
export default function ReviewFormClient({ cleanerId }) {
  const [eligible, setEligible] = useState([]); const [loading, setLoading] = useState(true); const [msg, setMsg] = useState('');
  useEffect(()=>{ let done=false; async function load(){ try{ const r=await fetch(`/api/clients/purchases/eligible?cleanerId=${encodeURIComponent(cleanerId)}`,{credentials:'include'}); const j=await r.json(); if(!done) setEligible(j?.data||[]);}catch(e){ if(!done) setMsg(e.message);} finally { if(!done) setLoading(false);} } load(); return ()=>{done=true}; },[cleanerId]);
  async function onSubmit(e){ e.preventDefault(); setMsg(''); const form=e.currentTarget; const rating=Number(form.rating.value); const text=form.text.value; const purchaseId=form.purchaseId.value; const res=await fetch('/api/clients/reviews',{ method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ cleanerId, purchaseId, rating, text }) }); const j=await res.json(); setMsg(j.message || (j.success?'Thanks for your review!':'Unable to submit review.')); if (j.success) window.location.reload(); }
  if (loading) return <div className="text-sm">Loading eligibility…</div>;
  if (eligible.length===0) return <div className="text-sm text-slate-600">You don’t have any accepted/booked bookings with this cleaner, or you’ve already reviewed them.</div>;
  return (<form className="space-y-2" onSubmit={onSubmit}>
    <div className="text-sm">Select booking</div>
    <select name="purchaseId" className="border rounded-xl p-2 w-full">
      {eligible.map(e => (<option key={String(e._id)} value={String(e._id)}>{e.day} at {e.hour}:00 · {e.spanHours}h (#{String(e._id)})</option>))}
    </select>
    <div className="text-sm">Rating (1–5)</div><input name="rating" type="number" min="1" max="5" defaultValue="5" className="border rounded-xl p-2 w-20" required/>
    <div className="text-sm">Review (optional)</div><textarea name="text" className="border rounded-xl p-2 w-full" rows={3} placeholder="How was your experience?"/>
    <div><button className="px-3 py-2 rounded-xl bg-slate-900 text-white">Submit review</button></div>{msg && <div className="text-sm mt-1">{msg}</div>}
  </form>);
}
