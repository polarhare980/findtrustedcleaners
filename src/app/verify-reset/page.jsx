'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function VerifyResetPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('cleaner');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password, userType }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setMessage(data.message || 'Invalid or expired code.');
      }
    } catch (err) {
      setMessage('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-700 px-6 py-12 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center text-[#0D9488] mb-4">Reset Password</h1>
      <p className="text-center mb-6">Enter the code sent to your email and set a new password.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          className="w-full p-3 border rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          className="w-full p-3 border rounded"
          placeholder="Verification Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full p-3 border rounded"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={() => setUserType('cleaner')}
            className={`px-4 py-2 rounded border ${userType === 'cleaner' ? 'bg-[#0D9488] text-white' : 'text-[#0D9488] border-[#0D9488]'}`}
          >
            Cleaner
          </button>
          <button
            type="button"
            onClick={() => setUserType('client')}
            className={`px-4 py-2 rounded border ${userType === 'client' ? 'bg-[#0D9488] text-white' : 'text-[#0D9488] border-[#0D9488]'}`}
          >
            Client
          </button>
        </div>
        <button
          type="submit"
          className="w-full bg-[#0D9488] text-white py-3 rounded hover:bg-teal-700"
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      {success && (
        <p className="mt-4 text-green-600 text-sm text-center">
          ✅ Password updated. <Link href="/login" className="underline text-[#0D9488]">Log in</Link>
        </p>
      )}

      {message && <p className="mt-4 text-red-600 text-sm text-center">{message}</p>}
    </main>
  );
}
