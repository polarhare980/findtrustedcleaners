import { notFound, permanentRedirect } from 'next/navigation';
import CleanerProfile from './CleanerProfile';

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

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const routeParam = decodeURIComponent(resolvedParams?.id || '');

  if (!isObjectIdLike(routeParam)) {
    const locationSlug = slugify(routeParam);
    return {
      title: 'Redirecting… | Find Trusted Cleaners',
      description: locationSlug ? `Redirecting to /locations/${locationSlug}.` : 'Redirecting to locations.',
      robots: 'noindex,follow',
    };
  }

  return {
    title: 'Cleaner Profile | Find Trusted Cleaners',
    description: 'View the profile, services, and availability of trusted cleaners near you.',
  };
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
