import ReviewTokenPageClient from './ReviewTokenPageClient';

export default function ReviewTokenPage({ params }) {
  return <ReviewTokenPageClient token={params?.token || ''} />;
}
