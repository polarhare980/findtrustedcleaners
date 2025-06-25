'use client';

import Link from 'next/link';

export default function ResetSuccessPage() {
  return (
    <main className="min-h-screen bg-white text-gray-700 text-center px-6 py-20">
      <h1 className="text-3xl font-bold text-[#0D9488] mb-4">Password Reset Successful</h1>
      <p className="mb-6">Your password has been updated. You can now log in using your new credentials.</p>
      <Link
        href="/login"
        className="inline-block bg-[#0D9488] text-white px-6 py-3 rounded shadow hover:bg-teal-700"
      >
        Go to Login
      </Link>
    </main>
  );
}
