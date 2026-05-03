'use client';

import { Suspense } from 'react';
import ClientLoginPage from './ClientLoginPage';

export default function ClientLoginWrapper() {
  return (
    <>
<main className="min-h-screen bg-white text-gray-700 flex items-center justify-center p-4">
        <Suspense fallback={<p className="text-center p-10">Loading login...</p>}>
          <ClientLoginPage />
        </Suspense>
      </main>
    </>
  );
}
