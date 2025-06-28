// src/app/reset-password/page.js

import { Suspense } from 'react';
import ResetPassword from './resetpassword';

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-teal-700">Loading...</p>}>
      <ResetPassword />
    </Suspense>
  );
}
