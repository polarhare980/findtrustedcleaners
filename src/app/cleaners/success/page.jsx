'use client';
import Link from 'next/link';
import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';

export default function CleanerSuccessPage() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize(); // set initial
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      {/* 🎉 Confetti animation */}
      <Confetti width={dimensions.width} height={dimensions.height} numberOfPieces={300} />

      <h1 className="text-4xl font-bold text-[#0D9488] mb-4">🎉 Congratulations!</h1>
      <p className="text-lg text-gray-700 mb-6">
        Your cleaner profile has been created successfully.
      </p>

      <div className="flex gap-4">
        <Link
          href="/"
          className="bg-[#0D9488] text-white px-6 py-3 rounded shadow hover:bg-teal-700"
        >
          Go to Home
        </Link>
        <Link
          href="/login"
          className="bg-gray-200 text-[#0D9488] px-6 py-3 rounded shadow hover:bg-gray-300"
        >
          Go to My Account
        </Link>
      </div>
    </main>
  );
}