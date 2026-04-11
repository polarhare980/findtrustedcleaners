'use client';

import { useState } from 'react';

export default function AdminBroadcastForm() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const fd = new FormData(e.currentTarget);
      const payload = Object.fromEntries(fd.entries());

      const res = await fetch('/api/admin/marketing/broadcast', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      setMessage(json.message || (json.success ? 'Broadcast sent.' : 'Broadcast failed.'));

      if (res.ok && json.success) {
        e.currentTarget.reset();
      }
    } catch (error) {
      setMessage(error?.message || 'Broadcast failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Theme</label>
        <select name="theme" className="w-full rounded-xl border p-2">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Subject</label>
        <input name="subject" className="w-full rounded-xl border p-2" placeholder="Subject" required />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">HTML message</label>
        <textarea name="html" className="w-full rounded-xl border p-2" rows={8} placeholder="HTML message" required />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Test recipient (optional)</label>
        <input name="to" className="w-full rounded-xl border p-2" placeholder="test@example.com" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Send broadcast'}
      </button>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </form>
  );
}
