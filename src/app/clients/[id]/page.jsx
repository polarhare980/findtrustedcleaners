'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientDashboard() {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); // ✅ SSR protection

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fetchClient = async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          const data = await res.json();

          if (!data.success || data.user.role !== 'client') {
            router.push('/login');
          } else {
            setClient(data.user);
          }
        } catch (err) {
          console.error('Error fetching client:', err);
          router.push('/login');
        } finally {
          setLoading(false);
        }
      };

      fetchClient();
      setMounted(true); // ✅ Safe to render now
    }
  }, [router]);

  if (!mounted) return null; // ✅ Prevents server-side render crash
  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-[#0D9488]">Client Dashboard</h1>
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
