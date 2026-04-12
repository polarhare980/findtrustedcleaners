'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PremiumBenefits from '@/components/PremiumBenefits';
import { useState } from 'react';

export default function ContactFormComponent() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const SUPPORT_EMAIL = 'findtrustedcleaners@gmail.com';

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
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
      );

      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      setStatus('Your email app should now open with your message ready to send.');
      setForm({ name: '', email: '', message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 text-slate-800">
      <div className="absolute inset-0 -z-10">
        <img src="/background.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.14),transparent_40%),linear-gradient(180deg,rgba(248,250,252,0.92),rgba(240,253,250,0.84),rgba(248,250,252,0.96))]" />
      </div>

      <PublicHeader />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-white/60 bg-white/78 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Contact</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">Get in touch</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              Need help with a booking flow, cleaner profile, account issue or general question? Send a message and your email app will open with everything filled in.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-teal-100 bg-teal-50/75 p-5">
                <p className="text-sm font-semibold text-slate-900">Support email</p>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-2 block text-sm text-teal-700 underline underline-offset-4">
                  {SUPPORT_EMAIL}
                </a>
                <p className="mt-3 text-sm leading-6 text-slate-600">Best for account questions, profile updates and booking issues.</p>
              </div>
              <div className="rounded-[28px] border border-white/70 bg-white/78 p-5">
                <p className="text-sm font-semibold text-slate-900">Typical response time</p>
                <p className="mt-2 text-2xl font-semibold text-teal-700">Within 24 hours</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Clear messages with names, email addresses and page details are the quickest to resolve.</p>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(240,253,250,0.88))] p-5">
              <p className="text-sm font-semibold text-slate-900">Useful links</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link href="/faq" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-800">FAQ</Link>
                <Link href="/register/cleaners" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-800">Cleaner registration</Link>
                <Link href="/how-it-works" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-800">How it works</Link>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/60 bg-white/82 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-10">
            <h2 className="text-2xl font-semibold text-slate-900">Send a message</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">We will open your email app with the message ready to send.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">Your name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Your email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-700">Your message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="7"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us what you need help with"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(13,148,136,0.28)] transition ${
                  isSubmitting
                    ? 'cursor-not-allowed bg-slate-400 shadow-none'
                    : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:-translate-y-0.5 hover:from-teal-700 hover:to-teal-800'
                }`}
              >
                {isSubmitting ? 'Opening email app…' : 'Send message'}
              </button>

              {status ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {status}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </section>

      <PremiumBenefits />
      <PublicFooter />
    </main>
  );
}
