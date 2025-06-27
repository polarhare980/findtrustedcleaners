'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';

function ClientRegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    postcode: '',
    phone: ''
  });

  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json' },
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
        setMessage(data.message || 'Something went wrong.'); // ✅ Updated here
      }
    } catch (err) {
      console.error('Registration error:', err);
      setMessage('An error occurred during registration.');
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-700 relative">
      <Head>
        <title>Register as a Client | FindTrustedCleaners</title>
      </Head>

      <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] bg-opacity-90 text-white">
        <Link href="/">
          <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
        </Link>
        <nav className="space-x-4 text-sm">
          <Link href="/cleaners" className="hover:text-gray-200">Find Cleaners</Link>
          <Link href="/register/cleaners" className="hover:text-gray-200">Register Cleaner</Link>
          <Link href="/login" className="hover:text-gray-200">Login</Link>
        </nav>
      </header>

      <img
        src="/background.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover -z-10 opacity-30"
      />

      <section className="p-6 max-w-xl mx-auto relative z-10">
        <h1 className="text-3xl font-bold text-[#0D9488] mb-4 text-center">Client Registration</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow-md">
          <input type="text" name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} className="w-full p-2 border rounded bg-white" required />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full p-2 border rounded bg-white" required />

          <div className="relative">
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={form.password} onChange={handleChange} className="w-full p-2 border rounded bg-white" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-2 text-sm text-teal-700 transform -translate-y-1/2">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <input type="password" name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} className="w-full p-2 border rounded bg-white" required />
          <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} className="w-full p-2 border rounded bg-white" />
          <input type="text" name="postcode" placeholder="Postcode" value={form.postcode} onChange={handleChange} className="w-full p-2 border rounded bg-white" />
          <input type="tel" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} className="w-full p-2 border rounded bg-white" />

          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" required className="accent-teal-700" />
            <span>
              I agree to the&nbsp;
              <Link href="/terms" className="underline text-teal-700">Terms &amp; Conditions</Link>&nbsp;and&nbsp;
              <Link href="/privacy-policy" className="underline text-teal-700">Privacy Policy</Link>.
            </span>
          </label>

          {message && <p className="text-sm text-center text-red-600">{message}</p>}

          <button type="submit" className="bg-[#0D9488] text-white px-4 py-2 rounded w-full hover:bg-teal-700">
            Register
          </button>
        </form>
      </section>

      <footer className="bg-[#0D9488] text-white border-t py-6 px-6 text-center text-sm">
        <nav className="flex flex-wrap justify-center gap-4 mb-2">
          <Link href="/about">About Us</Link>
          <Link href="/terms">Terms &amp; Conditions</Link>
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

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-teal-700">Loading...</p>}>
      <ClientRegisterPage />
    </Suspense>
  );
}
