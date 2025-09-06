// ✅ No 'use client' here
import CleanerProfile from './CleanerProfile';

export const metadata = {
  title: 'Cleaner Profile | Find Trusted Cleaners',
  description: 'View the profile, services, and availability of trusted cleaners near you.',
};

export default function Page() {
  return <CleanerProfile />;
}
