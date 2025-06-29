'use client';

import Link from 'next/link';
import { useState } from 'react';

// ✅ SEO Meta Tags
export const metadata = {
  title: 'Contact Us | FindTrustedCleaners',
  description: 'Contact the FindTrustedCleaners team for help, questions, or support.',
  openGraph: {
    title: 'Contact Us | FindTrustedCleaners',
    description: 'Reach out to FindTrustedCleaners for help, support, or questions about our platform.',
    url: 'https://www.findtrustedcleaners.co.uk/contact',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.co.uk/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact FindTrustedCleaners',
      },
    ],
    type: 'website',
  },
};

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');

    // simulate form sending - no backend setup yet
    setTimeout(() => {
      setStatus('Thanks for reaching out! We’ll be in touch shortly.');
      setForm({ name: '', email: '', message: '' });
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-white text-gray-700">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] text-white shadow">
        <Link href="/">
          <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
        </Link>
        <nav className="space-x-6 text-sm font-medium">
          <Link href="/cleaners">Find a Cleaner</Link>
          <Link href="/register/cleaners">List Yourself</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/login">Login</Link>
          <Link href="/about">About</Link>
        </nav>
      </header>

      {/* Contact Form */}
      <section className="max-w-2xl mx-auto p-6 py-12">
        <h1 className="text-3xl font-bold text-[#0D9488] mb-6 text-center">Contact Us</h1>
        <p className="text-center text-gray-600 mb-6">Have a question or need help? Drop us a message and we’ll get back to you.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your Name"
            className="w-full p-3 border border-gray-300 rounded"
            required
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Your Email"
            className="w-full p-3 border border-gray-300 rounded"
            required
          />
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Your Message"
            rows="5"
            className="w-full p-3 border border-gray-300 rounded"
            required
          />
          <button type="submit" className="bg-[#0D9488] text-white px-6 py-3 rounded shadow hover:bg-teal-700 w-full">
            Send Message
          </button>
          {status && <p className="text-center text-sm text-green-600 mt-2">{status}</p>}
        </form>
      </section>

      {/* Footer */}
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
