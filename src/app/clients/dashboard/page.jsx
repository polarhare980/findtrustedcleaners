'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false); // ✅ SSR Protection
  const [client, setClient] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fetchClient = async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          const data = await res.json();

          if (!data.success || data.user.role !== 'client') {
            router.push('/login/clients');
          } else {
            setClient(data.user);
          }
        } catch (err) {
          console.error('Error fetching client:', err);
          router.push('/login/clients');
        } finally {
          setLoading(false);
        }
      };

      fetchClient();
      setMounted(true);
    }
  }, [router]);

  useEffect(() => {
    if (!client) return;

    const fetchBookings = async () => {
      try {
        const res = await fetch(`/api/bookings/client/${client._id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const data = await res.json();

        const bookingsWithNames = await Promise.all(
          data.map(async (booking) => {
            try {
              const cleanerRes = await fetch(`/api/public-cleaners/${booking.cleanerId}`);
              const cleanerData = await cleanerRes.json();
              return { ...booking, cleanerName: cleanerData.realName || 'Unknown Cleaner' };
            } catch {
              return { ...booking, cleanerName: 'Unknown Cleaner' };
            }
          })
        );

        setBookings(bookingsWithNames);
      } catch (err) {
        console.error('Error fetching bookings:', err.message);
      }
    };

    fetchBookings();
  }, [client]);

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const res = await fetch(`/api/bookings/delete/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to cancel booking');

      setBookings(bookings.filter((b) => b._id !== bookingId));
      alert('Booking cancelled successfully.');
    } catch (err) {
      console.error('Error cancelling booking:', err.message);
      alert('There was a problem cancelling the booking.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login/clients');
    } catch (err) {
      console.error('Error logging out:', err.message);
      router.push('/login/clients');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClient({ ...client, [name]: value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      alert('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err.message);
    }
  };

  if (!mounted) return null;
  if (loading) return <p className="p-6 text-gray-500">Loading dashboard...</p>;
  if (!client) return <p className="p-6 text-red-600">Client not found or not logged in.</p>;

  return (
    <div className="min-h-screen bg-teal-600 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-teal-700 mb-6 text-center">Welcome, {client.fullName}</h1>

        <div className="space-y-6">
          {['fullName', 'email', 'phone', 'address', 'postcode'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-teal-700 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
              {isEditing ? (
                <input
                  type="text"
                  name={field}
                  value={client[field]}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              ) : (
                <p className="text-gray-800 text-lg">{client[field]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition"
            >
              Edit Profile
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
            >
              Save Changes
            </button>
          )}

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-teal-700 mb-4">Your Booking History</h2>

          {bookings.length === 0 ? (
            <p className="text-gray-500">You have no bookings yet.</p>
          ) : (
            <ul className="space-y-4">
              {bookings.map((booking) => (
                <li key={booking._id} className="border p-4 rounded-lg shadow">
                  <p><strong>Cleaner:</strong> {booking.cleanerName}</p>
                  <p><strong>Day:</strong> {booking.day}</p>
                  <p><strong>Time:</strong> {booking.time}:00</p>
                  <p><strong>Status:</strong> {booking.status}</p>

                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                  >
                    Cancel Booking
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
