'use client';

import PremiumBenefits from '@/components/PremiumBenefits'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('cleaner');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, userType }),
      });
      const data = await res.json().catch(() => ({}));
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
      <main className="min-h-screen bg-slate-50">
        <PublicHeader />
        <PageHero eyebrow="Account access" title="Login to your account" description="Choose whether you are signing in as a cleaner or a client." />

        <section className="site-section py-10">
          <div className="mx-auto max-w-lg surface-card p-6 sm:p-8">
            <div className="mb-6 flex rounded-full bg-slate-100 p-1">
              {['cleaner', 'client'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUserType(type)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${userType === type ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {type === 'cleaner' ? 'Cleaner' : 'Client'}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="ftc-input" placeholder="Enter your email" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="ftc-input pr-12" placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-teal-800">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

              <button type="submit" disabled={isLoading} className="ftc-button-primary w-full disabled:opacity-60">
                {isLoading ? 'Signing in…' : `Sign in as ${userType}`}
              </button>

              <div className="flex flex-col gap-3 pt-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <Link href="/forgot-password" className="text-teal-700 hover:text-teal-900">Forgot password?</Link>
                <Link href={userType === 'cleaner' ? '/register/cleaners' : '/register/client'} className="text-teal-700 hover:text-teal-900">
                  Register as a {userType}
                </Link>
              </div>
            </form>
          </div>
        </section>
        <PremiumBenefits />
        <PublicFooter />
      </main>
    </>
  );
}
