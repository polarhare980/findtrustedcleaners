'use client';

export default function PaymentCancelledPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
        <p>Your payment was cancelled or interrupted. Please try again.</p>
      </div>
    </main>
  );
}
