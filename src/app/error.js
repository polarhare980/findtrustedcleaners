'use client';

export default function GlobalError({ error, reset }) {
  console.error('❌ Global error:', error);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-6 text-red-700">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="mb-4">{error.message || 'An unexpected error occurred.'}</p>
      <button
        onClick={reset}
        className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
      >
        Try Again
      </button>
    </main>
  );
}
