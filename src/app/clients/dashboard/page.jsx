'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { fetchClient } from '@/lib/fetchClient'; // (kept if you use elsewhere)
import { secureFetch } from '@/lib/secureFetch';

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

  const [purchases, setPurchases] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [favorites, setFavorites] = useState([]); // docs array

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadClientData = async () => {
      try {
        // --- Auth check ---
        const res = await secureFetch('/api/auth/me');
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await res.json() : null;

        if (!res.ok || !data?.success || data.user?.type !== 'client') {
          setError('Access denied. Please log in.');
          router.push('/login/clients');
          return;
        }

        const user = data.user;
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

        // --- Merge local favourites into DB (run once per session) ---
        try {
          if (!sessionStorage.getItem('favMergeDone')) {
            const localFavs = JSON.parse(localStorage.getItem('favourites') || '[]');

            const resMerge = await fetch('/api/clients/favorites-merge', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ favourites: Array.isArray(localFavs) ? localFavs : [] }),
            });

            const ctMerge = resMerge.headers.get('content-type') || '';
            const dataMerge = ctMerge.includes('application/json') ? await resMerge.json() : null;

            if (resMerge.ok && dataMerge?.success) {
              const mergedIds = dataMerge.favourites || dataMerge.favorites || [];
              localStorage.setItem('favourites', JSON.stringify(mergedIds));
            }
            sessionStorage.setItem('favMergeDone', '1');
          }
        } catch (e) {
          console.warn('Favourites merge skipped:', e);
        }

        // --- Purchases ---
        const purchasesRes = await fetch('/api/clients/purchases', { credentials: 'include' });
        const purchasesCT = purchasesRes.headers.get('content-type') || '';
        const purchasesData = purchasesCT.includes('application/json') ? await purchasesRes.json() : null;
        if (purchasesRes.ok && purchasesData?.success) setPurchases(purchasesData.purchases || []);

        // --- Upcoming bookings ---
        const upcomingRes = await fetch('/api/clients/upcoming-bookings', { credentials: 'include' });
        const upcomingCT = upcomingRes.headers.get('content-type') || '';
        const upcomingData = upcomingCT.includes('application/json') ? await upcomingRes.json() : null;
        if (upcomingRes.ok && upcomingData?.success) setUpcomingBookings(upcomingData.bookings || []);

        // --- Favorites (docs) ---
        const favoritesRes = await fetch('/api/clients/favorites', { credentials: 'include' });
        const favCT = favoritesRes.headers.get('content-type') || '';
        const favoritesData = favCT.includes('application/json') ? await favoritesRes.json() : null;

        if (favoritesRes.ok && favoritesData?.success) {
          setFavorites(favoritesData.favorites || []);
          // keep localStorage in sync if backend returns ids
          if (Array.isArray(favoritesData.favouriteIds)) {
            localStorage.setItem('favourites', JSON.stringify(favoritesData.favouriteIds));
          } else if (Array.isArray(favoritesData.favorites)) {
            // fall back to extracting ids from docs
            localStorage.setItem('favourites', JSON.stringify(favoritesData.favorites.map(f => String(f._id))));
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading client data:', err);
        setError('Something went wrong.');
        setLoading(false);
      }
    };

    loadClientData();
    setMounted(true);
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

  const handleLogout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    localStorage.removeItem('favourites'); // clear local favourites
    sessionStorage.removeItem('favMergeDone');
    router.push('/login/clients');
  } catch (err) {
    console.error('Logout failed:', err);
    setError('❌ Error logging out.');
  }
};


  const handleRateService = async (purchaseId, rating, review) => {
    try {
      const res = await fetch(`/api/clients/rate-service`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId, rating, review }),
      });

      if (res.ok) {
        setSuccess('✅ Rating submitted successfully!');
        const purchasesRes = await fetch('/api/clients/purchases', { credentials: 'include' });
        const ct = purchasesRes.headers.get('content-type') || '';
        const purchasesData = ct.includes('application/json') ? await purchasesRes.json() : null;
        if (purchasesRes.ok && purchasesData?.success) setPurchases(purchasesData.purchases || []);
      }
    } catch (err) {
      console.error('Error rating service:', err);
      setError('❌ Error submitting rating.');
    }
  };

  // 🔁 Toggle favourite with server + keep localStorage in sync
  const handleToggleFavorite = async (cleanerId) => {
    try {
      const res = await fetch('/api/clients/toggle-favorite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId }),
      });

      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : null;

      if (res.ok && data?.success) {
        // update rendered docs
        const ids = (data.favourites || data.favorites || []).map(String);

        // if we have current docs, adjust them to reflect the toggle
        setFavorites((prev) => {
          const isNowFav = ids.includes(String(cleanerId));
          const hadDoc = prev.some((d) => String(d._id) === String(cleanerId));
          if (isNowFav && hadDoc) return prev; // already present
          if (!isNowFav) return prev.filter((d) => String(d._id) !== String(cleanerId));
          // If newly added but doc not in list, leave as-is (it will show elsewhere); we keep the list trimmed here
          return prev;
        });

        // sync localStorage with server truth
        localStorage.setItem('favourites', JSON.stringify(ids));

        setSuccess(data.added ? '✅ Added to favorites!' : '✅ Removed from favorites!');
      } else {
        setError('❌ Error updating favorites.');
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('❌ Error updating favorites.');
    }
  };

  const getTimeUntil = (dateTime) => {
    const now = new Date();
    const target = new Date(dateTime);
    const diff = target - now;

    if (diff < 0) return 'Past';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Soon';
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
          <div className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-red px-6 py-3 rounded-xl shadow-lg animate-slide-up">
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
                  href="/cleaners"
                  className="block w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white text-center px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  👥 Browse Cleaners
                </Link>
                <Link
                  href="/clients/my-favorites"
                  className="block w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white text-center px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  ❤️ My Favorite Cleaners
                </Link>
                <Link
                  href="/contact-us"
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
    onClick={handleLogout}
    className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105 mb-3"
  >
    🚪 Logout
  </button>

  <button
    onClick={handleDeleteAccount}
    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
  >
    🗑️ Delete Account
  </button>
</div>

          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="mt-8">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-slide-up">
            <h2 className="text-3xl font-bold text-teal-800 mb-6">📅 Upcoming Appointments</h2>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No upcoming appointments</p>
                <Link
                  href="/cleaners"
                  className="inline-block bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-[50px] font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
                >
                  Book Your Next Cleaning
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingBookings.slice(0, 6).map((booking) => (
                  <div key={booking._id} className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-2xl border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-blue-800">
                        {booking.cleanerId?.companyName || booking.cleanerId?.realName || 'Cleaner'}
                      </h4>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                        {getTimeUntil(booking.scheduledDateTime)}
                      </span>
                    </div>
                    <p className="text-blue-600 text-sm mb-2">
                      {new Date(booking.scheduledDateTime).toLocaleDateString()} at {booking.time}
                    </p>
                    <p className="text-blue-700 font-medium mb-3">
                      {booking.day} - {booking.service || 'Cleaning Service'}
                    </p>
                    <div className="flex gap-2">
                      <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors">
                        Reschedule
                      </button>
                      <button className="text-xs bg-gray-500 text-white px-3 py-1 rounded-full hover:bg-gray-600 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Favorite Cleaners */}
        {favorites.length > 0 && (
          <div className="mt-8">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-slide-up">
              <h2 className="text-3xl font-bold text-teal-800 mb-6">❤️ Your Favorite Cleaners</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.slice(0, 6).map((favorite) => (
                  <div key={favorite._id} className="bg-white/80 p-4 rounded-2xl hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-teal-800">
                        {favorite.companyName || favorite.realName}
                      </h4>
                      <button
                        onClick={() => handleToggleFavorite(favorite._id)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        ❤️
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {favorite.services?.join(', ') || 'Cleaning Services'}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex text-yellow-400">
                        {'★'.repeat(Math.floor(favorite.rating || 5))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({favorite.reviewCount || 0} reviews)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/cleaners/${favorite._id}`}
                        className="text-xs bg-teal-600 text-white px-3 py-1 rounded-full hover:bg-teal-700 transition-colors"
                      >
                        View Profile
                      </Link>
                      <Link
                        href={`/book/${favorite._id}`}
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-colors"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Your Bookings Section */}
        <div className="mt-8">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-slide-up">
            <h2 className="text-3xl font-bold text-teal-800 mb-6">Your Bookings</h2>
            {purchases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.slice(0, 3).map((purchase) => (
                  <div key={purchase._id} className="bg-white/80 p-4 rounded-2xl hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-teal-800">
                        Access to {purchase.cleanerId?.companyName || purchase.cleanerId?.realName || 'Cleaner'}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFavorite(purchase.cleanerId?._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Add to favorites"
                        >
                          {favorites.some(fav => fav._id === purchase.cleanerId?._id) ? '❤️' : '🤍'}
                        </button>
                        <span className={`px-3 py-1 rounded-[50px] text-sm font-medium ${
                          purchase.status === 'approved' ? 'bg-green-100 text-green-800' :
                          purchase.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {purchase.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Purchased on {new Date(purchase.createdAt).toLocaleDateString()} at {purchase.hour}, {purchase.day}
                    </p>
                    {purchase.amount && (
                      <p className="text-gray-700 font-medium mb-3">£{(purchase.amount).toFixed(2)}</p>
                    )}

                    {/* Rating & Review Section */}
                    {purchase.status === 'approved' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {purchase.rating ? (
                          <div className="flex items-center gap-2">
                            <div className="flex text-yellow-400">
                              {'★'.repeat(purchase.rating)}{'☆'.repeat(5 - purchase.rating)}
                            </div>
                            <span className="text-sm text-gray-600">You rated this service</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => {
                                const rating = prompt('Rate this service (1-5 stars):');
                                const review = prompt('Leave a review (optional):');
                                if (rating && rating >= 1 && rating <= 5) {
                                  handleRateService(purchase._id, parseInt(rating), review || '');
                                }
                              }}
                              className="text-amber-500 hover:text-amber-600 text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                              ⭐ Rate Service
                            </button>
                            <button
                              onClick={() => {
                                const review = prompt('Write a review:');
                                if (review) {
                                  handleRateService(purchase._id, 5, review);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                              ✍️ Write Review
                            </button>
                          </div>
                        )}
                        {purchase.review && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{purchase.review}"</p>
                        )}
                      </div>
                    )}
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
