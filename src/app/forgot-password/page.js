'use client';

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Simulate sending reset instructions
    setTimeout(() => {
      setMessage('If that email exists in our system, a password reset link has been sent.');
      setLoading(false);
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-white text-gray-700">
      <Head>
        <title>Forgot Password | FindTrustedCleaners</title>
        <meta name="description" content="Reset your FindTrustedCleaners password securely." />
      </Head>

      <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] text-white shadow">
        <Link href="/">
          <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
        </Link>
        <nav className="space-x-6 text-sm font-medium">
          <Link href="/cleaners">Find a Cleaner</Link>
          <Link href="/register">List Yourself</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/login">Login</Link>
          <Link href="/about">About</Link>
        </nav>
      </header>

      <section className="max-w-md mx-auto p-6 py-12">
        <h1 className="text-3xl font-bold text-center text-[#0D9488] mb-6">Forgot Password</h1>
        <p className="text-center text-gray-600 mb-6">
          Enter your email address below and we’ll send you instructions to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="bg-white shadow p-6 rounded space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#0D9488] text-white w-full py-3 rounded hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
          {message && <p className="text-center text-sm text-green-600 mt-2">{message}</p>}
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[#0D9488] hover:underline text-sm">
            Return to Login
          </Link>
        </div>
      </section>

      <footer className="bg-[#0D9488] text-white border-t py-6 px-6 text-center text-sm">
        <nav className="flex flex-wrap justify-center gap-4 mb-2">
          <Link href="/about">About Us</Link>
          <Link href="/terms">Terms & Conditions</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/cookie-policy">Cookie Policy</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/faq">FAQs</Link>
          <Link href="/sitemap">Site Map</Link>
        </nav>

        <p className="mb-2">&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>

        <p className="text-xs">
          FindTrustedCleaners is committed to GDPR compliance. Read our <Link href="/privacy-policy" className="underline">Privacy Policy</Link> and <Link href="/cookie-policy" className="underline">Cookie Policy</Link> for details on how we protect your data. You may <Link href="/contact" className="underline">contact us</Link> at any time to manage your personal information.
        </p>
      </footer>
    </main>
  );
}
