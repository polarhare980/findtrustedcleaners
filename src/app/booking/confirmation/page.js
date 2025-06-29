import Link from 'next/link';
import { motion } from 'framer-motion';

// ✅ SEO Meta Tags
export const metadata = {
  title: 'Booking Confirmed | FindTrustedCleaners',
  description: 'Your booking has been successfully submitted. View your dashboard or return home.',
  openGraph: {
    title: 'Booking Confirmed | FindTrustedCleaners',
    description: 'Your booking was successful. View your client dashboard or return to the homepage.',
    url: 'https://www.findtrustedcleaners.co.uk/booking-confirmation',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.co.uk/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Booking Confirmed - FindTrustedCleaners',
      },
    ],
    type: 'website',
  },
};

export default function BookingConfirmationPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl bg-white border shadow-lg rounded-lg p-8"
      >
        <h1 className="text-3xl font-bold text-teal-700 mb-4">Booking Confirmed 🎉</h1>
        <p className="text-lg text-gray-700 mb-6">
          Thank you! Your booking request has been sent successfully.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/clients/dashboard"
            className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg shadow hover:bg-teal-700 transition"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/"
            className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg shadow hover:bg-gray-300 transition"
          >
            Return Home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

