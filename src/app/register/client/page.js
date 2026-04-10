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
    setIsLoading(true);

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          houseNameNumber: form.houseNameNumber,
          street: form.street,
          county: form.county,
          postcode: form.postcode,
          password: form.password,
          userType: 'client',
        }),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const nextUrl = searchParams.get('next');
          router.push(nextUrl || '/clients/dashboard');
        } else {
          setMessage('Registration failed. Please try again.');
        }
      } else {
        setMessage('Failed to register. Please try again.');
      }
    } catch {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="site-shell">
      <Head>
        <title>Register as a Client | Find Trusted Cleaners</title>
      </Head>

      <PublicHeader ctaHref="/login" ctaLabel="Login" />
      <PageHero
        eyebrow="Client registration"
        title="Create your client account"
        description="Save favourites, request bookings, and manage your cleaning enquiries in one place."
      />

      <section className="section-shell pb-16">
        <div className="mx-auto max-w-3xl surface-card p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Your details</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input type="text" name="fullName" placeholder="Full name" value={form.fullName} onChange={handleChange} className="input md:col-span-2" required />
                <input type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange} className="input" required />
                <input type="tel" name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} className="input" required />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Address</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input type="text" name="houseNameNumber" placeholder="House name or number" value={form.houseNameNumber} onChange={handleChange} className="input" required />
                <input type="text" name="street" placeholder="Street" value={form.street} onChange={handleChange} className="input" required />
                <input type="text" name="county" placeholder="County" value={form.county} onChange={handleChange} className="input" required />
                <input type="text" name="postcode" placeholder="Postcode" value={form.postcode} onChange={handleChange} className="input" required />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Security</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} className="input" required />
                <input type="password" name="confirmPassword" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} className="input" required />
              </div>
            </div>

            {message ? <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">{message}</div> : null}

            <button type="submit" disabled={isLoading} className="brand-button w-full">
              {isLoading ? 'Creating your account...' : 'Register as a client'}
            </button>

            <p className="text-sm text-slate-600">
              Already registered? <Link href="/login" className="font-semibold text-teal-700 hover:underline">Sign in here</Link>.
            </p>
          </form>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

export default function ClientRegisterPageWrapper() {
  return (
    <Suspense fallback={null}>
      <ClientRegisterPage />
    </Suspense>
  );
}
