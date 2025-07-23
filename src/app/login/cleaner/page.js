'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { secureFetch } from '@/lib/secureFetch';

export default function CleanerProfile() {
  const { id } = useParams();
  const router = useRouter();

  const [cleaner, setCleaner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        
const res = await secureFetch('/api/auth/me');
        const data = await res.json();
        if (!data.success || data.user._id !== id) {
          router.push('/login');
        } else {
          fetchCleaner();
        }
      } catch {
        router.push('/login');
      }
    };

    const fetchCleaner = async () => {
      try {
        const res = await fetch(`/api/cleaners/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCleaner(data);
      } catch (err) {
        setCleaner(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, router]);

  const updateAvailability = async (slot) => {
    if (!cleaner) return;
    const current = cleaner.availability?.[slot];
    const next = current === 'pending' ? true : current ? false : 'pending';
    const newAvailability = {
      ...cleaner.availability,
      [slot]: next,
    };

    setCleaner((prev) => ({ ...prev, availability: newAvailability }));

    setSaveStatus('Saving...');
    try {
      const res = await fetch(`/api/cleaners/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: newAvailability }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus('Saved ✅');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch {
      setSaveStatus('Failed to save ❌');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-[#0D9488] text-lg font-semibold">Loading...</p>
      </main>
    );
  }

  if (!cleaner) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-red-600 text-lg font-semibold">Cleaner not found.</p>
      </main>
    );
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 13 }, (_, i) => 7 + i);

  return (
    <>
      <Head>
        <title>{cleaner.realName}&#39;s Profile | Find Trusted Cleaners</title>
        <meta name="description" content="View and manage your cleaner profile." />
      </Head>

      <main className="min-h-screen bg-white text-gray-800">
        <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] text-white">
          <Link href="/">
            <Image src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" width={128} height={40} />
          </Link>
          <nav className="space-x-4 text-sm">
            <Link href="/cleaners" className="hover:text-gray-200">Find Cleaners</Link>
            <Link href="/" className="hover:text-gray-200">Home</Link>
          </nav>
        </header>

        <section className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center gap-6">
            <Image
              src="/default-avatar.png"
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border"
              width={128}
              height={128}
            />
            <div>
              <h1 className="text-3xl font-bold text-[#0D9488]">{cleaner.realName}</h1>
              <p className="text-gray-600">{cleaner.companyName}</p>
              <p className="text-gray-600">📍 {cleaner.postcode}</p>
              <p className="text-gray-600">📧 {cleaner.email}</p>
              <p className="text-gray-600">📞 {cleaner.phone}</p>
              <p className="text-gray-600">💷 {cleaner.rates}</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Services Offered</h2>
          <ul className="list-disc list-inside text-gray-700">
            {cleaner.services.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-2">Availability</h2>
          <p className="text-sm text-gray-500 mb-4">Click slots to toggle. Yellow = Pending, Green = Available, Red = Unavailable</p>
          <div className="overflow-auto">
            <div className="grid grid-cols-[auto_repeat(13,minmax(40px,1fr))] gap-px text-sm bg-gray-300">
              <div className="bg-white p-1 text-center font-bold">Day/Hour</div>
              {hours.map((h) => (
                <div key={h} className="bg-white p-1 text-center font-bold">{h}:00</div>
              ))}
              {days.map((d) => (
                <>
                  <div key={d} className="bg-white p-1 text-center font-medium">{d}</div>
                  {hours.map((h) => {
                    const key = `${d}-${h}`;
                    const value = cleaner.availability?.[key];
                    const status = value === 'pending' ? 'Pending' : value ? '✓' : '×';
                    const bg = value === 'pending' ? 'bg-yellow-400' : value ? 'bg-green-500' : 'bg-red-300';
                    return (
                      <button
                        key={key}
                        onClick={() => updateAvailability(key)}
                        className={`text-white text-xs p-1 ${bg}`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </>
              ))}
            </div>
            {saveStatus && <p className="mt-2 text-sm text-gray-600">{saveStatus}</p>}
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
