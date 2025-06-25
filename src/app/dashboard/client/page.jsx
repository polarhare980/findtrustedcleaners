'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.success) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, [router]);

  if (!user) return <p className="p-10 text-center">Loading your dashboard...</p>;

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-[#0D9488]">Welcome, {user.fullName} 👋</h1>
      <p>Email: {user.email}</p>
      <p>Phone: {user.phone}</p>
      {/* Later: show booking history, set pending slots, etc */}
    </main>
  );
}
