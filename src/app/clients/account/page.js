'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { fetchClient } from '@/lib/fetchClient';

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
    <main className="min-h-screen bg-gray-50 text-[#0D9488]">
      <Head><title>Client Account | Find Trusted Cleaners</title></Head>
      <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] bg-opacity-90 text-white">
        <Link href="/"><img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" /></Link>
        <nav className="space-x-4 text-sm"><Link href="/cleaners">Find Cleaners</Link><Link href="/logout">Logout</Link></nav>
      </header>
      <section className="max-w-2xl mx-auto p-6 mt-6 bg-white shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4">Welcome{client?.fullName ? `, ${client.fullName}` : ''}</h1>
        {client ? <div className="space-y-2"><p><strong>Email:</strong> {client.email}</p><p><strong>Phone:</strong> {client.phone}</p><p><strong>Address:</strong> {client.address?.houseNameNumber} {client.address?.street}, {client.address?.county}</p><p><strong>Postcode:</strong> {client.address?.postcode}</p></div> : <p>Loading your account...</p>}
        <div className="mt-8 border-t pt-6"><h2 className="text-lg font-semibold text-red-600 mb-2">Delete profile</h2><p className="text-sm text-gray-600 mb-3">Type DELETE to permanently remove your client account.</p><input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="Type DELETE" className="w-full border rounded px-3 py-2 mb-3" /><button onClick={handleDelete} disabled={deleting || deleteText !== 'DELETE'} className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete my profile'}</button>{message ? <p className="text-sm text-red-600 mt-3">{message}</p> : null}</div>
      </section>
    </main>
  );
}
