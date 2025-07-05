'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false); // ✅ SSR Protection
  const [cleaner, setCleaner] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ SSR-safe Client Check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clientId = localStorage.getItem('clientId');
      if (!clientId) {
        router.push(`/login/clients?next=/cleaners/${id}/checkout`);
      }
      setMounted(true);
    }
  }, [id, router]);

  useEffect(() => {
    const fetchCleaner = async () => {
      try {
        const res = await fetch(`/api/public-cleaners/${id}`);
        const data = await res.json();
        setCleaner(data);
      } catch (err) {
        console.error('Error fetching cleaner:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCleaner();
  }, [id]);

  // ✅ Prevent SSR build errors
  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 relative">
        <div className="absolute inset-0 bg-[url('/cleaning-bg.jpg')] bg-cover bg-center opacity-10"></div>
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-teal-700 font-semibold">Loading checkout...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cleaner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 relative">
        <div className="absolute inset-0 bg-[url('/cleaning-bg.jpg')] bg-cover bg-center opacity-10"></div>
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-semibold">Cleaner not found</p>
            <Link href="/cleaners" className="mt-4 inline-block px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300">
              Browse Cleaners
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 relative">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-[url('/cleaning-bg.jpg')] bg-cover bg-center opacity-10"></div>
      
      {/* Glass morphism header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/25 border-b border-white/20">
        <div className="max-w-5xl mx-auto p-6">
          <Link href={`/cleaners/${cleaner._id}`} className="text-teal-600 hover:text-teal-700 transition-colors duration-300 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 py-12 relative z-10">
        {/* Hero Section */}
        <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 mb-8 shadow-xl animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 4H2m5 9v6a2 2 0 002 2h8a2 2 0 002-2v-6m-4-2v-2a2 2 0 00-2-2h-2a2 2 0 00-2 2v2" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
              Secure Checkout
            </h1>
          </div>
          <p className="text-gray-700 text-lg">
            You're just one step away from booking your trusted cleaner. Review the details below and complete your booking.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Cleaner Profile Card */}
          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-teal-800">Your Selected Cleaner</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 mb-6">
              <div className="flex-shrink-0">
                {cleaner.image ? (
                  <img 
                    src={cleaner.image} 
                    alt={cleaner.realName} 
                    className="w-32 h-32 object-cover rounded-full border-4 border-white/50 shadow-lg hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-teal-800 mb-2">{cleaner.realName}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-gray-700"><strong>Company:</strong> {cleaner.companyName || 'Independent Cleaner'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700"><strong>Postcode:</strong> {cleaner.postcode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-gray-700"><strong>Hourly Rate:</strong> <span className="text-2xl font-bold text-teal-700">£{cleaner.rates}</span></span>
                  </div>
                </div>
                <Link
                  href={`/cleaners/${cleaner._id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-sm hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Full Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-teal-800">Secure Payment</h3>
            </div>

            <div className="space-y-6">
              {/* Payment Info */}
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-teal-800">Payment Information</h4>
                </div>
                <p className="text-gray-700 mb-4">
                  Complete your booking with our secure payment system. We accept all major credit cards and PayPal.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {['💳', '🏦', '📱', '🔒'].map((icon, idx) => (
                    <div key={idx} className="bg-white/50 rounded-lg p-3 text-center text-xl">{icon}</div>
                  ))}
                </div>
              </div>

              {/* Placeholder Payment Form */}
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <p className="text-gray-600 mb-4 text-center">
                  🔧 Payment integration coming soon!
                </p>
                <p className="text-sm text-gray-500 text-center mb-4">
                  This is where your secure payment form will appear (Stripe, PayPal, etc.)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/booking/confirmation')}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Complete Booking
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full font-semibold hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-6 mt-8 shadow-xl text-center animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-teal-800">🔒 Your booking is secure</h4>
              <p className="text-gray-600">SSL encrypted • GDPR compliant • Trusted by thousands</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}