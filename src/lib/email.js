import { Resend } from 'resend';
export async function sendMail({ to, subject, html, listUnsubscribeUrl, headers = {} }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.log('[email:fallback]', { to, subject });
    console.log(html);
    return { id: 'console', delivered: false };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const res = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    headers: { ...(listUnsubscribeUrl ? { 'List-Unsubscribe': `<${listUnsubscribeUrl}>` } : {}), ...headers }
  });
  return res;
}
