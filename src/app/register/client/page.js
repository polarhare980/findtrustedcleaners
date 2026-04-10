'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';

function ClientRegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    houseNameNumber: '',
    street: '',
    county: '',
    postcode: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, userType: 'client' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        const nextUrl = searchParams.get('next');
        router.push(nextUrl || '/clients/dashboard');
      } else {
        setMessage(data?.message || 'Registration failed. Please try again.');
      }
    } catch {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head><title>Register as a Client | Find Trusted Cleaners</title></Head>
      <main className="min-h-screen bg-slate-50">
        <PublicHeader />
        <PageHero eyebrow="Client registration" title="Create your client account" description="Set up your details once so you can save favourites, request bookings, and manage appointments more easily." />
        <section className="site-section py-10">
          <div className="mx-auto max-w-3xl surface-card p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Your details</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input name="fullName" placeholder="Full name" value={form.fullName} onChange={handleChange} className="ftc-input" required />
                  <input name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} className="ftc-input" required />
                  <input name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} className="ftc-input" required />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">Address</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input name="houseNameNumber" placeholder="House name or number" value={form.houseNameNumber} onChange={handleChange} className="ftc-input" required />
                  <input name="street" placeholder="Street" value={form.street} onChange={handleChange} className="ftc-input" required />
                  <input name="county" placeholder="County" value={form.county} onChange={handleChange} className="ftc-input" required />
                  <input name="postcode" placeholder="Postcode" value={form.postcode} onChange={handleChange} className="ftc-input" required />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">Security</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="ftc-input" required />
                  <input name="confirmPassword" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} className="ftc-input" required />
                </div>
              </div>

              {message ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div> : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="submit" disabled={isLoading} className="ftc-button-primary">{isLoading ? 'Creating account…' : 'Create account'}</button>
                <Link href="/login" className="text-sm text-teal-700 hover:text-teal-900">Already have an account? Login</Link>
              </div>
            </form>
          </div>
        </section>
        <PublicFooter />
      </main>
    </>
  );
}

export default function RegisterClientPage() {
  return <Suspense fallback={null}><ClientRegisterPage /></Suspense>;
}
