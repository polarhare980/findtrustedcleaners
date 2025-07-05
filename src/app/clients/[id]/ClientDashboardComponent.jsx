'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function ClientDashboardComponent() {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: { houseNameNumber: '', street: '', county: '', postcode: '' },
  });

  const [bookings, setBookings] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fetchClient = async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          const data = await res.json();

          if (!data.success || data.user.type !== 'client') {
            setError('Access denied. Please log in.');
            router.push('/login/clients');
            return;
          }

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

          const bookingsRes = await fetch('/api/clients/bookings', { credentials: 'include' });
          const bookingsData = await bookingsRes.json();
          if (bookingsData.success) setBookings(bookingsData.bookings);

          const purchasesRes = await fetch('/api/clients/purchases', { credentials: 'include' });
          const purchasesData = await purchasesRes.json();
          if (purchasesData.success) setPurchases(purchasesData.purchases);

        } catch (err) {
          console.error('Error fetching client data:', err);
          setError('Failed to fetch client data.');
          router.push('/login/clients');
        } finally {
          setLoading(false);
        }
      };

      fetchClient();
      setMounted(true);
    }
  }, [router]);

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

      if (res.ok) {
        setSuccess('Profile updated successfully.');
        setIsEditing(false);
      } else {
        setError('Failed to update profile.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        alert('Account deleted successfully.');
        router.push('/');
      } else {
        setError('Failed to delete account.');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('An error occurred while deleting account.');
    }
  };

  if (!mounted) return null;
  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <main className="p-6 text-red-600 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      {/* Back to Search Button */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
        >
          🔍 Back to Search
        </button>
      </div>

      <h1 className="text-2xl font-bold text-teal-700 mb-4">Client Dashboard</h1>

      {success && (
        <div className="p-4 mb-4 text-green-700 bg-green-50 border border-green-200 rounded text-center">
          {success}
        </div>
      )}

      {client && (
        <>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-teal-700 mb-1">Full Name</label>
              {isEditing ? (
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-2 border rounded" />
              ) : (
                <p className="text-gray-800">{formData.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-teal-700 mb-1">Phone</label>
              {isEditing ? (
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded" />
              ) : (
                <p className="text-gray-800">{formData.phone}</p>
              )}
            </div>

            {['houseNameNumber', 'street', 'county', 'postcode'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-semibold text-teal-700 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                {isEditing ? (
                  <input type="text" name={field} value={formData.address[field]} onChange={handleChange} className="w-full p-2 border rounded" />
                ) : (
                  <p className="text-gray-800">{formData.address[field]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700">Edit Profile</button>
            ) : (
              <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}

            <button onClick={handleDeleteAccount} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Delete Account</button>
          </div>
        </>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-bold text-teal-700 mb-4">Your Bookings</h2>
        {bookings.length > 0 ? (
          <ul className="space-y-4">
            {bookings.map((booking) => (
              <li key={booking._id} className="p-4 border rounded shadow">
                <p><strong>Cleaner:</strong> {booking.cleanerName}</p>
                <p><strong>Day:</strong> {booking.day}</p>
                <p><strong>Time:</strong> {booking.time}:00</p>
                <p><strong>Status:</strong> {booking.status}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">You have no bookings.</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-teal-700 mb-4">Unlocked Cleaners</h2>
        {purchases.length > 0 ? (
          <ul className="space-y-4">
            {purchases.map((purchase) => (
              <li key={purchase.cleanerId} className="p-4 border rounded shadow">
                <p><strong>Cleaner:</strong> {purchase.cleanerName}</p>
                <p><strong>Phone:</strong> {purchase.phone}</p>
                <p><strong>Email:</strong> {purchase.email}</p>
                <Link href={`/cleaners/${purchase.cleanerId}`} className="text-teal-600 hover:underline mt-2 block">View Profile</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">You have not unlocked any cleaners yet.</p>
        )}
      </div>
    </main>
  );
}
