// File: src/app/clients/[id]/page.jsx

import ClientDashboardComponent from './clients/Dashboard';

export const metadata = {
  title: 'Client Dashboard | Find Trusted Cleaners',
  description: 'View your client details and manage your profile on Find Trusted Cleaners.',
};

export default function Page() {
  return <ClientDashboardComponent />;
}
