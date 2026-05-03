import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Terms & Conditions | FindTrustedCleaners',
  description: 'Terms and conditions for using the FindTrustedCleaners marketplace, including cleaner profiles, bookings, reviews and platform rules.',
  openGraph: {
    title: 'Terms & Conditions | FindTrustedCleaners',
    description: 'Terms and conditions for using the FindTrustedCleaners marketplace.',
    url: 'https://www.findtrustedcleaners.com/terms',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Terms & Conditions - FindTrustedCleaners',
      },
    ],
    type: 'website',
  },
  alternates: {
    canonical: '/terms',
  },
  robots: { index: true, follow: true },
};

const supportEmail = 'findtrustedcleaners@gmail.com';
const updatedAt = '12 April 2026';

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms & conditions"
      title="Marketplace terms for clients, cleaners and visitors"
      intro="These terms explain how FindTrustedCleaners works, what users can expect from the platform, and the rules that apply when browsing, registering, booking, reviewing or upgrading an account."
      updatedAt={updatedAt}
      sections={[
        {
          title: 'Using the platform',
          content: (
            <>
              <p>FindTrustedCleaners is a marketplace that allows visitors to browse cleaner profiles, compare services and availability, and send booking requests. By using the platform, you agree to use it lawfully and in line with these terms.</p>
            </>
          ),
        },
        {
          title: 'Accounts and profile information',
          content: (
            <>
              <p>Clients and cleaners must provide accurate, current information when registering or updating an account. Cleaners are responsible for the accuracy of public profile content including services, pricing, availability, trust signals, images and contact information.</p>
              <p>We may suspend, restrict or remove accounts or content where there is misuse, misleading information, spam, fraud risk, abuse, or breach of these terms.</p>
            </>
          ),
        },
        {
          title: 'Cleaner listings and visibility',
          content: (
            <>
              <p>Cleaner profiles may be displayed publicly across the site, including search, homepage sections, local areas, service-based sections and profile pages. Premium placement or upgraded visibility may affect where a cleaner appears, but does not guarantee work, ranking position or booking volume.</p>
            </>
          ),
        },
        {
          title: 'Booking requests and approvals',
          content: (
            <>
              <p>Clients can submit booking requests through the platform. A request is not confirmed until the cleaner accepts it or the platform marks it as approved through the live booking flow.</p>
              <p>Availability shown on the site is intended to help with matching and scheduling, but there may still be occasions where a slot changes, becomes unavailable, or is declined.</p>
            </>
          ),
        },
        {
          title: 'Payments, upgrades and fees',
          content: (
            <>
              <p>Some features may involve payment, such as cleaner upgrades or booking-related flows. Any charges shown at checkout form part of the agreement for that transaction. Third-party processors may be used to collect and handle payments securely.</p>
              <p>Unless stated otherwise, platform fees relate to use of the marketplace and not to a guarantee of earnings, lead volume, ranking position or business results.</p>
            </>
          ),
        },
        {
          title: 'Reviews and user content',
          content: (
            <>
              <p>Platform reviews are intended to reflect genuine customer experiences. We may moderate, remove or refuse reviews or other content that appears false, abusive, defamatory, irrelevant, promotional, misleading, unlawful or otherwise unsuitable for publication.</p>
              <p>By submitting content, you confirm you have the right to submit it and give us permission to display it in connection with the platform.</p>
            </>
          ),
        },
        {
          title: 'Contact between clients and cleaners',
          content: (
            <>
              <p>Clients and cleaners are responsible for the agreement between them regarding access, property, instructions, timings, pricing, cancellations, and performance of the cleaning service itself. FindTrustedCleaners is not the employer of cleaners listed on the platform.</p>
            </>
          ),
        },
        {
          title: 'Acceptable use',
          content: (
            <>
              <p>You must not misuse the platform, attempt unauthorised access, submit fraudulent bookings, scrape data unlawfully, interfere with site operation, upload harmful material, or use the service in a way that damages other users or the platform.</p>
            </>
          ),
        },
        {
          title: 'Liability and platform role',
          content: (
            <>
              <p>We aim to provide a useful and reliable marketplace, but we do not guarantee uninterrupted availability, uninterrupted messaging, error-free data, cleaner performance, or client conduct. To the fullest extent allowed by law, our liability is limited to losses that are reasonably foreseeable and directly caused by our breach.</p>
            </>
          ),
        },
        {
          title: 'Changes and contact',
          content: (
            <>
              <p>We may update these terms from time to time as the platform develops. Continued use of the website after changes are published means the updated terms apply.</p>
              <p>Questions about these terms can be sent to <a className="font-medium text-teal-700 underline underline-offset-4" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
            </>
          ),
        },
      ]}
    />
  );
}
