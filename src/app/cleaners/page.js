import CleanerSearchPageClient from './CleanerSearchPageClient';

export const metadata = {
  title: 'Find a Cleaner Near You | Find Trusted Cleaners',
  description:
    'Search for trusted local cleaners by postcode, service and radius. Compare cleaner profiles, availability, reviews and trust signals before you book.',
  alternates: {
    canonical: '/cleaners',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CleanersPage() {
  return <CleanerSearchPageClient />;
}
