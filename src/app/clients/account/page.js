'use client';

import { useEffect, useState } from 'react';
import { fetchClient } from '@/lib/fetchClient';
import AccountShell from '@/components/AccountShell';

export default function ClientAccountPage() {
  const [client, setClient] = useState(null);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadClient = async () => {
      const user = await fetchClient();
      if (!user || user.type !== 'client') window.location.href = '/login';
      else setClient(user);
    };
    loadClient();
  }, []);

  const handleDelete = async () => {
    if (!client?._id) return;
    if (deleteText !== 'DELETE') { setMessage('Type DELETE to confirm.'); return; }
    setDeleting(true); setMessage('');
    try {
      const res = await fetch(`/api/clients/${client._id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) { setMessage(data?.message || 'Failed to delete profile.'); return; }
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch (err) {
      setMessage(err?.message || 'Error deleting profile.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
<AccountShell title="Client account" description="Manage your profile details and account settings." backHref="/clients/dashboard" backLabel="Back to dashboard">
        {client ? (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Full name" value={client.fullName} />
              <Info label="Email" value={client.email} />
              <Info label="Phone" value={client.phone} />
              <Info label="Postcode" value={client.address?.postcode} />
              <Info label="Street" value={[client.address?.houseNameNumber, client.address?.street].filter(Boolean).join(' ')} />
              <Info label="County" value={client.address?.county} />
            </div>

            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
              <h2 className="text-lg font-semibold text-rose-800">Delete profile</h2>
              <p className="mt-2 text-sm text-rose-700">Type DELETE to permanently remove your client account.</p>
              <div className="mt-4 max-w-sm space-y-3">
                <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="Type DELETE" className="ftc-input" />
                <button onClick={handleDelete} disabled={deleting || deleteText !== 'DELETE'} className="inline-flex rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                  {deleting ? 'Deleting…' : 'Delete my profile'}
                </button>
                {message ? <p className="text-sm text-rose-700">{message}</p> : null}
              </div>
            </div>
          </div>
        ) : <p className="text-slate-600">Loading your account…</p>}
      </AccountShell>
    </>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-slate-900">{value || '—'}</p>
    </div>
  );
}
