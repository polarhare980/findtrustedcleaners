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
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] text-center animate-fade-in">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Error
            </h1>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-6 bg-gradient-to-br from-teal-900/20 to-teal-700/10">
      <div className="max-w-6xl mx-auto animate-fade-in">
        
        {/* Back to Search Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            🔍 Back to Search
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
            Client Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Manage your profile and view your cleaning services</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-8 animate-slide-up">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-[20px] text-center shadow-lg">
              {success}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transform hover:-translate-y-1 transition-all duration-300">
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-teal-800 flex items-center gap-2">
                  👤 Profile Information
                </h2>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2 rounded-[50px] font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                  >
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-[50px] font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </span>
                      ) : (
                        '💾 Save Changes'
                      )}
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-2 rounded-[50px] font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                )}
              </div>

              {client && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-teal-700 mb-2">Full Name</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="fullName" 
                          value={formData.fullName} 
                          onChange={handleChange} 
                          className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 outline-none"
                        />
                      ) : (
                        <p className="text-gray-700 bg-white/40 p-3 rounded-xl">{formData.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-teal-700 mb-2">Phone</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="phone" 
                          value={formData.phone} 
                          onChange={handleChange} 
                          className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 outline-none"
                        />
                      ) : (
                        <p className="text-gray-700 bg-white/40 p-3 rounded-xl">{formData.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['houseNameNumber', 'street', 'county', 'postcode'].map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-semibold text-teal-700 mb-2 capitalize">
                          {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </label>
                        {isEditing ? (
                          <input 
                            type="text" 
                            name={field} 
                            value={formData.address[field]} 
                            onChange={handleChange} 
                            className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 outline-none"
                          />
                        ) : (
                          <p className="text-gray-700 bg-white/40 p-3 rounded-xl">{formData.address[field]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
              <h3 className="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2">
                ⚡ Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl font-medium text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  🔍 Find Cleaners
                </Link>
                <Link
                  href="/bookings"
                  className="block bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-3 rounded-xl font-medium text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  📅 My Bookings
                </Link>
              </div>
            </div>

            <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
              <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                ⚠️ Danger Zone
              </h3>
              <button 
                onClick={handleDeleteAccount}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
              >
                🗑️ Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="mt-12">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-2">
              📅 Your Bookings
            </h2>
            
            {bookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((booking) => (
                  <div 
                    key={booking._id} 
                    className="bg-white/40 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-teal-800">{booking.cleanerName}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Day:</strong> {booking.day}</p>
                      <p><strong>Time:</strong> {booking.time}:00</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-600 text-lg">You have no bookings yet.</p>
                <Link
                  href="/"
                  className="inline-block mt-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-[50px] font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  Find Your First Cleaner
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Unlocked Cleaners Section */}
        <div className="mt-12">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-2">
              🔓 Unlocked Cleaners
            </h2>
            
            {purchases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchases.map((purchase) => (
                  <div 
                    key={purchase.cleanerId} 
                    className="bg-white/40 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <h3 className="font-semibold text-teal-800 mb-3">{purchase.cleanerName}</h3>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p><strong>📞 Phone:</strong> {purchase.phone}</p>
                      <p><strong>📧 Email:</strong> {purchase.email}</p>
                    </div>
                    <Link 
                      href={`/cleaners/${purchase.cleanerId}`} 
                      className="inline-block bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-[50px] font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                    >
                      View Profile →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔒</div>
                <p className="text-gray-600 text-lg">You haven't unlocked any cleaners yet.</p>
                <Link
                  href="/"
                  className="inline-block mt-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-[50px] font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  Browse Cleaners
                </Link>
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