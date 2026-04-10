'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { secureFetch } from '@/lib/secureFetch';
import DashboardShell from '@/components/DashboardShell';
import DashboardHeader from '@/components/DashboardHeader';

function normalizeServiceKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normaliseService(service = {}, index = 0) {
  const name = String(service?.name || '').trim();
  const priceRaw = service?.price ?? service?.basePrice ?? '';
  const durationRaw = service?.defaultDurationMins ?? 60;
  return {
    key: normalizeServiceKey(service?.key || name || `service_${index + 1}`),
    name,
    price: priceRaw === '' || priceRaw === null || typeof priceRaw === 'undefined' ? '' : String(priceRaw),
    defaultDurationMins: durationRaw === '' || durationRaw === null || typeof durationRaw === 'undefined' ? '60' : String(durationRaw),
    active: service?.active !== false,
  };
}

function toPayload(services = []) {
  return services
    .map((service, index) => {
      const name = String(service?.name || '').trim();
      if (!name) return null;
      const duration = Number(service?.defaultDurationMins || 60);
      const priceValue = service?.price;
      const hasPrice = !(priceValue === '' || priceValue === null || typeof priceValue === 'undefined');
      const price = hasPrice ? Number(priceValue) : undefined;
      return {
        key: normalizeServiceKey(service?.key || name || `service_${index + 1}`),
        name,
        active: service?.active !== false,
        defaultDurationMins: Number.isFinite(duration) && duration > 0 ? duration : 60,
        price: Number.isFinite(price) ? price : undefined,
        basePrice: Number.isFinite(price) ? price : undefined,
      };
    })
    .filter(Boolean);
}

export default function ServicesDashboardEditor() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleanerId, setCleanerId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [services, setServices] = useState([]);
  const [savedSnapshot, setSavedSnapshot] = useState('[]');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await secureFetch('/api/auth/me');
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success || data?.user?.type !== 'cleaner') {
          router.push('/login');
          return;
        }
        if (!active) return;
        const user = data.user || {};
        const normalisedServices = Array.isArray(user.servicesDetailed)
          ? user.servicesDetailed.map((service, index) => normaliseService(service, index))
          : [];
        setCleanerId(String(user._id || user.id || ''));
        setCompanyName(user.companyName || user.realName || 'Your services');
        setServices(normalisedServices);
        setSavedSnapshot(JSON.stringify(normalisedServices));
      } catch (error) {
        console.error('Services editor init failed:', error);
        router.push('/login');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [router]);

  const hasChanges = useMemo(() => JSON.stringify(services) !== savedSnapshot, [services, savedSnapshot]);
  const activeServices = useMemo(() => services.filter((service) => service?.active !== false && String(service?.name || '').trim()), [services]);

  const updateService = (index, field, value) => {
    setServices((prev) => prev.map((service, idx) => {
      if (idx !== index) return service;
      const next = { ...service, [field]: value };
      if (field === 'name') next.key = normalizeServiceKey(value || service?.key || `service_${index + 1}`);
      return next;
    }));
  };

  const addService = () => setServices((prev) => ([...prev, normaliseService({ name: '', price: '', defaultDurationMins: 60, active: true }, prev.length)]));
  const removeService = (index) => setServices((prev) => prev.filter((_, idx) => idx !== index));

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = toPayload(services);
      const res = await fetch(`/api/cleaners/${cleanerId}`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ servicesDetailed: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to save services');
      const normalisedSaved = payload.map((service, index) => normaliseService(service, index));
      setServices(normalisedSaved);
      setSavedSnapshot(JSON.stringify(normalisedSaved));
      setMessage('Services updated successfully.');
    } catch (error) {
      console.error('Failed to save services:', error);
      setMessage(error.message || 'Failed to save services.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="site-shell grid min-h-screen place-items-center p-6"><LoadingSpinner /></div>;
  }

  return (
    <DashboardShell ctaHref="/cleaners/dashboard" ctaLabel="Dashboard">
      <div className="space-y-6">
        <DashboardHeader
          title="Edit services"
          description={`Manage the services clients can book for ${companyName}. Keep it simple: service name, optional price, and duration.`}
          primaryHref="/cleaners/dashboard"
          primaryLabel="Back to dashboard"
        />

        {message ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div> : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="surface-card lg:col-span-2 p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Service list</h2>
                <p className="mt-1 text-sm text-slate-600">Show clients exactly what they can book.</p>
              </div>
              <button onClick={addService} className="brand-button">Add service</button>
            </div>

            <div className="space-y-4">
              {!services.length ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600">No services added yet.</div>
              ) : services.map((service, index) => (
                <div key={`${service.key || 'service'}-${index}`} className="soft-panel p-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-600">Service name</label>
                      <input value={service.name || ''} onChange={(e) => updateService(index, 'name', e.target.value)} placeholder="Example: Single oven clean" className="input" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Price</label>
                      <input value={service.price || ''} onChange={(e) => updateService(index, 'price', e.target.value)} placeholder="Optional" className="input" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Duration (mins)</label>
                      <input value={service.defaultDurationMins || '60'} onChange={(e) => updateService(index, 'defaultDurationMins', e.target.value)} className="input" />
                    </div>
                    <div className="flex items-end">
                      <label className="inline-flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <input type="checkbox" checked={service.active !== false} onChange={(e) => updateService(index, 'active', e.target.checked)} className="h-4 w-4" />
                        <span className="text-sm font-medium text-slate-700">Active and bookable</span>
                      </label>
                    </div>
                    <div className="flex items-end justify-end md:col-span-1">
                      <button onClick={() => removeService(index)} className="brand-button-secondary">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button onClick={handleSave} disabled={saving || !hasChanges} className="brand-button disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : 'Save services'}</button>
            </div>
          </section>

          <aside className="surface-card p-6">
            <h2 className="text-2xl font-semibold text-slate-900">Live summary</h2>
            <p className="mt-1 text-sm text-slate-600">This is how your active services currently look.</p>
            <div className="mt-4 space-y-3">
              {activeServices.length ? activeServices.map((service, index) => (
                <div key={`${service.key || 'active'}-${index}`} className="soft-panel p-4">
                  <div className="font-semibold text-slate-900">{service.name}</div>
                  <div className="mt-1 text-sm text-slate-600">{service.defaultDurationMins || 60} mins</div>
                  <div className="mt-1 text-sm text-slate-700">{service.price !== '' ? `£${service.price}` : 'Price on request'}</div>
                </div>
              )) : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No active services yet.</div>}
            </div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
