'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (!urlToken) {
      setMessage('Invalid or missing reset token.');
    } else {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    if (!token) {
      setMessage('Reset token is missing or invalid.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setMessage('Password successfully reset. Redirecting to login...');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        setMessage(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-700">
      <section className="max-w-md mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold text-[#0D9488] mb-6 text-center">Reset Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 border rounded"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-3 border rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#0D9488] text-white w-full py-3 rounded shadow hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? 'Updating password...' : 'Set New Password'}
          </button>
          {message && <p className="text-center text-sm text-green-600 mt-2">{message}</p>}
          <p className="text-center text-sm text-gray-500">
            Need a new link? <Link href="/forgot-password" className="text-[#0D9488] underline">Request another reset email</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
