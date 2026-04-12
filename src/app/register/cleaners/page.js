'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import PublicHeader from '@/components/PublicHeader';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_MAP = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i);

const SERVICE_CATEGORIES = {
  'Domestic Cleaning': ['Regular House Cleaning', 'Deep Cleaning', 'Spring Cleaning', 'End of Tenancy', 'After-party Cleaning', 'Holiday Let Cleaning'],
  'Specialist Cleaning': ['Oven Cleaning', 'Carpet Cleaning', 'Upholstery Cleaning', 'Mattress Cleaning', 'Curtain Cleaning', 'Mould Removal'],
  'Exterior Cleaning': ['Window Cleaning', 'Gutter Cleaning', 'Roof Cleaning', 'Pressure Washing'],
  'Vehicle Cleaning': ['Car Valeting', 'Fleet Cleaning'],
  'Commercial Cleaning': ['Office Cleaning', 'Retail Cleaning', 'Gym Cleaning'],
};

function buildDenseBaseAvailability(formAvailability) {
  const out = {};
  for (const day of Object.values(DAY_MAP)) {
    out[day] = {};
    for (const h of HOURS) out[day][String(h)] = 'unavailable';
  }
  Object.entries(formAvailability || {}).forEach(([key, selected]) => {
    if (!selected) return;
    const [shortDay, hourNum] = key.split('-');
    const fullDay = DAY_MAP[shortDay];
    if (fullDay) out[fullDay][String(hourNum)] = true;
  });
  return out;
}

export default function CleanerRegister() {
  const router = useRouter();
  const [form, setForm] = useState({
    realName: '',
    companyName: '',
    houseNameNumber: '',
    street: '',
    town: '',
    county: '',
    postcode: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    rates: '',
    availability: {},
    services: [],
    businessInsurance: false,
    dbsChecked: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: '', submit: '' }));
  };

  const toggleAvailability = (day, hour) => {
    const key = `${day}-${hour}`;
    setForm((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [key]: !prev.availability[key],
      },
    }));
  };

  const handleServiceToggle = (service) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
    setErrors((prev) => ({ ...prev, services: '', submit: '' }));
  };

  const validateForm = () => {
    const next = {};
    if (!form.realName.trim()) next.realName = 'Real name is required';
    if (!form.companyName.trim()) next.companyName = 'Company name is required';
    if (!form.houseNameNumber.trim()) next.houseNameNumber = 'House name/number is required';
    if (!form.street.trim()) next.street = 'Street is required';
    if (!form.county.trim()) next.county = 'County is required';
    if (!form.postcode.trim()) next.postcode = 'Postcode is required';
    if (!form.email.trim()) next.email = 'Email is required';
    if (!form.phone.trim()) next.phone = 'Phone is required';
    if (!form.password) next.password = 'Password is required';
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password';
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (!form.services.length) next.services = 'Please select at least one service';

    const rawRate = String(form.rates || '').trim();
    if (rawRate) {
      const parsed = Number(rawRate.replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(parsed) || parsed < 0) next.rates = 'Please enter a valid hourly rate';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    const rawRate = String(form.rates || '').trim();
    const parsedRates = rawRate ? Number(rawRate.replace(/[^0-9.]/g, '')) : undefined;

    try {
      const payload = {
        realName: form.realName.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        rates: Number.isFinite(parsedRates) ? parsedRates : undefined,
        services: form.services,
        houseNameNumber: form.houseNameNumber.trim(),
        street: form.street.trim(),
        town: form.town.trim(),
        county: form.county.trim(),
        postcode: form.postcode.trim(),
        availability: buildDenseBaseAvailability(form.availability),
        businessInsurance: !!form.businessInsurance,
        dbsChecked: !!form.dbsChecked,
        userType: 'cleaner',
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        router.push('/cleaners/dashboard');
      } else {
        setErrors({ submit: data?.message || 'Registration failed. Please try again.' });
      }
    } catch {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register as a Cleaner | Find Trusted Cleaners</title>
      </Head>

      <main className="min-h-screen relative overflow-hidden bg-slate-50 text-slate-800">
        <div className="absolute inset-0 -z-10">
          <img src="/background.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.16),transparent_38%),linear-gradient(180deg,rgba(248,250,252,0.90),rgba(240,253,250,0.82),rgba(248,250,252,0.96))]" />
        </div>

        <PublicHeader />

        <section className="mx-auto max-w-5xl px-4 py-10">
          <div className="mb-8 rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Cleaner registration</p>
            <h1 className="text-3xl font-bold text-teal-900 md:text-4xl">Create your cleaner profile</h1>
            <p className="mt-3 max-w-2xl text-slate-600">Build a cleaner profile that feels polished, trustworthy and easy for clients to understand. Add your details, trust signals, services and availability in one place.</p>
          </div>

          {errors.submit ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{errors.submit}</div> : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <h2 className="mb-4 text-xl font-semibold text-teal-900">About you</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ['realName', 'Real name *'],
                    ['companyName', 'Company name *'],
                    ['houseNameNumber', 'House name / number *'],
                    ['street', 'Street *'],
                    ['town', 'Town / city'],
                    ['county', 'County *'],
                    ['postcode', 'Postcode *'],
                    ['email', 'Email *'],
                    ['phone', 'Phone *'],
                  ].map(([name, placeholder]) => (
                    <div key={name} className={name === 'street' || name === 'email' ? 'md:col-span-2' : ''}>
                      <input
                        name={name}
                        type={name === 'email' ? 'email' : 'text'}
                        value={form[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className={`w-full rounded-2xl border bg-white/80 px-4 py-3 outline-none transition ${errors[name] ? 'border-rose-400' : 'border-white/40 focus:border-teal-400'}`}
                      />
                      {errors[name] ? <p className="mt-1 text-sm text-rose-600">{errors[name]}</p> : null}
                    </div>
                  ))}
                  <div>
                    <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password *" className={`w-full rounded-2xl border bg-white/80 px-4 py-3 outline-none transition ${errors.password ? 'border-rose-400' : 'border-white/40 focus:border-teal-400'}`} />
                    {errors.password ? <p className="mt-1 text-sm text-rose-600">{errors.password}</p> : null}
                  </div>
                  <div>
                    <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password *" className={`w-full rounded-2xl border bg-white/80 px-4 py-3 outline-none transition ${errors.confirmPassword ? 'border-rose-400' : 'border-white/40 focus:border-teal-400'}`} />
                    {errors.confirmPassword ? <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword}</p> : null}
                  </div>
                </div>
              </section>

              <section className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <h2 className="mb-4 text-xl font-semibold text-teal-900">Pricing & trust</h2>
                <div className="space-y-4">
                  <div>
                    <input name="rates" value={form.rates} onChange={handleChange} placeholder="Hourly rate (optional)" className={`w-full rounded-2xl border bg-white/80 px-4 py-3 outline-none transition ${errors.rates ? 'border-rose-400' : 'border-white/40 focus:border-teal-400'}`} />
                    <p className="mt-2 text-sm text-slate-500">Leave this blank for per-job services like oven cleaning or window cleaning.</p>
                    {errors.rates ? <p className="mt-1 text-sm text-rose-600">{errors.rates}</p> : null}
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-700 ring-1 ring-white/40">
                    <input type="checkbox" name="businessInsurance" checked={form.businessInsurance} onChange={handleChange} className="h-4 w-4 accent-teal-700" />
                    I have business insurance
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-700 ring-1 ring-white/40">
                    <input type="checkbox" name="dbsChecked" checked={form.dbsChecked} onChange={handleChange} className="h-4 w-4 accent-teal-700" />
                    I have a valid DBS check
                  </label>
                </div>
              </section>
            </div>

            <section className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-teal-900">Services</h2>
                  <p className="text-sm text-slate-500">Pick at least one service you offer.</p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {Object.entries(SERVICE_CATEGORIES).map(([category, services]) => (
                  <div key={category} className="rounded-[24px] border border-white/70 bg-white/84 p-4 shadow-sm">
                    <h3 className="mb-3 font-semibold text-slate-800">{category}</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {services.map((service) => (
                        <label key={service} className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={form.services.includes(service)} onChange={() => handleServiceToggle(service)} className="h-4 w-4 accent-teal-700" />
                          <span>{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {errors.services ? <p className="mt-3 text-sm text-rose-600">{errors.services}</p> : null}
            </section>

            <section className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-teal-900">Availability</h2>
                <p className="text-sm text-slate-500">Default is unavailable. Tap a slot to mark it available.</p>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[920px] rounded-2xl border border-white/40 bg-white/80 p-2 shadow-inner">
                  <div className="grid grid-cols-[110px_repeat(13,minmax(54px,1fr))] gap-1 text-xs md:text-sm">
                    <div className="grid place-items-center rounded-xl bg-slate-100 px-2 py-3 font-semibold text-slate-600">Day / Hour</div>
                    {HOURS.map((hour) => (
                      <div key={hour} className="grid place-items-center rounded-xl bg-slate-100 px-2 py-3 font-semibold text-slate-600">{String(hour).padStart(2, '0')}:00</div>
                    ))}
                    {DAYS.map((day) => (
                      <React.Fragment key={day}>
                        <div className="grid place-items-center rounded-xl bg-white px-2 py-3 font-semibold text-slate-700">{day}</div>
                        {HOURS.map((hour) => {
                          const key = `${day}-${hour}`;
                          const active = !!form.availability[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleAvailability(day, hour)}
                              className={`rounded-xl px-2 py-3 font-semibold text-white transition ${active ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-300 hover:bg-rose-400'}`}
                              title={active ? 'Available' : 'Unavailable'}
                            >
                              {active ? '✓' : '×'}
                            </button>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <label className="flex items-start gap-3 rounded-[24px] border border-white/60 bg-white/78 px-4 py-4 text-sm text-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <input type="checkbox" required className="mt-1 h-4 w-4 accent-teal-700" />
              <span>I agree to the <Link href="/terms" className="font-medium text-teal-700 underline">Terms & Conditions</Link> and <Link href="/privacy-policy" className="font-medium text-teal-700 underline">Privacy Policy</Link>.</span>
            </label>

            <button type="submit" disabled={isSubmitting} className={`w-full rounded-2xl px-5 py-4 text-base font-semibold text-white shadow-xl transition ${isSubmitting ? 'cursor-not-allowed bg-slate-400' : 'bg-gradient-to-r from-teal-600 to-teal-700 shadow-[0_18px_40px_rgba(13,148,136,0.28)] hover:-translate-y-0.5 hover:from-teal-700 hover:to-teal-800'}`}>
              {isSubmitting ? 'Registering…' : 'Register Cleaner'}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
