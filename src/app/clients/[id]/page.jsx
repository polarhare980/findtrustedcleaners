'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import jwt from 'jsonwebtoken';

export default function ClientDashboard({ params }) {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    try {
      const decoded = jwt.decode(token);
      fetch(`/api/clients/${decoded.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setClient(data.client);
          } else {
            router.push('/login');
          }
        });
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, []);

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
