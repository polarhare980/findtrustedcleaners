// app/blog/page.jsx
import BlogListClient from './BlogListClient';

export const metadata = {
  title: 'Cleaning Tips & Guides | FindTrustedCleaners Blog',
  description: 'Expert cleaning tips, oven care guides, DIY advice, and industry insights from FindTrustedCleaners.',
  alternates: {
    canonical: 'https://www.findtrustedcleaners.com/blog',
  },
  openGraph: {
    title: 'FindTrustedCleaners Blog',
    description: 'Expert cleaning tips, oven care guides, and DIY advice.',
    url: 'https://www.findtrustedcleaners.com/blog',
    siteName: 'FindTrustedCleaners',
    type: 'website',
  },
  robots: {
    index: true, follow: true,
  },
};

export default function Page() {
  return <BlogListClient initialTag="" />;
}
