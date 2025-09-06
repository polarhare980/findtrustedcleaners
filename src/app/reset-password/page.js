// src/app/reset-password/page.js

import { Suspense } from 'react';
import ResetPassword from './ResetPasswordForm';

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-teal-700">Loading...</p>}>
      <ResetPassword />
    </Suspense>
  );
}

