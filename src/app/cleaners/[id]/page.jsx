import { notFound, permanentRedirect } from 'next/navigation';
import CleanerProfile from './CleanerProfile';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

const SITE_URL = 'https://www.findtrustedcleaners.com';

function isObjectIdLike(value = '') {
  return /^[a-f\d]{24}$/i.test(String(value || ''));
}

function slugify(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function profileTitle(cleaner) {
  const name = cleaner?.companyName || cleaner?.realName || 'Cleaner';
  const service = cleaner?.servicesDetailed?.find((s) => s?.active)?.name || cleaner?.services?.[0] || 'Cleaning services';
  const location = cleaner?.address?.town || cleaner?.address?.county || cleaner?.address?.postcode || 'your area';
  return `${name} – ${service} in ${location}`;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const routeParam = decodeURIComponent(resolvedParams?.id || '');

  if (!isObjectIdLike(routeParam)) {
    return { robots: { index: false, follow: true } };
  }

  try {
    await connectToDatabase();
    const cleaner = await Cleaner.findById(routeParam).select('companyName realName services servicesDetailed address').lean();
    const title = profileTitle(cleaner);
    return {
      title: `${title} | Find Trusted Cleaners`,
      description: `View ${title}, including services, trust signals and live availability before you book.`,
      alternates: { canonical: `${SITE_URL}/cleaners/${routeParam}` },
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: 'Cleaner Profile | Find Trusted Cleaners',
      description: 'View the profile, services and availability of trusted cleaners near you.',
      alternates: { canonical: `${SITE_URL}/cleaners/${routeParam}` },
      robots: { index: true, follow: true },
    };
  }
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  const routeParam = decodeURIComponent(resolvedParams?.id || '');

  if (!isObjectIdLike(routeParam)) {
    const locationSlug = slugify(routeParam);
    if (!locationSlug) notFound();
    permanentRedirect(`/locations/${locationSlug}`);
  }

  return <CleanerProfile />;
}
