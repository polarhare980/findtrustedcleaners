// src/app/clients/[id]/page.jsx
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Client Dashboard | Find Trusted Cleaners',
  description: 'View your client details and manage your profile on Find Trusted Cleaners.',
};

export default function ClientIdPage() {
  // If you don’t need a per-ID view yet, send everyone to the dashboard page.
  redirect('/clients/dashboard');
  return null;
}
