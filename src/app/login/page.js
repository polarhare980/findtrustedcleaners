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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await fetch(`/api/auth/login`, {
  method: 'POST',
  credentials: 'include', // 🔥 Add this line
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, userType })
});


      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('❌ Failed to parse JSON from /api/login:', jsonErr);
      }

      if (res.ok && data.success) {
        if (userType === 'client') {
          router.push('/clients/dashboard');
        } else if (userType === 'cleaner') {
          router.push('/cleaners/dashboard');
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }

    } catch (err) {
      console.error('❌ Login request error:', err);
      setError('A network error occurred. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Login | Find Trusted Cleaners</title>
        <meta name="description" content="Login to your Find Trusted Cleaners account as a client or cleaner." />
      </Head>

      <main className="min-h-screen bg-white text-gray-700">
        <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] shadow text-white">
          <Link href="/">
            <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
          </Link>
          <nav className="space-x-6 text-sm font-medium">
            <Link href="/" className="hover:text-gray-200">Home</Link>
            <Link href="/cleaners" className="hover:text-gray-200">Find a Cleaner</Link>
            <Link href="/register/cleaners" className="hover:text-gray-200">List Yourself</Link>
            <Link href="/how-it-works" className="hover:text-gray-200">How It Works</Link>
            <Link href="/blog" className="hover:text-gray-200">Blog</Link>
          </nav>
        </header>

        <section className="px-6 py-10 max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center text-[#0D9488] mb-6">Log In</h1>

          <div className="mb-4 flex justify-center gap-4">
            <button
              className={`px-4 py-2 rounded font-medium border ${userType === 'cleaner' ? 'bg-[#0D9488] text-white' : 'bg-white text-[#0D9488] border-[#0D9488]'}`}
              onClick={() => setUserType('cleaner')}
            >
              Cleaner
            </button>
            <button
              className={`px-4 py-2 rounded font-medium border ${userType === 'client' ? 'bg-[#0D9488] text-white' : 'bg-white text-[#0D9488] border-[#0D9488]'}`}
              onClick={() => setUserType('client')}
            >
              Client
            </button>
          </div>

          <form onSubmit={handleLogin} className="bg-white shadow p-6 rounded space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 border rounded pr-10"
              />
              <span
                className="absolute right-3 top-2 cursor-pointer text-sm text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </span>
            </div>
            {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
            <button type="submit" className="bg-[#0D9488] text-white w-full py-2 rounded shadow hover:bg-teal-700">
              Log In as {userType.charAt(0).toUpperCase() + userType.slice(1)}
            </button>
            <div className="flex justify-between text-sm mt-2">
              <Link href="/forgot-password" className="text-[#0D9488] hover:underline">
                Forgot password?
              </Link>
              <Link
                href={userType === 'cleaner' ? '/register/cleaners' : '/register/client'}
                className="text-[#0D9488] hover:underline"
              >
                Register as a {userType === 'cleaner' ? 'Cleaner' : 'Client'}
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Or log in using:</p>
            <div className="flex justify-center gap-4 mt-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Google</button>
              <button className="bg-blue-900 text-white px-4 py-2 rounded text-sm hover:bg-blue-950">Facebook</button>
            </div>
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
    </>
  );
}
