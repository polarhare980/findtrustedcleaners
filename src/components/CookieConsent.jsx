'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');

    // If consent already given, initialise GA
    if (consent === 'accepted') {
      loadGoogleAnalytics();
    }

    // Show banner if no consent yet
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const loadGoogleAnalytics = () => {
    // Load Google Analytics script dynamically
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'; // 🔁 Replace with your GA4 ID
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      window.gtag = gtag;

      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX'); // 🔁 Replace with your GA4 ID
    };
  };

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShowBanner(false);
    loadGoogleAnalytics();
  };

  const rejectCookies = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setShowBanner(false);
    // Tracking will not load
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 flex flex-col md:flex-row items-center justify-between z-50 text-sm">
      <p className="mb-2 md:mb-0">
        We use cookies to improve your experience. Read our{' '}
        <Link href="/cookie-policy" className="underline text-teal-400">
          Cookie Policy
        </Link>.
      </p>
      <div className="flex space-x-2">
        <button onClick={acceptCookies} className="bg-teal-600 px-3 py-1 rounded hover:bg-teal-700">
          Accept
        </button>
        <button onClick={rejectCookies} className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700">
          Reject
        </button>
      </div>
    </div>
  );
}
