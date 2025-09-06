'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';

function ClientRegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    houseNameNumber: '',
    street: '',
    county: '',
    postcode: '',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          houseNameNumber: form.houseNameNumber,
          street: form.street,
          county: form.county,
          postcode: form.postcode,
          password: form.password,
          userType: 'client',
        }),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();

        if (data.success) {
          const nextUrl = searchParams.get('next');
          if (nextUrl) {
            router.push(nextUrl);
          } else {
            router.push('/clients/dashboard');
          }
        } else {
          setMessage('Registration failed. Please try again.');
        }
      } else {
        const errorText = await res.text();
        console.error('API error:', errorText);
        setMessage('Failed to register. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative">
      <Head>
        <title>Register as a Client | Find Trusted Cleaners</title>
      </Head>

      {/* Background with gradient overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/background.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-teal-700/10"></div>
      </div>

      {/* Glass morphism header */}
      <header className="sticky top-0 z-50 backdrop-filter backdrop-blur-20 bg-white/25 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="transition-transform duration-300 hover:scale-105">
            <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
          </Link>
          <nav className="hidden md:flex space-x-6 text-sm font-medium">
            <Link 
              href="/cleaners" 
              className="text-teal-800 hover:text-teal-600 transition-colors duration-300 px-4 py-2 rounded-full hover:bg-white/20"
            >
              Find Cleaners
            </Link>
            <Link 
              href="/register/cleaners" 
              className="text-teal-800 hover:text-teal-600 transition-colors duration-300 px-4 py-2 rounded-full hover:bg-white/20"
            >
              Register Cleaner
            </Link>
            <Link 
              href="/login" 
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2 rounded-full hover:from-teal-700 hover:to-teal-800 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <section className="py-12 px-6">
        <div className="max-w-lg mx-auto">
          {/* Animated title */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4">
              Client Registration
            </h1>
            <p className="text-gray-700 text-lg">Join our trusted cleaning community</p>
          </div>

          {/* Glass morphism form card */}
          <div className="backdrop-filter backdrop-blur-20 bg-white/25 border border-white/20 rounded-3xl p-8 shadow-2xl animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-teal-800 mb-4">Personal Information</h3>
                
                <div className="relative group">
                  <input 
                    type="text" 
                    name="fullName" 
                    placeholder="Full Name" 
                    value={form.fullName} 
                    onChange={handleChange}
                    className="w-full p-4 bg-white/90 backdrop-filter backdrop-blur-10 border border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none transition-all duration-300 group-hover:shadow-md"
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="Email Address" 
                      value={form.email} 
                      onChange={handleChange}
                      className="w-full p-4 bg-white/90 backdrop-filter backdrop-blur-10 border border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none transition-all duration-300 group-hover:shadow-md"
                      required 
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      type="tel" 
                      name="phone" 
                      placeholder="Phone Number" 
                      value={form.phone} 
                      onChange={handleChange}
                      className="w-full p-4 bg-white/90 backdrop-filter backdrop-blur-10 border border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none transition-all duration-300 group-hover:shadow-md"
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-teal-800 mb-4">Address Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <input 
                      type="text" 
                      name="houseNameNumber" 
                      placeholder="House Name/Number" 
                      value={form.houseNameNumber} 
                      onChange={handleChange}
                      className="w-full p-4 bg-white/90 backdrop-filter backdrop-blur-10 border border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none transition-all duration-300 group-hover:shadow-md"
                      required 
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      type="text" 
                      name="street" 
                      placeholder="Street Address" 
                      value={form.street} 
                      onChange={handleChange}
                      className="w-full p-4 bg-white/90 backdrop-filter backdrop-blur-10 border border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none transition-all duration-300 group-hover:shadow-md"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <input 
                      type="text" 
                      name="county" 
                      placeholder="County" 
                      value={form.county} 
                      onChange={handleChange}
                      className="w-full p-4 bg-white/90 backdrop-filter backdrop-blur-10 border border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none transition-all duration-300 group-hover:shadow-md"
                      required 
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      type="text" 
                      name="postcode" 
                      placeholder="Postcode" 
                      value={form.postcode} 
                      onChange={handleChange}
                      className="w-full p-4 bg-white/90 backdrop-filter backdrop-blur-10 border border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none transition-all duration-300 group-hover:shadow-md"
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-teal-800 mb-4">Security</h3>
                
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    placeholder="Password" 
                    value={form.password} 
                    onChange={handleChange}
                    className="w-full p-4 pr-14 bg-white/90 backdrop-filter backdrop-blur-10 border border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none transition-all duration-300 group-hover:shadow-md"
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-teal-600 hover:text-teal-800 transition-colors duration-300 font-medium text-sm"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div className="relative group">
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    placeholder="Confirm Password" 
                    value={form.confirmPassword} 
                    onChange={handleChange}
                    className="w-full p-4 bg-white/90 backdrop-filter backdrop-blur-10 border border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none transition-all duration-300 group-hover:shadow-md"
                    required 
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start space-x-3 p-4 bg-white/20 rounded-xl">
                <input 
                  type="checkbox" 
                  required 
                  className="mt-1 w-5 h-5 text-teal-600 bg-transparent border-2 border-teal-600 rounded focus:ring-teal-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  I agree to the&nbsp;
                  <Link href="/terms" className="text-teal-600 hover:text-teal-800 underline font-medium">
                    Terms &amp; Conditions
                  </Link>&nbsp;and&nbsp;
                  <Link href="/privacy-policy" className="text-teal-600 hover:text-teal-800 underline font-medium">
                    Privacy Policy
                  </Link>.
                </span>
              </div>

              {/* Error message */}
              {message && (
                <div className="p-4 bg-red-50/80 backdrop-filter backdrop-blur-10 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 text-center font-medium">{message}</p>
                </div>
              )}

              {/* Submit button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold py-4 px-8 rounded-xl hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500/50 transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Login link */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  Already have an account?&nbsp;
                  <Link 
                    href="/login" 
                    className="text-teal-600 hover:text-teal-800 font-semibold underline transition-colors duration-300"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Glass morphism footer */}
      <footer className="backdrop-filter backdrop-blur-20 bg-white/25 border-t border-white/20 py-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto">
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
                className="text-teal-800 hover:text-teal-600 font-medium transition-colors duration-300 hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="text-center space-y-4">
            <p className="text-teal-800 font-semibold">
              &copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.
            </p>
            
            <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
              FindTrustedCleaners is committed to GDPR compliance. Read our&nbsp;
              <Link href="/privacy-policy" className="text-teal-600 hover:text-teal-800 underline font-medium">
                Privacy Policy
              </Link>&nbsp;and&nbsp;
              <Link href="/cookie-policy" className="text-teal-600 hover:text-teal-800 underline font-medium">
                Cookie Policy
              </Link>&nbsp;for details on how we protect your data. You may&nbsp;
              <Link href="/contact" className="text-teal-600 hover:text-teal-800 underline font-medium">
                contact us
              </Link>&nbsp;at any time to manage your personal information.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
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
        
        .backdrop-blur-20 {
          backdrop-filter: blur(20px);
        }
        
        .backdrop-blur-10 {
          backdrop-filter: blur(10px);
        }
      `}</style>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="backdrop-filter backdrop-blur-20 bg-white/25 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-3 border-teal-600/30 border-t-teal-600 rounded-full animate-spin"></div>
            <p className="text-teal-800 font-semibold text-lg">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ClientRegisterPage />
    </Suspense>
  );
}