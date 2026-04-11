import ReviewTokenPageClient from './ReviewTokenPageClient';

export default async function ReviewTokenPage({ params }) {
  const resolved = await params;
  return <ReviewTokenPageClient token={resolved?.token || ''} />;
}
