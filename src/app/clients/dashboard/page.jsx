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
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: {
      houseNameNumber: '',
      street: '',
      county: '',
      postcode: '',
    },
  });

  const fetchClient = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();

      if (!data.success || data.user.type !== 'client') {
        router.push('/login/clients');
      } else {
        setClient(data.user);
        setFormData({
          fullName: data.user.fullName,
          phone: data.user.phone,
          address: {
            houseNameNumber: data.user.address?.houseNameNumber || '',
            street: data.user.address?.street || '',
            county: data.user.address?.county || '',
            postcode: data.user.address?.postcode || '',
          },
        });
      }
    } catch (err) {
      console.error('Error fetching client:', err);
      router.push('/login/clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
        const { bookings } = await res.json();

        const bookingsWithNames = await Promise.all(
          bookings.map(async (booking) => {
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

    if (['houseNameNumber', 'street', 'county', 'postcode'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [name]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Response:', errorText);
        throw new Error('Failed to update profile');
      }

      await fetchClient(); // ✅ Re-fetch updated data
      alert('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err.message);
      alert('There was a problem updating your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;
  if (loading) return <p className="p-6 text-gray-500">Loading dashboard...</p>;
  if (!client) return <p className="p-6 text-red-600">Client not found or not logged in.</p>;

  return (
    <div className="min-h-screen bg-teal-600 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-8">

        {/* 🔍 Home Button */}
        <div className="mb-6 flex justify-between">
          <button
            onClick={() => router.push('/')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
          >
            🔍 Back to Search
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            🚪 Logout
          </button>
        </div>

        <h1 className="text-3xl font-bold text-teal-700 mb-6 text-center">Welcome, {formData.fullName}</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-teal-700 mb-1 capitalize">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            ) : (
              <p className="text-gray-800 text-lg">{formData.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-teal-700 mb-1 capitalize">Phone</label>
            {isEditing ? (
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            ) : (
              <p className="text-gray-800 text-lg">{formData.phone}</p>
            )}
          </div>

          {['houseNameNumber', 'street', 'county', 'postcode'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-teal-700 mb-1 capitalize">
                {field.replace(/([A-Z])/g, ' $1')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name={field}
                  value={formData.address[field]}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              ) : (
                <p className="text-gray-800 text-lg">{formData.address[field]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
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
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
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
