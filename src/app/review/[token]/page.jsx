import ReviewTokenPageClient from './ReviewTokenPageClient';

export default async function ReviewTokenPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  return <ReviewTokenPageClient token={resolvedParams?.token || ''} />;
}
