'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import DashboardShell from '@/components/DashboardShell';
import DashboardHeader from '@/components/DashboardHeader';

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
      } catch (err) {
        console.error('Earnings load error:', err);
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
      a.href = url; a.download = 'earnings.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export earnings. Are you a premium cleaner?');
    }
  };

  if (loading || !data) return <LoadingSpinner />;

  return (
    <DashboardShell ctaHref="/cleaners/dashboard" ctaLabel="Dashboard">
      <DashboardHeader
        title="Your earnings"
        description="Track completed jobs, profile views, and conversion performance from one cleaner dashboard."
        primaryHref="/cleaners/dashboard"
        primaryLabel="Back to dashboard"
      />
      <section className="surface-card p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Confirmed jobs" value={data.totalJobs} />
          <Card title="Total earnings" value={`£${data.totalEarnings.toFixed(2)}`} />
          <Card title="Profile views" value={data.views} />
          <Card title="Unlocks" value={data.unlocks} />
          <Card title="Conversion rate" value={`${data.conversionRate}%`} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleExport} className="brand-button">Export earnings CSV</button>
        </div>
        <p className="mt-4 text-sm text-slate-500">These figures are based on accepted bookings and your cleaner profile activity.</p>
      </section>
    </DashboardShell>
  );
}

function Card({ title, value }) {
  return (
    <div className="soft-panel p-5 text-center">
      <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">{title}</h2>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
