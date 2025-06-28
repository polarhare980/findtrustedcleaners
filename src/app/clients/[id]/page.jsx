'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientDashboard() {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // ✅ Add error state
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fetchClient = async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          const data = await res.json();

          if (!data.success || data.user.role !== 'client') {
            setError('Access denied. Please log in.');
            router.push('/login');
          } else {
            setClient(data.user);
          }
        } catch (err) {
          console.error('Error fetching client:', err);
          setError('Failed to fetch client data.');
          router.push('/login');
        } finally {
          setLoading(false);
        }
      };

      fetchClient();
      setMounted(true);
    }
  }, [router]);

  if (!mounted) return null;
  if (loading) return <p className="p-6">Loading...</p>;

  if (error) {
    return (
      <main className="p-6 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-[#0D9488] mb-4">Client Dashboard</h1>
      {client && (
        <>
          <p>Welcome, {client.fullName}!</p>
          <p>Email: {client.email}</p>
          <p>Phone: {client.phone}</p>
          <p>Postcode: {client.postcode}</p>
          <p>Address: {client.address}</p>
        </>
      )}
    </main>
  );
}
