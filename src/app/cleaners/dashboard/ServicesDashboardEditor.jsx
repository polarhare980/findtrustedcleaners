'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { secureFetch } from '@/lib/secureFetch';

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

    return () => {
      active = false;
    };
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

  const addService = () => {
    setServices((prev) => ([
      ...prev,
      normaliseService({ name: '', price: '', defaultDurationMins: 60, active: true }, prev.length),
    ]));
  };

  const removeService = (index) => {
    setServices((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = toPayload(services);
      const res = await fetch(`/api/cleaners/${cleanerId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicesDetailed: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to save services');

      const normalisedSaved = payload.map((service, index) => normaliseService(service, index));
      setServices(normalisedSaved);
      setSavedSnapshot(JSON.stringify(normalisedSaved));
      setMessage('✅ Services updated successfully.');
    } catch (error) {
      console.error('Failed to save services:', error);
      setMessage(`❌ ${error.message || 'Failed to save services.'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Cleaner dashboard</p>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mt-1">
                Edit Services
              </h1>
              <p className="text-gray-600 mt-2">Manage the services clients can book for {companyName}. Prices saved here feed your public profile and homepage service snapshots.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/cleaners/dashboard')}
                className="px-4 py-2 rounded-xl bg-white/80 border border-white/60 text-gray-800 font-medium hover:bg-white"
              >
                ← Back to dashboard
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className={`px-5 py-2 rounded-xl text-white font-semibold ${saving || !hasChanges ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800'}`}
              >
                {saving ? 'Saving…' : 'Save services'}
              </button>
            </div>
          </div>
          {message ? <div className="mt-4 rounded-xl bg-white/70 border border-white/60 px-4 py-3 text-sm text-gray-800">{message}</div> : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">Service list</h2>
                <p className="text-sm text-gray-600 mt-1">Keep this simple: service name, price, duration, and whether it is active. Homepage price cards use this data.</p>
              </div>
              <button
                onClick={addService}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-700 hover:to-purple-800"
              >
                ➕ Add service
              </button>
            </div>

            {services.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-gray-600">
                No services added yet.
              </div>
            ) : (
              services.map((service, index) => (
                <div key={`${service.key || 'service'}-${index}`} className="rounded-2xl border border-white/60 bg-white/70 p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-600 mb-2">Service name</label>
                      <input
                        value={service.name || ''}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                        placeholder="Example: Single oven clean"
                        className="w-full p-3 border rounded-xl bg-white/90"
                      />
                    </div>
                    <button
                      onClick={() => removeService(index)}
                      className="mt-7 px-3 py-2 rounded-xl border border-red-200 text-red-700 bg-white hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Price (optional)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={service.price ?? ''}
                        onChange={(e) => updateService(index, 'price', e.target.value)}
                        placeholder="45"
                        className="w-full p-3 border rounded-xl bg-white/90"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Duration (mins)</label>
                      <input
                        type="number"
                        min="15"
                        step="15"
                        value={service.defaultDurationMins ?? '60'}
                        onChange={(e) => updateService(index, 'defaultDurationMins', e.target.value)}
                        placeholder="60"
                        className="w-full p-3 border rounded-xl bg-white/90"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="inline-flex items-center gap-3 rounded-xl border border-white/60 bg-white/90 px-4 py-3 w-full cursor-pointer">
                        <input
                          type="checkbox"
                          checked={service.active !== false}
                          onChange={(e) => updateService(index, 'active', e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Active and bookable</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">Live summary</h2>
            <p className="text-sm text-gray-600 mt-1">This is what your active service setup currently looks like.</p>

            <div className="mt-4 space-y-3">
              {activeServices.length ? activeServices.map((service, index) => (
                <div key={`${service.key || 'active'}-${index}`} className="rounded-xl border border-white/60 bg-white/70 p-4">
                  <div className="font-semibold text-gray-900">{service.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{service.defaultDurationMins || 60} mins</div>
                  <div className="text-sm text-gray-700 mt-1">{service.price !== '' ? `£${service.price}` : 'Price on request'}</div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-4 text-sm text-gray-600">
                  No active services yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
