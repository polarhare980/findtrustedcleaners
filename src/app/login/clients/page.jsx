'use client';

import { Suspense } from 'react';
import Head from 'next/head';
import ClientLoginPage from './ClientLoginPage';

export default function ClientLoginWrapper() {
  return (
    <>
      <Head>
        <title>Client Login | FindTrustedCleaners</title>
      </Head>

      <main className="min-h-screen bg-white text-gray-700 flex items-center justify-center p-4">
        <Suspense fallback={<p className="text-center p-10">Loading login...</p>}>
          <ClientLoginPage />
        </Suspense>
      </main>
    </>
  );
}
