'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [userType, setUserType] = useState('cleaner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userType }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('❌ Failed to parse JSON from /api/login:', jsonErr);
      }

      if (res.ok && data.success) {
        router.push(userType === 'client' ? '/clients/dashboard' : '/cleaners/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('❌ Login request error:', err);
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
              <Link href="/" className="text-teal-800 hover:text-teal-600 transition-colors duration-300 hover:bg-white/20 px-3 py-2 rounded-lg">Home</Link>
              <Link href="/cleaners" className="text-teal-800 hover:text-teal-600 transition-colors duration-300 hover:bg-white/20 px-3 py-2 rounded-lg">Find a Cleaner</Link>
              <Link href="/register/cleaners" className="text-teal-800 hover:text-teal-600 transition-colors duration-300 hover:bg-white/20 px-3 py-2 rounded-lg">List Yourself</Link>
              <Link href="/how-it-works" className="text-teal-800 hover:text-teal-600 transition-colors duration-300 hover:bg-white/20 px-3 py-2 rounded-lg">How It Works</Link>
              <Link href="/blog" className="text-teal-800 hover:text-teal-600 transition-colors duration-300 hover:bg-white/20 px-3 py-2 rounded-lg">Blog</Link>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <section className="relative z-10 px-6 py-12 max-w-md mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-lg">Sign in to your account</p>
          </div>

          {/* User type selector */}
          <div className="mb-8 flex justify-center gap-2">
            <button
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                userType === 'cleaner' 
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg' 
                  : 'bg-white/80 backdrop-blur-20 text-teal-800 border border-white/20 hover:bg-white/90'
              }`}
              onClick={() => setUserType('cleaner')}
            >
              🧹 Cleaner
            </button>
            <button
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                userType === 'client' 
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg' 
                  : 'bg-white/80 backdrop-blur-20 text-teal-800 border border-white/20 hover:bg-white/90'
              }`}
              onClick={() => setUserType('client')}
            >
              🏠 Client
            </button>
          </div>

          {/* Glass morphism form */}
          <form onSubmit={handleLogin} className="bg-white/25 backdrop-blur-20 border border-white/20 rounded-2xl p-8 shadow-2xl space-y-6 animate-slide-up">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-4 bg-white/80 backdrop-blur-20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-4 bg-white/80 backdrop-blur-20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all duration-300 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600 transition-colors duration-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-20 border border-red-200/50 rounded-xl p-4">
                <p className="text-red-600 text-sm font-medium flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-medium rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                `Sign In as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`
              )}
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-center text-sm space-y-2 sm:space-y-0 pt-4">
              <Link 
                href="/forgot-password" 
                className="text-teal-600 hover:text-teal-800 transition-colors duration-300 hover:underline"
              >
                Forgot password?
              </Link>
              <Link
                href={userType === 'cleaner' ? '/register/cleaners' : '/register/client'}
                className="text-teal-600 hover:text-teal-800 transition-colors duration-300 hover:underline"
              >
                Register as a {userType === 'cleaner' ? 'Cleaner' : 'Client'}
              </Link>
            </div>
          </form>
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