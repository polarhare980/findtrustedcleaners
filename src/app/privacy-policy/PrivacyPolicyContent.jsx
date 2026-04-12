'use client';

import LegalPage from '@/components/LegalPage';

const supportEmail = 'findtrustedcleaners@gmail.com';
const updatedAt = '12 April 2026';

export default function PrivacyPolicyContent() {
  return (
    <LegalPage
      eyebrow="Privacy policy"
      title="How FindTrustedCleaners handles personal data"
      intro="This policy explains what information we collect, why we collect it, how it is used across the marketplace, and the choices available to clients, cleaners, and visitors."
      updatedAt={updatedAt}
      sections={[
        {
          title: 'Who this policy covers',
          content: (
            <>
              <p>This policy applies when you browse the website, create an account, create a cleaner profile, submit a booking request, make a payment, leave a review, contact us, or receive platform emails.</p>
              <p>FindTrustedCleaners operates as a marketplace platform. We process information needed to run cleaner profiles, bookings, approvals, reviews, support, fraud prevention, and core site administration.</p>
            </>
          ),
        },
        {
          title: 'What data we collect',
          content: (
            <>
              <p>Depending on how you use the platform, we may collect contact details such as name, email address, phone number, postcode, address details, account login information, booking details, selected time slots, profile content, review content, payment-related metadata, IP and device information, and support messages.</p>
              <p>Cleaner profiles may also include service areas, availability, business details, trust signals such as insurance or DBS status if supplied by the cleaner, profile images, gallery images, pricing, and review summaries.</p>
            </>
          ),
        },
        {
          title: 'How we use personal data',
          content: (
            <>
              <p>We use personal data to run accounts, show public cleaner profiles, process booking requests, notify clients and cleaners about approvals or updates, send review requests, maintain platform security, detect misuse, improve the service, and respond to support enquiries.</p>
              <p>Where relevant, we also use data to manage subscriptions or upgrades, handle refunds or disputes, maintain records, and comply with legal obligations.</p>
            </>
          ),
        },
        {
          title: 'Public profile and review information',
          content: (
            <>
              <p>Cleaner profile pages are designed to be public-facing. Information added by cleaners for profile display, including business name, postcode area, services, availability, profile images, gallery images, pricing and review summaries, may be visible to site visitors.</p>
              <p>Verified reviews submitted through the platform may also appear publicly on cleaner profiles. Review content may include rating, written feedback, service context, and selected highlights linked to a genuine booking.</p>
            </>
          ),
        },
        {
          title: 'Booking and payment data',
          content: (
            <>
              <p>When a client submits a booking request, we store the selected cleaner, service, date, time, and contact details needed to route the request correctly. We may share that booking information with the relevant cleaner so they can review and respond.</p>
              <p>Payment processing is handled through third-party providers. We do not store full card details on our own systems, but we may store transaction references, status information, subscription state, and related operational records.</p>
            </>
          ),
        },
        {
          title: 'Emails and service messages',
          content: (
            <>
              <p>We may send service emails relating to account access, password resets, booking requests, booking approvals, reminders, reviews, platform updates, and support replies. These emails are part of running the marketplace.</p>
              <p>If marketing emails are offered separately, you can opt out of those without affecting essential service emails.</p>
            </>
          ),
        },
        {
          title: 'Lawful bases',
          content: (
            <>
              <p>We rely on lawful bases including contract, legitimate interests, consent where required, and compliance with legal obligations. The basis used depends on the activity involved.</p>
            </>
          ),
        },
        {
          title: 'How long we keep data',
          content: (
            <>
              <p>We keep personal data only for as long as reasonably necessary for platform operation, support, record-keeping, dispute handling, fraud prevention, and legal or tax requirements. Retention periods may vary depending on the type of account or transaction.</p>
            </>
          ),
        },
        {
          title: 'Your rights',
          content: (
            <>
              <p>Depending on your circumstances, you may have rights to access, correct, erase, restrict, object to, or request transfer of your personal data. You may also have the right to withdraw consent where consent is the basis used.</p>
              <p>To make a data request, contact <a className="font-medium text-teal-700 underline underline-offset-4" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
            </>
          ),
        },
        {
          title: 'Contact and updates',
          content: (
            <>
              <p>If you have questions about this policy or the handling of your data, contact <a className="font-medium text-teal-700 underline underline-offset-4" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
              <p>We may update this policy as the platform changes. The latest version will always be published on this page.</p>
            </>
          ),
        },
      ]}
    />
  );
}
