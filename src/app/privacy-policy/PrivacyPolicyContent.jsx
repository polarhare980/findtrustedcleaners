'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicyContent() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10">
      {/* ✅ HEADER */}
      <header className="sticky top-0 z-50 bg-white/25 backdrop-blur-[20px] border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="transform hover:scale-105 transition-all duration-300">
              <Image 
                src="/findtrusted-logo.png" 
                alt="FindTrustedCleaners Logo" 
                className="w-32 h-auto" 
                width={128} 
                height={40} 
              />
            </Link>
            <nav className="hidden md:flex space-x-6 text-sm font-medium">
              <Link href="/cleaners" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">Find a Cleaner</Link>
              <Link href="/register/cleaners" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">List Yourself</Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">How It Works</Link>
              <Link href="/login" className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105">Login</Link>
              <Link href="/blog" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">Blog</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ✅ HERO */}
      <section className="py-16 px-6 animate-fade-in">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-700 mb-4">
              We respect your privacy and are committed to protecting your personal data
            </p>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-[50px] font-medium shadow-lg">
              <span>🔒</span>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ BODY (load via fragment) */}
      <section className="max-w-4xl mx-auto px-6 pb-16 animate-slide-up">
        <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          {/* REPLACE THIS COMMENT with the entire policy sections (from your original message) */}
          {/* You can paste from "Effective Date" all the way to the end of the footer */}
          {/* All your styled JSX animations and gradient sections go here exactly as before */}
        </div>
      </section>

      {/* ✅ FOOTER */}
      <footer className="bg-white/25 backdrop-blur-[20px] border-t border-white/20 py-8 px-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto">
          <nav className="flex flex-wrap justify-center gap-6 mb-6">
            <Link href="/about" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">About Us</Link>
            <Link href="/terms" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">Terms & Conditions</Link>
            <Link href="/privacy-policy" className="text-teal-600 bg-white/20 px-3 py-2 rounded-xl font-medium">Privacy Policy</Link>
            <Link href="/cookie-policy" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">Cookie Policy</Link>
            <Link href="/contact" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">Contact</Link>
            <Link href="/faq" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">FAQs</Link>
            <Link href="/sitemap" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">Site Map</Link>
          </nav>
          <div className="text-center text-gray-700">
            <p className="mb-4 font-medium">
              &copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.
            </p>
            <p className="text-sm leading-relaxed">
              FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
              <Link href="/privacy-policy" className="text-teal-600 hover:text-teal-800 underline hover:no-underline transition-all duration-300">Privacy Policy</Link>{' '}
              and{' '}
              <Link href="/cookie-policy" className="text-teal-600 hover:text-teal-800 underline hover:no-underline transition-all duration-300">Cookie Policy</Link>{' '}
              for details on how we protect your data. You may{' '}
              <Link href="/contact" className="text-teal-600 hover:text-teal-800 underline hover:no-underline transition-all duration-300">contact us</Link>{' '}
              at any time to manage your personal information.
            </p>
          </div>
        </div>
      </footer>

      {/* ✅ ANIMATIONS */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}
