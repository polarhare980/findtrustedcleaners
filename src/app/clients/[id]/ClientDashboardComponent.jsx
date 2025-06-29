// File: src/app/clients/[id]/ClientDashboardComponent.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ClientDashboardComponent() {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fetchClient = async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          const data = await res.json();

          if (!data.success || data.user.role !== 'client') {
            setError('Access denied. Please log in.');
            router.push('/login/clients');
          } else {
            setClient(data.user);
          }
        } catch (err) {
          console.error('Error fetching client:', err);
          setError('Failed to fetch client data.');
          router.push('/login/clients');
        } finally {
          setLoading(false);
        }
      };

      fetchClient();
      setMounted(true);
    }
  }, [router]);

  if (!mounted) return null;

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <main className="p-6 text-red-600 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-teal-700 mb-4">Client Dashboard</h1>

      {success && (
        <div className="p-4 mb-4 text-green-700 bg-green-50 border border-green-200 rounded text-center">
          {success}
        </div>
      )}

      {client && (
        <>
          <p className="mb-2">Welcome, {client.fullName}!</p>
          <p className="mb-2">Email: {client.email}</p>
          <p className="mb-2">Phone: {client.phone}</p>
          <p className="mb-2">Postcode: {client.postcode}</p>
          <p className="mb-2">Address: {client.address}</p>
        </>
      )}
    </main>
  );
}
