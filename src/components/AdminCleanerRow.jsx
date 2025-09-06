'use client'; import { useState } from 'react';
export default function AdminCleanerRow({ row }) {
  const [slug, setSlug] = useState(row.slug || ''); const [visible, setVisible] = useState(row.isVisible !== false); const [msg, setMsg] = useState('');
  async function save(){ setMsg(''); const res = await fetch(`/api/admin/cleaners/${row._id}`, { method:'PATCH', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ slug, isVisible: visible }) }); const json = await res.json(); setMsg(json.message || (json.success ? 'Saved' : 'Failed')); }
  return (<div className="flex items-center justify-between border rounded-xl p-3 bg-white text-sm">
    <div><div className="font-medium">{row.companyName || row.realName}</div><div className="text-xs text-slate-600">ID: {String(row._id)}</div>
    <div className="flex items-center gap-2 mt-1">
      <label className="text-xs">Slug:</label><input className="border rounded px-2 py-1" value={slug} onChange={e=>setSlug(e.target.value)}/>
      <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/>Visible</label>
      <button className="px-2 py-1 rounded bg-slate-900 text-white" onClick={save}>Save</button></div>
      {msg && <div className="text-xs mt-1">{msg}</div>}
    </div><a className="underline" href={`/cleaners/${row.slug || row._id}`}>View</a></div>);
}
