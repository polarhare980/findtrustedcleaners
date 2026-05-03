import PrivacyPolicyContent from './PrivacyPolicyContent';

export const metadata = {
  title: 'Privacy Policy | FindTrustedCleaners',
  description: 'Privacy Policy for FindTrustedCleaners. Learn how we collect, use, and protect your data.',
  keywords: 'Privacy, Data Policy, FindTrustedCleaners, GDPR, Cookies, Personal Information',
  openGraph: {
    title: 'Privacy Policy | FindTrustedCleaners',
    description: 'How we collect, use, and protect personal data at FindTrustedCleaners.',
    url: 'https://www.findtrustedcleaners.com/privacy-policy',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Privacy Policy - FindTrustedCleaners',
      },
    ],
    type: 'website',
  },
  alternates: {
    canonical: '/privacy-policy',
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}
