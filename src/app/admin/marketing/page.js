import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
export const runtime = 'nodejs';
export default async function AdminMarketing() {
  const token = cookies().get('ftc_token')?.value; let u=null; try{u=jwt.verify(token||'',process.env.JWT_SECRET||'change_me');}catch{} if(!u || u.type!=='admin') redirect('/login?next=/admin/marketing');
  return (<div className="rounded-2xl p-4 border bg-white/70 space-y-3"><h3 className="font-medium">Send broadcast</h3><BroadcastForm/></div>);
}
function BroadcastForm() {
  async function send(e){ e.preventDefault(); const fd = new FormData(e.currentTarget); const payload = Object.fromEntries(fd.entries());
    const res = await fetch('/api/admin/marketing/broadcast', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) }); const json = await res.json(); alert(json.message || (json.success ? 'Sent!' : 'Failed')); }
  return (<form onSubmit={send} className="space-y-2">
    <label className="text-sm">Theme:</label>
    <select name="theme" className="w-full border rounded-xl p-2 mb-2"><option value="light">Light</option><option value="dark">Dark</option></select>
    <input name="subject" className="w-full border rounded-xl p-2" placeholder="Subject" required/>
    <textarea name="html" className="w-full border rounded-xl p-2" rows={6} placeholder="HTML message" required/>
    <div className="text-sm text-slate-600">Optional test recipient (defaults to all subscribers):</div>
    <input name="to" className="w-full border rounded-xl p-2" placeholder="test@example.com (optional)"/>
    <button className="px-3 py-2 rounded-xl bg-slate-900 text-white">Send</button>
  </form>);
}
