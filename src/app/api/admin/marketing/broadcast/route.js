import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Subscriber from '@/models/Subscriber';
import { sendMail } from '@/lib/email';
import { renderEmail } from '@/lib/emailRender';
import { rateLimit } from '@/lib/rateLimit';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function POST(req) {
  const { valid, response } = await protectApiRoute(req, ['admin']); if (!valid) return response;
  const rl = await rateLimit(req, { limit: 20, windowMs: 60000, key: 'admin:broadcast' });
  if (!rl.allowed) return new Response(JSON.stringify({ success:false, message:'Rate limited' }), { status: 429, headers: { 'content-type':'application/json', 'Retry-After': String(Math.ceil((rl.resetMs||60000)/1000)) } });
  const { subject, html, to, theme } = await req.json();
  if (!subject || !html) return json({ success:false, message:'Missing subject or html' }, 400);
  await dbConnect();
  let recipients = []; let subsDocs = [];
  if (to) { recipients = [to]; }
  else { subsDocs = await Subscriber.find({ verified: true, unsubscribed: { $ne: true } }, 'email unsubToken').lean(); recipients = subsDocs.map(s => s.email); }
  if (recipients.length === 0) return json({ success:false, message:'No recipients' }, 400);
  let sent = 0;
  if (to) { await sendMail({ to, subject, html: renderEmail('broadcast', { subject, content_html: html, unsubscribe_url: '', theme }) }); sent = 1; }
  else {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    for (const s of subsDocs) {
      const unsubUrl = `${base}/marketing/u?token=${s.unsubToken}`;
      await sendMail({ to: s.email, subject, html: renderEmail('broadcast', { subject, content_html: html, unsubscribe_url: unsubUrl, theme }), listUnsubscribeUrl: unsubUrl });
      sent++;
    }
  }
  return json({ success:true, message:`Sent to ${sent} recipient(s)` });
}
