import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Cookie Policy | FindTrustedCleaners',
  description: 'How FindTrustedCleaners uses cookies and similar technologies across the platform.',
  openGraph: {
    title: 'Cookie Policy | FindTrustedCleaners',
    description: 'How FindTrustedCleaners uses cookies and similar technologies.',
    url: 'https://www.findtrustedcleaners.com/cookie-policy',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Cookie Policy - FindTrustedCleaners',
      },
    ],
    type: 'website',
  },
};

const supportEmail = 'findtrustedcleaners@gmail.com';
const updatedAt = '12 April 2026';

export default function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Cookie policy"
      title="How cookies are used on FindTrustedCleaners"
      intro="This page explains how cookies and similar technologies may be used to keep the marketplace working properly, improve performance, remember preferences and understand how the site is used."
      updatedAt={updatedAt}
      sections={[
        {
          title: 'What cookies are',
          content: (
            <>
              <p>Cookies are small text files placed on your device when you visit a website. Some are essential for the site to function, while others help remember settings, improve performance or provide analytics.</p>
            </>
          ),
        },
        {
          title: 'How we use cookies',
          content: (
            <>
              <p>We may use cookies and similar technologies for core account and session handling, login state, security, performance, preference storage, booking flow continuity, and analytics about how visitors use the website.</p>
            </>
          ),
        },
        {
          title: 'Types of cookies we may use',
          content: (
            <>
              <p><strong>Essential cookies:</strong> needed for core site operation such as login state, security and request handling.</p>
              <p><strong>Preference cookies:</strong> used to remember helpful settings such as interface choices or user journey preferences.</p>
              <p><strong>Performance and analytics cookies:</strong> used to understand usage patterns and improve the platform.</p>
              <p><strong>Third-party service cookies:</strong> some integrated providers, such as payment or email-related services, may use their own cookies or similar technologies.</p>
            </>
          ),
        },
        {
          title: 'Managing cookies',
          content: (
            <>
              <p>You can usually manage cookies through your browser settings, including deleting existing cookies or blocking future ones. Blocking essential cookies may affect how parts of the website work.</p>
            </>
          ),
        },
        {
          title: 'Updates and contact',
          content: (
            <>
              <p>We may update this policy as the platform evolves or as our cookie use changes.</p>
              <p>If you have questions about cookies on the site, contact <a className="font-medium text-teal-700 underline underline-offset-4" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
            </>
          ),
        },
      ]}
    />
  );
}
