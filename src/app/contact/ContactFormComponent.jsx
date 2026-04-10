'use client';

import Link from 'next/link';
import { useState } from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';

export default function ContactFormComponent() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const SUPPORT_EMAIL = 'Findtrustedcleaners@gmail.com';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setIsSubmitting(true);

    try {
      const subject = encodeURIComponent(`Support request from ${form.name}`);
      const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`);
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      setStatus('Your email app should now open with your message ready to send.');
      setForm({ name: '', email: '', message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="site-shell">
      <PublicHeader ctaHref="/login" ctaLabel="Login" />
      <PageHero
        eyebrow="Get in touch"
        title="Contact the FindTrustedCleaners team"
        description="Have a question or need help? Send us a message and your email app will open with the details ready to go."
      />

      <section className="section-shell pb-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="surface-card p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">Your name</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} className="input" required />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Your email</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="input" required />
              </div>
              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-semibold text-slate-700">Your message</label>
                <textarea id="message" name="message" value={form.message} onChange={handleChange} rows="7" className="input min-h-40 resize-y" required />
              </div>
              <button type="submit" disabled={isSubmitting} className="brand-button w-full">
                {isSubmitting ? 'Preparing your message...' : 'Send message'}
              </button>
              {status ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">{status}</div> : null}
            </form>
          </div>

          <div className="space-y-6">
            <div className="surface-card p-8">
              <h2 className="text-2xl font-semibold text-slate-900">Support email</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">For support, account queries, or general questions, email us directly.</p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-5 inline-block text-lg font-semibold text-teal-700 hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </div>
            <div className="surface-card p-8">
              <h2 className="text-2xl font-semibold text-slate-900">Response time</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">We aim to reply within 24 hours wherever possible.</p>
              <div className="mt-5">
                <Link href="/faq" className="brand-button-secondary">View common questions</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
