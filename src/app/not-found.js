import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-4xl font-bold text-teal-700 mb-4">Page Not Found</h1>
      <p className="mb-6 text-gray-600">Sorry, the page you are looking for does not exist.</p>
      <Link href="/" className="text-blue-600 underline">Return to Home</Link>
    </main>
  );
}
