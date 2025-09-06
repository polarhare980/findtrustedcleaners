// File: src/app/faq/page.js

import FAQComponent from './FAQComponent';

export const metadata = {
  title: 'Frequently Asked Questions | FindTrustedCleaners',
  description: 'Get answers to the most common questions about FindTrustedCleaners, including booking, pricing, availability, and account management.',
  openGraph: {
    title: 'Frequently Asked Questions | FindTrustedCleaners',
    description: 'Answers to the most common questions about FindTrustedCleaners, including how to book, list yourself, manage availability, and more.',
    url: 'https://www.findtrustedcleaners.co.uk/faq',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.co.uk/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Frequently Asked Questions - FindTrustedCleaners',
      },
    ],
    type: 'website',
  },
};

export default function Page() {
  return <FAQComponent />;
}

