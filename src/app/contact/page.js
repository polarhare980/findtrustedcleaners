// File: src/app/contact/page.js

import ContactFormComponent from './ContactFormComponent';

export const metadata = {
  title: 'Contact Us | FindTrustedCleaners',
  description: 'Contact the FindTrustedCleaners team for help, questions, or support.',
  openGraph: {
    title: 'Contact Us | FindTrustedCleaners',
    description: 'Reach out to FindTrustedCleaners for help, support, or questions about our platform.',
    url: 'https://www.findtrustedcleaners.co.uk/contact',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.co.uk/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact FindTrustedCleaners',
      },
    ],
    type: 'website',
  },
};

export default function Page() {
  return <ContactFormComponent />;
}
