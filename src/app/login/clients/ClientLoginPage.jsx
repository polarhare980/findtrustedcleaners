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

        const nextUrl = searchParams.get('next');
        if (nextUrl) {
          router.push(nextUrl);
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
    <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6 text-teal-700 text-center">Client Login</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700"
        >
          Log In
        </button>
      </form>

      {searchParams.get('next') && (
        <div className="mt-6 text-center">
          <p className="mb-2 text-gray-700">Don't have an account?</p>
          <Link
            href={`/register/client?next=${encodeURIComponent(searchParams.get('next'))}`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg shadow"
          >
            Register Here to Continue
          </Link>
        </div>
      )}
    </div>
  );
}
