'use client';

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('cleaner');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, userType }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (res.ok && data.success) {
        router.push(userType === 'client' ? '/clients/dashboard' : '/cleaners/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your details and try again.');
      }
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | Find Trusted Cleaners</title>
        <meta name="description" content="Login to your Find Trusted Cleaners account as a client or cleaner." />
      </Head>

      <main className="site-shell">
        <PublicHeader ctaHref="/register/client" ctaLabel="Register" />

        <PageHero
          eyebrow="Account access"
          title="Sign in to your FindTrustedCleaners account"
          description="Log in as a cleaner or client to manage bookings, profiles, and account settings."
        />

        <section className="section-shell pb-16">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr,1.1fr]">
            <aside className="surface-card p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Why sign in?</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Manage everything in one place</h2>
              <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
                <li>• Clients can review bookings, favourites, and account details.</li>
                <li>• Cleaners can manage profiles, services, and availability.</li>
                <li>• Password reset and verification flows are built into your account area.</li>
              </ul>
            </aside>

            <form onSubmit={handleLogin} className="surface-card p-8 sm:p-10">
              <div className="flex gap-3 rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${userType === 'cleaner' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                  onClick={() => setUserType('cleaner')}
                >
                  Cleaner
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${userType === 'client' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                  onClick={() => setUserType('client')}
                >
                  Client
                </button>
              </div>

              <div className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input pr-14"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-sm text-slate-500"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              {error ? <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

              <button type="submit" disabled={isLoading} className="brand-button mt-8 w-full">
                {isLoading ? 'Signing in...' : `Sign in as ${userType === 'client' ? 'client' : 'cleaner'}`}
              </button>

              <div className="mt-6 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:justify-between">
                <Link href="/forgot-password" className="hover:text-teal-700 hover:underline">Forgot password?</Link>
                <Link href={userType === 'cleaner' ? '/register/cleaners' : '/register/client'} className="hover:text-teal-700 hover:underline">
                  Register as a {userType}
                </Link>
              </div>
            </form>
          </div>
        </section>

        <PublicFooter />
      </main>
    </>
  );
}
