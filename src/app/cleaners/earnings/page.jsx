'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import AccountShell from '@/components/AccountShell';

export default function CleanerEarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        const res = await fetch('/api/cleaners/earnings', { credentials: 'include' });
        const json = await res.json();
        if (!json.success) {
          if (res.status === 403) router.push('/dashboard');
          else router.push('/login');
          return;
        }
        setData(json.data);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    loadEarnings();
  }, [router]);

  const handleExport = async () => {
    try {
      const res = await fetch('/api/cleaners/earnings/export', { credentials: 'include' });
      if (!res.ok) throw new Error('Not premium or failed to export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'earnings.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export earnings. Are you a premium cleaner?');
    }
  };

  if (loading || !data) return <LoadingSpinner />;

  return (
    <AccountShell title="Your earnings dashboard" description="Premium cleaner insights based on accepted bookings and profile activity." backHref="/cleaners/dashboard" backLabel="Back to dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Confirmed jobs" value={data.totalJobs} emoji="📋" />
        <Card title="Total earnings" value={`£${data.totalEarnings.toFixed(2)}`} emoji="💵" />
        <Card title="Profile views" value={data.views} emoji="👁️" />
        <Card title="Unlocks" value={data.unlocks} emoji="🔓" />
        <Card title="Conversion rate" value={`${data.conversionRate}%`} emoji="📈" />
      </div>
      <div className="mt-6">
        <button onClick={handleExport} className="ftc-button-primary">Export earnings CSV</button>
      </div>
    </AccountShell>
  );
}

function Card({ title, value, emoji }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
      <h2 className="text-lg font-semibold text-slate-700">{emoji} {title}</h2>
      <p className="mt-2 text-4xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
