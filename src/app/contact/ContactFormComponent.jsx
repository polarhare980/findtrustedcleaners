// File: src/app/contact/ContactFormComponent.jsx

'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ContactFormComponent() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setIsSubmitting(true);

    // simulate form sending - no backend setup yet
    setTimeout(() => {
      setStatus('Thanks for reaching out! We&apos;ll be in touch shortly.');
      setForm({ name: '', email: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <>
      {/* Background with gradient overlay */}
      <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 relative">
        
        {/* Glass Morphism Header */}
        <header className="sticky top-0 z-50 bg-white/25 backdrop-blur-[20px] border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            <Link href="/" className="transition-transform duration-300 hover:scale-105">
              <img src="/findtrusted-logo.png" alt="FindTrustedCleaners Logo" className="w-32 h-auto" />
            </Link>
            <nav className="hidden md:flex space-x-8 text-sm font-medium">
              {[
                { href: '/cleaners', label: 'Find a Cleaner' },
                { href: '/register/cleaners', label: 'List Yourself' },
                { href: '/how-it-works', label: 'How It Works' },
                { href: '/login', label: 'Login' },
                { href: '/about', label: 'About' }
              ].map((link, index) => (
                <Link 
                  key={index}
                  href={link.href}
                  className="text-teal-800 hover:text-teal-600 transition-all duration-300 hover:scale-105 font-semibold"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            {/* Mobile menu button */}
            <button className="md:hidden text-teal-800 hover:text-teal-600 transition-colors duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto p-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-[fadeIn_0.8s_ease-out]">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-6">
              💬 Contact Us
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Have a question or need help? Drop us a message and we&apos;ll get back to you within 24 hours.
            </p>
          </div>

          {/* Contact Form Card */}
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8 mb-8 animate-[slideUp_0.5s_ease-out]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-teal-800">
                  👤 Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full p-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all duration-300 text-gray-700 placeholder-gray-500"
                  required
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-teal-800">
                  📧 Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="w-full p-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all duration-300 text-gray-700 placeholder-gray-500"
                  required
                />
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-semibold text-teal-800">
                  💭 Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help you..."
                  rows="6"
                  className="w-full p-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all duration-300 text-gray-700 placeholder-gray-500 resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Send Message
                  </>
                )}
              </button>

              {/* Status Message */}
              {status && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl text-center font-medium animate-[slideUp_0.3s_ease-out]">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">✅</span>
                    <span>{status}</span>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Contact Information Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Email Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 text-center transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">
                📧
              </div>
              <h3 className="text-xl font-semibold text-teal-800 mb-2">Email Us</h3>
              <p className="text-gray-600 text-sm mb-3">Get in touch via email</p>
              <a 
                href="mailto:hello@findtrustedcleaners.co.uk" 
                className="text-teal-600 hover:text-teal-800 font-medium transition-colors duration-300"
              >
                hello@findtrustedcleaners.co.uk
              </a>
            </div>

            {/* Phone Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 text-center transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">
                📞
              </div>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">Call Us</h3>
              <p className="text-gray-600 text-sm mb-3">Mon-Fri, 9AM-6PM</p>
              <a 
                href="tel:+441234567890" 
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300"
              >
                +44 123 456 7890
              </a>
            </div>

            {/* Response Time Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 text-center transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">
                ⚡
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Quick Response</h3>
              <p className="text-gray-600 text-sm mb-3">We typically respond within</p>
              <span className="text-green-600 font-medium">24 hours</span>
            </div>
          </div>
        </main>
      </div>

      {/* Footer with Glass Morphism */}
      <footer className="bg-gradient-to-r from-teal-600 to-teal-700 text-white border-t border-teal-500/20 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-6 mb-6">
            {[
              { href: '/about', label: 'About Us' },
              { href: '/terms', label: 'Terms & Conditions' },
              { href: '/privacy-policy', label: 'Privacy Policy' },
              { href: '/cookie-policy', label: 'Cookie Policy' },
              { href: '/contact', label: 'Contact' },
              { href: '/faq', label: 'FAQs' },
              { href: '/sitemap', label: 'Site Map' }
            ].map((link, index) => (
              <Link 
                key={index}
                href={link.href}
                className="text-white/90 hover:text-white hover:scale-105 transition-all duration-300 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-white/90 mb-4 text-lg">
              &copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 max-w-4xl mx-auto">
              <p className="text-white/80 text-sm leading-relaxed">
                FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
                <Link href="/privacy-policy" className="text-white underline underline-offset-2 hover:text-teal-100 transition-colors duration-300">
                  Privacy Policy
                </Link>
                {' '}and{' '}
                <Link href="/cookie-policy" className="text-white underline underline-offset-2 hover:text-teal-100 transition-colors duration-300">
                  Cookie Policy
                </Link>
                {' '}for details on how we protect your data. You may{' '}
                <Link href="/contact" className="text-white underline underline-offset-2 hover:text-teal-100 transition-colors duration-300">
                  contact us
                </Link>
                {' '}at any time to manage your personal information.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}