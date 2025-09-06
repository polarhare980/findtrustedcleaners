'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchClient } from '@/lib/fetchClient'; // ✅ shared helper

export default function ClientDashboard({ params }) {
  const { id } = params;
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClient = async () => {
      try {
        const user = await fetchClient(); // ✅ fetch from shared logic

        if (!user || user._id !== id) {
          throw new Error('Client not authorised');
        }

        setClient(user);
      } catch (err) {
        console.error(err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [id, router]);

  if (loading) return <p className="text-center p-10 text-gray-600">Loading your dashboard...</p>;
  if (!client) return null;

  return (
    <main className="min-h-screen bg-white text-gray-700">
      <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] text-white shadow">
        <Link href="/">
          <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
        </Link>
        <nav className="space-x-6 text-sm font-medium">
          <Link href="/cleaners">Find a Cleaner</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/faq">FAQs</Link>
          <Link href="/login">Logout</Link>
        </nav>
      </header>

      <section className="max-w-3xl mx-auto py-10 px-6">
        <h1 className="text-3xl font-bold text-[#0D9488] mb-4">Welcome, {client.fullName}</h1>
        <div className="space-y-4 bg-gray-50 p-6 rounded shadow">
          <div>
            <h2 className="font-semibold text-lg">Your Details</h2>
            <p><strong>Email:</strong> {client.email}</p>
            <p><strong>Phone:</strong> {client.phone}</p>
            <p><strong>Address:</strong> {client.address}</p>
            <p><strong>Postcode:</strong> {client.postcode}</p>
          </div>

          <div>
            <h2 className="font-semibold text-lg mt-6">Actions</h2>
            <Link
              href="/cleaners"
              className="inline-block mt-2 px-4 py-2 bg-[#0D9488] text-white rounded hover:bg-teal-700"
            >
              Find a Cleaner
            </Link>
            <Link
              href="/faq"
              className="ml-4 inline-block mt-2 px-4 py-2 border border-[#0D9488] text-[#0D9488] rounded hover:bg-gray-100"
            >
              FAQs
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#0D9488] border-t py-6 px-6 text-center text-sm text-white">
        <nav className="flex flex-wrap justify-center gap-4 mb-2">
          <Link href="/about">About Us</Link>
          <Link href="/terms">Terms & Conditions</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/faq">FAQs</Link>
          <Link href="/sitemap">Site Map</Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>
      </footer>
    </main>
  );
}
