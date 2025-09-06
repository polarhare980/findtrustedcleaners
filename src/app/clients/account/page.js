'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { fetchClient } from '@/lib/fetchClient'; // ✅ Use shared helper

export default function ClientAccountPage() {
  const [client, setClient] = useState(null);

  useEffect(() => {
    const loadClient = async () => {
      const user = await fetchClient();

      if (!user || user.type !== 'client') {
        window.location.href = '/login';
      } else {
        setClient(user);
      }
    };

    loadClient();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 text-[#0D9488]">
      <Head>
        <title>Client Account | Find Trusted Cleaners</title>
        <meta name="description" content="Manage your profile and access cleaner contact info on Find Trusted Cleaners." />
      </Head>

      <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] bg-opacity-90 text-white">
        <Link href="/">
          <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
        </Link>
        <nav className="space-x-4 text-sm">
          <Link href="/cleaners" className="hover:text-gray-200">Find Cleaners</Link>
          <Link href="/logout" className="hover:text-gray-200">Logout</Link>
        </nav>
      </header>

      <section className="max-w-2xl mx-auto p-6 mt-6 bg-white shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4">Welcome{client?.fullName ? `, ${client.fullName}` : ''}</h1>

        {client ? (
          <div className="space-y-2">
            <p><strong>Email:</strong> {client.email}</p>
            <p><strong>Phone:</strong> {client.phone}</p>
            <p><strong>Address:</strong> {client.address?.houseNameNumber} {client.address?.street}, {client.address?.county}</p>
            <p><strong>Postcode:</strong> {client.address?.postcode}</p>
            <p className="text-sm text-gray-500">To update details, please contact support or re-register.</p>
          </div>
        ) : (
          <p>Loading your account...</p>
        )}
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
