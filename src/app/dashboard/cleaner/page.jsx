'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CleanerDashboard() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (!data.success) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const res = await fetch(`/api/bookings/cleaner/${user._id}`, { credentials: 'include' });
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error('Error fetching bookings:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const handleBookingUpdate = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/bookings/update/${bookingId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update booking');

      // Refresh bookings after update
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
      alert(`Booking ${newStatus}`);
    } catch (err) {
      console.error('Error updating booking:', err.message);
      alert('There was a problem updating the booking.');
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/stripe/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId: user._id }),
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert('Unable to start payment session.');
      }
    } catch (err) {
      console.error('Error creating Stripe session:', err.message);
      alert('There was a problem starting your payment.');
    }
  };

  if (!user) return <p className="p-10 text-center">Loading your dashboard...</p>;

  return (
    <main className="p-6 min-h-screen bg-[#0D9488] text-white">
      <h1 className="text-3xl font-bold mb-4">Welcome, {user.realName} 👋</h1>
      <p>Company: {user.companyName}</p>
      <p>Email: {user.email}</p>

      {/* Upgrade to Premium Button */}
      {!user.premium && (
        <button
          onClick={handleUpgrade}
          className="mt-4 mb-8 bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded shadow active-tap"
        >
          Upgrade to Premium for £7.99/month
        </button>
      )}

      {user.premium && (
        <p className="mt-4 mb-8 text-green-300 font-semibold">You are a Premium Cleaner 🚀</p>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Booking Requests</h2>

        {loading ? (
          <p>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p>No booking requests yet.</p>
        ) : (
          <ul className="space-y-4">
            {bookings.map((booking) => (
              <li key={booking._id} className="border border-white p-4 rounded-lg shadow bg-white text-gray-800">
                <p><strong>Client ID:</strong> {booking.clientId}</p>
                <p><strong>Day:</strong> {booking.day}</p>
                <p><strong>Time:</strong> {booking.time}:00</p>
                <p><strong>Status:</strong> {booking.status}</p>

                {booking.status === 'pending' && (
                  <div className="flex space-x-4 mt-2">
                    <button
                      onClick={() => handleBookingUpdate(booking._id, 'accepted')}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded active-tap"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleBookingUpdate(booking._id, 'rejected')}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded active-tap"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx global>{`
        .active-tap:active {
          transform: scale(0.98);
        }
      `}</style>
    </main>
  );
}


// think this is dead.