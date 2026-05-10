import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Terms & Conditions | FindTrustedCleaners',
  description:
    'Terms and conditions for using the FindTrustedCleaners marketplace, including cleaner profiles, bookings, reviews, subscriptions and platform rules.',
  openGraph: {
    title: 'Terms & Conditions | FindTrustedCleaners',
    description:
      'Marketplace terms for clients, cleaners and visitors using FindTrustedCleaners.',
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
const updatedAt = '10 May 2026';

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms & conditions"
      title="Marketplace terms for clients, cleaners and visitors"
      intro="These terms explain how FindTrustedCleaners works, the responsibilities of clients and cleaners, and the rules that apply when using the platform, browsing listings, requesting bookings, posting reviews or upgrading accounts."
      updatedAt={updatedAt}
      sections={[
        {
          title: 'Using the platform',
          content: (
            <>
              <p>
                FindTrustedCleaners is an online marketplace that allows users
                to browse cleaner profiles, compare services and availability,
                and submit booking requests. By using the platform, you agree to
                use it lawfully and in accordance with these terms.
              </p>

              <p>
                References to “trusted” cleaners relate to marketplace features,
                profile information, customer reviews and trust signals
                displayed on the platform, and do not represent certification,
                endorsement, vetting, licensing or a guarantee of quality,
                conduct or safety.
              </p>
            </>
          ),
        },

        {
          title: 'Client responsibilities',
          content: (
            <>
              <p>
                Clients are responsible for providing accurate booking details,
                property access information, timings and instructions when using
                the platform.
              </p>

              <p>
                Clients must behave lawfully and respectfully towards cleaners
                and must not use the platform for fraudulent, abusive,
                discriminatory, threatening or unlawful purposes.
              </p>

              <p>
                Clients are responsible for confirming pricing, scope of work,
                timings, cancellations and service expectations directly with
                the cleaner before work takes place.
              </p>
            </>
          ),
        },

        {
          title: 'Cleaner responsibilities',
          content: (
            <>
              <p>
                Cleaners are responsible for ensuring all profile information is
                accurate, current and not misleading, including services,
                pricing, availability, qualifications, images, insurance
                claims, DBS claims, trust signals and contact information.
              </p>

              <p>
                Cleaners must operate lawfully, maintain professional conduct
                and ensure they hold any insurance, licences, permissions or
                legal compliance required for the services they provide.
              </p>

              <p>
                Where cleaners upload insurance, DBS or trust-related
                information, the cleaner is solely responsible for ensuring such
                information remains valid, current and accurate at all times.
              </p>

              <p>
                Cleaners must not submit false information, manipulate reviews,
                impersonate others, misuse customer information, or attempt to
                mislead users of the platform.
              </p>
            </>
          ),
        },

        {
          title: 'Accounts and profile accuracy',
          content: (
            <>
              <p>
                Users must provide accurate and up-to-date information when
                registering or updating an account.
              </p>

              <p>
                We may suspend, restrict, refuse or remove accounts, listings,
                reviews or content where we reasonably believe there is misuse
                of the platform, misleading information, fraud risk, spam,
                abusive conduct, unlawful activity or breach of these terms.
              </p>
            </>
          ),
        },

        {
          title: 'Account security and eligibility',
          content: (
            <>
              <p>
                Users must be at least 18 years old to create an account,
                submit bookings, offer services or use paid features on the
                platform.
              </p>

              <p>
                Users are responsible for maintaining the confidentiality and
                security of their account credentials and for all activity
                carried out through their account.
              </p>

              <p>
                You must notify us promptly if you believe your account has been
                accessed without permission or used fraudulently.
              </p>
            </>
          ),
        },

        {
          title: 'Cleaner listings and visibility',
          content: (
            <>
              <p>
                Cleaner profiles may appear publicly across the platform,
                including homepage sections, search results, service pages,
                location pages and cleaner profile pages.
              </p>

              <p>
                Premium placement, subscriptions or upgraded visibility may
                affect how and where listings appear, but do not guarantee
                work, ranking position, customer enquiries, booking volume or
                business results.
              </p>
            </>
          ),
        },

        {
          title: 'Booking requests and scheduling',
          content: (
            <>
              <p>
                Booking requests submitted through the platform are requests
                only and are not confirmed until accepted by the cleaner or
                marked as approved through the booking flow.
              </p>

              <p>
                Availability shown on the platform is intended as a scheduling
                aid only and may change without notice. Slots may become
                unavailable, be declined or be modified after submission.
              </p>
            </>
          ),
        },

        {
          title: 'Payments, subscriptions and fees',
          content: (
            <>
              <p>
                Certain platform features may involve payment, including
                cleaner upgrades, subscriptions or booking-related
                functionality. Charges displayed at checkout form part of the
                agreement for that transaction.
              </p>

              <p>
                Third-party payment providers may be used to securely process
                payments. We do not store full payment card details directly on
                our servers.
              </p>

              <p>
                Unless expressly stated otherwise, payments made to the
                platform relate to access to marketplace features and
                visibility, and do not guarantee earnings, leads, ranking
                positions or customer bookings.
              </p>
            </>
          ),
        },

        {
          title: 'Reviews and user content',
          content: (
            <>
              <p>
                Reviews and user-generated content must be genuine, lawful and
                relevant to a real customer experience.
              </p>

              <p>
                We may moderate, refuse, edit or remove reviews or other
                content that appears false, misleading, abusive, defamatory,
                unlawful, promotional, spam-related or otherwise unsuitable for
                the platform.
              </p>

              <p>
                By submitting content, you confirm you have the legal right to
                submit it and grant us permission to display, reproduce and use
                it in connection with operating and promoting the platform.
              </p>
            </>
          ),
        },

        {
          title: 'Independent contractor relationship',
          content: (
            <>
              <p>
                FindTrustedCleaners is a marketplace platform only. Cleaners
                are independent businesses or individuals and are not employees,
                workers, representatives, partners or agents of
                FindTrustedCleaners.
              </p>

              <p>
                Any agreement regarding pricing, timings, property access,
                instructions, cancellations, disputes or performance of
                cleaning services is made directly between the client and the
                cleaner.
              </p>
            </>
          ),
        },

        {
          title: 'Safety, verification and trust disclaimer',
          content: (
            <>
              <p>
                While we may provide profile features, trust indicators,
                moderation tools or reporting systems, we do not guarantee the
                identity, conduct, honesty, qualifications, insurance status,
                licensing, suitability or safety of any cleaner or client using
                the platform.
              </p>

              <p>
                Users are responsible for carrying out their own judgement,
                checks and decisions before arranging services, allowing
                property access or entering into agreements with other users.
              </p>
            </>
          ),
        },

        {
          title: 'Fraud, manipulation and platform abuse',
          content: (
            <>
              <p>
                Users must not manipulate or misuse the platform, including
                through fake bookings, fake reviews, impersonation, misleading
                claims, fraudulent chargebacks, spam activity, scraping,
                unlawful data collection or attempts to interfere with platform
                systems.
              </p>

              <p>
                Users must not attempt to bypass platform processes in a way
                that harms the marketplace, other users or the integrity of
                reviews, rankings, trust signals or booking systems.
              </p>

              <p>
                We reserve the right to suspend, restrict or permanently remove
                accounts where we reasonably suspect fraud, manipulation,
                abusive conduct or misuse of the platform.
              </p>
            </>
          ),
        },

        {
          title: 'Acceptable use',
          content: (
            <>
              <p>
                Users must not misuse the platform, interfere with site
                operation, scrape data unlawfully, attempt unauthorised access,
                upload malicious material, submit fraudulent bookings,
                manipulate reviews or use the service in a way that harms other
                users or the platform.
              </p>
            </>
          ),
        },

        {
          title: 'Indemnity',
          content: (
            <>
              <p>
                You agree to indemnify and hold harmless
                FindTrustedCleaners, its operators, affiliates and service
                providers from claims, liabilities, damages, losses, costs or
                expenses arising from your misuse of the platform, breach of
                these terms, violation of applicable law or disputes with other
                users.
              </p>
            </>
          ),
        },

        {
          title: 'Limitation of liability',
          content: (
            <>
              <p>
                To the fullest extent permitted by law,
                FindTrustedCleaners is not liable for the acts, omissions,
                conduct, negligence, services or behaviour of cleaners,
                clients or other third parties using the platform.
              </p>

              <p>
                This includes, without limitation, liability relating to
                property damage, theft, injury, disputes, missed appointments,
                inaccurate listings, misleading information, loss of earnings,
                service dissatisfaction, unlawful conduct or failed bookings.
              </p>

              <p>
                We do not guarantee uninterrupted platform availability,
                uninterrupted messaging, error-free operation or continuous
                access to any feature or listing.
              </p>

              <p>
                To the extent permitted by law, our liability is limited to
                losses that are reasonably foreseeable and directly caused by
                our own breach of these terms.
              </p>
            </>
          ),
        },

        {
          title: 'Changes to these terms',
          content: (
            <>
              <p>
                We may update these terms from time to time as the platform,
                services or legal requirements change. Continued use of the
                platform after updated terms are published means the revised
                terms apply.
              </p>
            </>
          ),
        },

        {
          title: 'Governing law',
          content: (
            <>
              <p>
                These terms and any disputes relating to the platform or its
                use are governed by the laws of England and Wales.
              </p>

              <p>
                Users agree that the courts of England and Wales will have
                jurisdiction over disputes arising in connection with these
                terms or use of the platform.
              </p>
            </>
          ),
        },

        {
          title: 'Contact',
          content: (
            <>
              <p>
                Questions about these terms can be sent to{' '}
                <a
                  className="font-medium text-teal-700 underline underline-offset-4"
                  href={`mailto:${supportEmail}`}
                >
                  {supportEmail}
                </a>.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}