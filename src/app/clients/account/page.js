'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { fetchClient } from '@/lib/fetchClient';
import DashboardShell from '@/components/DashboardShell';
import DashboardHeader from '@/components/DashboardHeader';

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
      <Head><title>Client Account | Find Trusted Cleaners</title></Head>
      <DashboardShell ctaHref="/clients/dashboard" ctaLabel="Dashboard">
        <DashboardHeader
          title="Your account"
          description="Review your details, keep your contact information up to date, and manage your client account."
          primaryHref="/cleaners"
          primaryLabel="Find a cleaner"
          secondaryHref="/clients/dashboard"
          secondaryLabel="Back to dashboard"
        />

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="surface-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Account details</h2>
            {!client ? <p className="mt-4 text-slate-600">Loading your account…</p> : (
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="soft-panel p-4"><dt className="text-sm text-slate-500">Full name</dt><dd className="mt-1 font-medium text-slate-900">{client.fullName || 'Not set'}</dd></div>
                <div className="soft-panel p-4"><dt className="text-sm text-slate-500">Email</dt><dd className="mt-1 font-medium text-slate-900">{client.email || 'Not set'}</dd></div>
                <div className="soft-panel p-4"><dt className="text-sm text-slate-500">Phone</dt><dd className="mt-1 font-medium text-slate-900">{client.phone || 'Not set'}</dd></div>
                <div className="soft-panel p-4 sm:col-span-2"><dt className="text-sm text-slate-500">Address</dt><dd className="mt-1 font-medium text-slate-900">{[client.address?.houseNameNumber, client.address?.street, client.address?.county, client.address?.postcode].filter(Boolean).join(', ') || 'Not set'}</dd></div>
              </dl>
            )}
          </div>

          <aside className="surface-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Need something else?</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Use your dashboard to manage favourites, bookings, and recent cleaner activity.</p>
              <Link href="/clients/bookings" className="brand-button-secondary w-full">View bookings</Link>
              <Link href="/clients/my-favorites" className="brand-button-secondary w-full">View favourite cleaners</Link>
            </div>

            <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <h3 className="text-lg font-semibold text-rose-700">Delete profile</h3>
              <p className="mt-2 text-sm text-rose-700/90">Type DELETE to permanently remove your client account.</p>
              <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="Type DELETE" className="input mt-4" />
              <button onClick={handleDelete} disabled={deleting || deleteText !== 'DELETE'} className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-rose-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete my profile'}</button>
              {message ? <p className="mt-3 text-sm text-rose-700">{message}</p> : null}
            </div>
          </aside>
        </section>
      </DashboardShell>
    </>
  );
}
