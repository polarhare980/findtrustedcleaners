// ✅ This is a SERVER component by default (no 'use client' here)
import BookingConfirmationPageClient from './BookingConfirmationPageClient';

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
  return <BookingConfirmationPageClient />;
}
