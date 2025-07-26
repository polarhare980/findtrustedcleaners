'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CleanerEarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        const res = await fetch('/api/cleaner/earnings', { credentials: 'include' });
        const json = await res.json();

        if (!json.success) {
          if (res.status === 403) router.push('/dashboard');
          else router.push('/login');
          return;
        }

        setData(json.data);
      } catch (err) {
        console.error('Earnings load error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadEarnings();
  }, [router]);

  if (loading || !data) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent">
          💰 Your Earnings Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card title="Confirmed Jobs" value={data.totalJobs} emoji="📋" />
          <Card title="Total Earnings" value={`£${data.totalEarnings.toFixed(2)}`} emoji="💵" />
          <Card title="Profile Views" value={data.views} emoji="👁️" />
          <Card title="Unlocks" value={data.unlocks} emoji="🔓" />
          <Card title="Conversion Rate" value={`${data.conversionRate}%`} emoji="📈" />
        </div>

        <p className="text-gray-600 text-sm mt-6 italic">
          * These stats are based on confirmed bookings and your cleaner profile activity.
        </p>
      </div>
    </div>
  );
}

function Card({ title, value, emoji }) {
  return (
    <div className="p-6 bg-white/30 backdrop-blur-md border border-yellow-200 rounded-xl shadow-lg text-center">
      <h2 className="text-lg font-semibold text-gray-700 mb-2">{emoji} {title}</h2>
      <p className="text-4xl font-bold text-yellow-800">{value}</p>
    </div>
  );
}
