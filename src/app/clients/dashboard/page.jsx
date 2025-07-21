'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { fetchClient } from '@/lib/fetchClient'; // ✅ Shared helper import

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
      const loadClientData = async () => {
        try {
          const user = await fetchClient();

          if (!user || user.type !== 'client') {
            setError('Access denied. Please log in.');
            router.push('/login/clients');
            return;
          }

          setClient(user);
          setFormData({
            fullName: user.fullName,
            phone: user.phone,
            address: {
              houseNameNumber: user.address?.houseNameNumber || '',
              street: user.address?.street || '',
              county: user.address?.county || '',
              postcode: user.address?.postcode || '',
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

      loadClientData();
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
    setSuccess('');

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

      if (!res.ok) throw new Error('Update failed');

      const data = await res.json();
      setClient(data.client);
      setSuccess('✅ Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError('❌ Error saving changes.');
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
      <main className="min-h-screen py-12 px-6 bg-gradient-to-br from-teal-900/20 to-teal-700/10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-fade-in">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">Error</h1>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-6 bg-gradient-to-br from-teal-900/20 to-teal-700/10">
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Back to Home Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            🏠 Back to Home
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg animate-slide-up">
            {success}
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
            Welcome back, {client?.fullName}!
          </h1>
          <p className="text-gray-700">Manage your profile, view bookings, and track your cleaning history.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-teal-800">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-[50px] font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  {isEditing ? '✖️ Cancel' : '✏️ Edit'}
                </button>
              </div>

              {!isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/80 p-4 rounded-2xl">
                      <h3 className="font-semibold text-teal-800 mb-2">Full Name</h3>
                      <p className="text-gray-700">{client?.fullName}</p>
                    </div>
                    <div className="bg-white/80 p-4 rounded-2xl">
                      <h3 className="font-semibold text-teal-800 mb-2">Phone</h3>
                      <p className="text-gray-700">{client?.phone}</p>
                    </div>
                  </div>
                  <div className="bg-white/80 p-4 rounded-2xl">
                    <h3 className="font-semibold text-teal-800 mb-2">Address</h3>
                    <p className="text-gray-700">
                      {client?.address?.houseNameNumber} {client?.address?.street}, {client?.address?.county} {client?.address?.postcode}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-teal-800 font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full bg-white/80 backdrop-blur-[20px] border border-white/20 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-teal-600 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-teal-800 font-medium mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-white/80 backdrop-blur-[20px] border border-white/20 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-teal-600 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-teal-800 font-medium mb-2">House Name/Number</label>
                      <input
                        type="text"
                        name="houseNameNumber"
                        value={formData.address.houseNameNumber}
                        onChange={handleChange}
                        className="w-full bg-white/80 backdrop-blur-[20px] border border-white/20 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-teal-600 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-teal-800 font-medium mb-2">Street</label>
                      <input
                        type="text"
                        name="street"
                        value={formData.address.street}
                        onChange={handleChange}
                        className="w-full bg-white/80 backdrop-blur-[20px] border border-white/20 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-teal-600 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-teal-800 font-medium mb-2">County</label>
                      <input
                        type="text"
                        name="county"
                        value={formData.address.county}
                        onChange={handleChange}
                        className="w-full bg-white/80 backdrop-blur-[20px] border border-white/20 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-teal-600 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-teal-800 font-medium mb-2">Postcode</label>
                      <input
                        type="text"
                        name="postcode"
                        value={formData.address.postcode}
                        onChange={handleChange}
                        className="w-full bg-white/80 backdrop-blur-[20px] border border-white/20 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-teal-600 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-[50px] font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-slide-up">
              <h3 className="text-xl font-bold text-teal-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/book-cleaning"
                  className="block w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white text-center px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  📅 Book New Cleaning
                </Link>
                <Link
                  href="/cleaners"
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  👥 Browse Cleaners
                </Link>
                <Link
                  href="/support"
                  className="block w-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-center px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  💬 Get Support
                </Link>
              </div>
            </div>

            {/* Account Management */}
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-slide-up">
              <h3 className="text-xl font-bold text-teal-800 mb-4">Account Management</h3>
              <button
                onClick={handleDeleteAccount}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
              >
                🗑️ Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-slide-up">
            <h2 className="text-3xl font-bold text-teal-800 mb-6">Recent Bookings</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No bookings yet</p>
                <Link
                  href="/book-cleaning"
                  className="inline-block bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-[50px] font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  Book Your First Cleaning
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 3).map((booking) => (
                  <div key={booking._id} className="bg-white/80 p-4 rounded-2xl hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-teal-800">{booking.service}</h4>
                      <span className={`px-3 py-1 rounded-[50px] text-sm font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{new Date(booking.date).toLocaleDateString()}</p>
                    <p className="text-gray-700 font-medium">£{booking.price}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purchase History */}
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-slide-up">
            <h2 className="text-3xl font-bold text-teal-800 mb-6">Purchase History</h2>
            {purchases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No purchases yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.slice(0, 3).map((purchase) => (
                  <div key={purchase._id} className="bg-white/80 p-4 rounded-2xl hover:shadow-lg transition-all duration-300">
                    <h4 className="font-semibold text-teal-800 mb-2">{purchase.item}</h4>
                    <p className="text-gray-600 text-sm">{new Date(purchase.date).toLocaleDateString()}</p>
                    <p className="text-gray-700 font-medium">£{purchase.amount}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}