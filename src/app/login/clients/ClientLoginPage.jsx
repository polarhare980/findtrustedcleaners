'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ClientLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/clients/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // ✅ This is essential to save the cookie
      });

      const data = await res.json();

      if (res.ok && data.id) {
        localStorage.setItem('clientId', data.id);

        // ✅ Prioritise &apos;next&apos; from URL, fallback to &apos;redirectAfterLogin&apos; from localStorage
        const nextUrl = searchParams.get('next');
        const redirectFromStorage = localStorage.getItem('redirectAfterLogin');

        if (nextUrl) {
          router.push(nextUrl);
        } else if (redirectFromStorage) {
          localStorage.removeItem('redirectAfterLogin');
          router.push(redirectFromStorage);
        } else {
          router.push('/clients/dashboard');
        }

      } else {
        alert(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Glass Morphism Card */}
      <div 
        className="relative rounded-2xl p-8 shadow-2xl backdrop-blur-[20px] border border-white/20 animate-fade-in"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Gradient Title */}
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
          Client Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl border border-white/20 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all duration-300"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-white/20 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all duration-300"
              placeholder="Enter your password"
            />
          </div>

          {/* Primary Button with Gradient */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 px-6 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out hover:scale-105"
          >
            Log In
          </button>
        </form>

        {/* Bottom Section */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-700 font-medium">Don&apos;t have an account?</p>
          <Link
            href={`/register/client?next=${encodeURIComponent(
              searchParams.get('next') || localStorage.getItem('redirectAfterLogin') || '/clients/dashboard'
            )}`}
            className="inline-block bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out hover:scale-105"
          >
            Register to Purchase
          </Link>
        </div>
      </div>
    </div>
  );
}