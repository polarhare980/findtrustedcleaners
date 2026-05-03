'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      setSubmitted(true);
      setMessage(data.message || 'If an account exists for that email, a reset link has been sent.');
    } catch {
      setSubmitted(true);
      setMessage('If an account exists for that email, a reset link has been sent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
<main className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 text-gray-700 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-teal-700/10"></div>

        <PublicHeader />

        <section className="relative z-10 max-w-md mx-auto p-6 py-12">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4">
              Reset Password
            </h1>
            <p className="text-gray-600 text-lg mb-2">Enter your email address and we&apos;ll send you a secure reset link.</p>
            <p className="text-gray-600">For privacy, we&apos;ll show the same message whether the account exists or not.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/25 backdrop-blur-20 border border-white/20 rounded-2xl p-8 shadow-2xl space-y-6 animate-slide-up">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-4 bg-white/80 backdrop-blur-20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all duration-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-medium rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </button>

            {message && (
              <div className={`${submitted ? 'bg-green-50/80 border-green-200/50 text-green-700' : 'bg-white/60 border-white/40 text-gray-700'} backdrop-blur-20 border rounded-xl p-4 animate-fade-in`}>
                <p className="text-sm font-medium text-center">{message}</p>
              </div>
            )}
          </form>
        </section>
      </main>
    </>
  );
}
