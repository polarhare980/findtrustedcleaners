'use client';

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

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

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        setMessage('✅ Code sent. Check your email.');
      } else {
        setMessage(data.message || 'Something went wrong.');
      }
    } catch (err) {
      setMessage('Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password | FindTrustedCleaners</title>
        <meta name="description" content="Reset your FindTrustedCleaners password securely." />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 text-gray-700 relative">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-teal-700/10"></div>
        
        {/* Glass morphism header */}
        <header className="relative z-10 backdrop-blur-20 bg-white/25 border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="transition-transform duration-300 hover:scale-105">
              <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
            </Link>
            <nav className="hidden md:flex space-x-8 text-sm font-medium">
              <Link href="/cleaners" className="text-teal-800 hover:text-teal-600 transition-colors duration-300 hover:bg-white/20 px-3 py-2 rounded-lg">Find a Cleaner</Link>
              <Link href="/register/cleaners" className="text-teal-800 hover:text-teal-600 transition-colors duration-300 hover:bg-white/20 px-3 py-2 rounded-lg">List Yourself</Link>
              <Link href="/how-it-works" className="text-teal-800 hover:text-teal-600 transition-colors duration-300 hover:bg-white/20 px-3 py-2 rounded-lg">How It Works</Link>
              <Link href="/login" className="text-teal-800 hover:text-teal-600 transition-colors duration-300 hover:bg-white/20 px-3 py-2 rounded-lg">Login</Link>
              <Link href="/about" className="text-teal-800 hover:text-teal-600 transition-colors duration-300 hover:bg-white/20 px-3 py-2 rounded-lg">About</Link>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <section className="relative z-10 max-w-md mx-auto p-6 py-12">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4">
              Reset Password
            </h1>
            <p className="text-gray-600 text-lg mb-2">
              Don&apos;t worry, it happens to the best of us! 🔐
            </p>
            <p className="text-gray-600">
              Enter your email and we&apos;ll send you a one-time verification code.
            </p>
          </div>

          {/* Glass morphism form */}
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
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                  Sending Code...
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="mr-2">📧</span>
                  Send Reset Code
                </span>
              )}
            </button>

            {/* Success message */}
            {submitted && (
              <div className="bg-green-50/80 backdrop-blur-20 border border-green-200/50 rounded-xl p-4 animate-fade-in">
                <p className="text-green-600 text-sm font-medium flex items-center justify-center">
                  <span className="mr-2">✅</span>
                  Code sent to your email.
                </p>
                <div className="mt-3 text-center">
                  <Link 
                    href="/verify-reset" 
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-full transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className="mr-2">🔗</span>
                    Continue to Verification
                  </Link>
                </div>
              </div>
            )}

            {/* Error message */}
            {message && !submitted && (
              <div className="bg-red-50/80 backdrop-blur-20 border border-red-200/50 rounded-xl p-4 animate-fade-in">
                <p className="text-red-600 text-sm font-medium flex items-center justify-center">
                  <span className="mr-2">⚠️</span>
                  {message}
                </p>
              </div>
            )}
          </form>

          {/* Return to login link */}
          <div className="mt-8 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center text-teal-600 hover:text-teal-800 transition-colors duration-300 hover:underline font-medium"
            >
              <span className="mr-2">←</span>
              Return to Login
            </Link>
          </div>

          {/* Help section */}
          <div className="mt-8 bg-white/25 backdrop-blur-20 border border-white/20 rounded-2xl p-6 text-center">
            <h3 className="text-lg font-semibold text-teal-800 mb-2">Need Help?</h3>
            <p className="text-gray-600 text-sm mb-4">
              If you&apos;re having trouble, our support team is here to help.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-full transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="mr-2">💬</span>
              Contact Support
            </Link>
          </div>
        </section>

        {/* Glass morphism footer */}
        <footer className="relative z-10 mt-auto backdrop-blur-20 bg-white/25 border-t border-white/20 py-8 px-6 text-center text-sm">
          <div className="max-w-7xl mx-auto">
            <nav className="flex flex-wrap justify-center gap-6 mb-4">
              <Link href="/about" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">About Us</Link>
              <Link href="/terms" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">Terms &amp; Conditions</Link>
              <Link href="/privacy-policy" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">Privacy Policy</Link>
              <Link href="/cookie-policy" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">Cookie Policy</Link>
              <Link href="/contact" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">Contact</Link>
              <Link href="/faq" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">FAQs</Link>
              <Link href="/sitemap" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">Site Map</Link>
            </nav>
            <p className="mb-2 text-gray-600">&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>
            <p className="text-xs text-gray-500">
              FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
              <Link href="/privacy-policy" className="text-teal-600 hover:text-teal-800 transition-colors duration-300 underline">
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link href="/cookie-policy" className="text-teal-600 hover:text-teal-800 transition-colors duration-300 underline">
                Cookie Policy
              </Link>
              {' '}for details on how we protect your data.
            </p>
          </div>
        </footer>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        
        .backdrop-blur-20 {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </>
  );
}