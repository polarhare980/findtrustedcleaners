// src/app/page.js  (SERVER COMPONENT)
export const metadata = {
  title: 'Find Trusted Cleaners — UK Local Cleaners',
  description: 'Browse trusted cleaner profiles and book online. Transparent pricing and verified reviews.',
};

import HomeClient from '@/components/HomeClient';

export default function Page() {
  return <HomeClient />;
}
