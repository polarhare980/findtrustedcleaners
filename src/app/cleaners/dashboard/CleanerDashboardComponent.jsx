'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { secureFetch } from '@/lib/secureFetch';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 13 }, (_, i) => `${7 + i}`);

export default function CleanerDashboardComponent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cleaner, setCleaner] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availabilityChanged, setAvailabilityChanged] = useState(false);
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [postcodeInput, setPostcodeInput] = useState('');

  // Image upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  // ⬇️ helper: inject pending purchases as pending slots if missing
  const injectPendingFromPurchases = (availability = {}, purchasesList = []) => {
    const updated = JSON.parse(JSON.stringify(availability || {}));
    for (const p of purchasesList || []) {
      if (p?.status !== 'pending') continue;
      const day = p?.day;
      const hour = String(p?.hour);
      if (!day || !hour) continue;
      if (!updated[day]) updated[day] = {};
      const slot = updated[day][hour];
      if (!slot || slot === true || slot === 'unavailable') {
        updated[day][hour] = { status: 'pending', bookingId: p?._id || null };
      }
    }
    return updated;
  };

  // ✅ restore this helper so pending strings become objects with bookingId
  const normaliseAvailability = (availability = {}, bookingsList = []) => {
    const updated = JSON.parse(JSON.stringify(availability || {}));
    for (const day in updated) {
      for (const hour in updated[day]) {
        const slot = updated[day][hour];
        if (slot === 'pending') {
          const booking = (bookingsList || []).find(
            b => b?.day === day && String(b?.hour) === String(hour)
          );
          updated[day][hour] = { status: 'pending', bookingId: booking?._id || null };
        }
      }
    }
    return updated;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchEverything = async () => {
      try {
        // who am I?
        const resMe = await secureFetch('/api/auth/me');
        const dataMe = await resMe.json();

        if (!dataMe?.success || dataMe?.user?.type !== 'cleaner') {
          router.push('/login');
          return;
        }

        const cleanerUser = {
          ...dataMe.user,
          _id: dataMe.user._id?.toString() || dataMe.user.id?.toString(),
        };
        setCleaner(cleanerUser);

        // get bookings for this cleaner (RETURN the array)
        const fetchBookings = async () => {
          try {
            const res = await fetch(`/api/bookings/cleaner/${cleanerUser._id}`, { credentials: 'include' });
            const data = await res.json();
            if (data?.success) {
              console.log('📋 Dashboard received bookings →', (data.bookings || []).map(b => ({
                id: b?._id, status: b?.status, day: b?.day, hour: String(b?.hour)
              })));
              setBookings(data.bookings);
              return data.bookings;
            }
            console.warn('Failed to load bookings:', data?.message);
            return [];
          } catch (err) {
            console.error('Booking fetch failed:', err);
            return [];
          }
        };

        // ✅ safer purchases fetch (won't blow up on 404 HTML/redirects)
        const fetchPurchases = async () => {
          try {
            const res = await fetch(`/api/purchases/cleaner/${cleanerUser._id}`, { credentials: 'include' });

            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) {
              console.warn('Purchases API returned non-JSON:', res.status);
              return [];
            }

            const data = await res.json();
            if (res.ok && data?.success) {
              const purchases = data.purchases || data.bookings || [];
              console.log('🧾 Dashboard purchases →', purchases.map(p => ({
                id: p?._id, status: p?.status, day: p?.day, hour: String(p?.hour)
              })));
              return purchases;
            }

            console.warn('Failed to load purchases:', data?.message || data?.error);
            return [];
          } catch (err) {
            console.error('Purchase fetch failed:', err);
            return [];
          }
        };

        const bookingsList = await fetchBookings();

        // If you haven't created /api/purchases/cleaner/[id] yet, you can temporarily skip:
        // const purchasesList = [];
        const purchasesList = await fetchPurchases();

        const availabilityRaw = cleanerUser.availability || {};
        const availabilityWithPurchases = injectPendingFromPurchases(availabilityRaw, purchasesList);
        const availabilityFinal = normaliseAvailability(availabilityWithPurchases, bookingsList);

        const cleanerData = {
          ...cleanerUser,
          services: cleanerUser.services || [],
          availability: availabilityFinal,
          businessInsurance: cleanerUser.businessInsurance || false,
          bio: cleanerUser.bio || '',
        };

        setFormData(cleanerData);
        setEditData(cleanerData);
      } catch {
        router.push('/login');
      } finally {
        setMounted(true);
        setLoading(false);
      }
    };

    fetchEverything();
  }, [router]);

  // (leave the rest of your component — including toggleAvailability — as-is)

  const toggleAvailability = (day, hour) => {
    const slot = formData.availability?.[day]?.[hour];
    const status = typeof slot === 'object' ? slot.status : slot;

    if (status === false || status === 'pending') return;

    setFormData(prev => {
      const updated = { ...prev.availability };
      if (!updated[day]) updated[day] = {};
      updated[day][hour] = updated[day][hour] === true ? 'unavailable' : true;
      return { ...prev, availability: updated };
    });

    setAvailabilityChanged(true);
    setMessage('');
  };

  const handleConfirm = async (day, hour) => {
    try {
      const slot = formData?.availability?.[day]?.[hour];
      let bookingId = slot?.bookingId;

      if (!bookingId) {
        const match = bookings.find(
          b => b?.status === 'pending' && b?.day === day && String(b?.hour) === String(hour)
        );
        bookingId = match?._id;
      }

      if (!bookingId) {
        alert('No booking found for this slot.');
        return;
      }

      const res = await fetch(`/api/booking/accept-order/${bookingId}`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFormData(prev => ({ ...prev, availability: data.updatedAvailability }));
        setAvailabilityChanged(true);
        setMessage('✅ Booking accepted and payment captured!');
      } else {
        alert(data.message || 'Error accepting booking.');
      }
    } catch (err) {
      console.error('Accept booking error:', err);
      alert('Server error.');
    }
  };

  const handleDecline = async (day, hour) => {
    try {
      const slot = formData?.availability?.[day]?.[hour];
      let bookingId = slot?.bookingId;

      if (!bookingId) {
        const match = bookings.find(
          b => b?.status === 'pending' && b?.day === day && String(b?.hour) === String(hour)
        );
        bookingId = match?._id;
      }

      if (!bookingId) {
        alert('No booking found for this slot.');
        return;
      }

      const res = await fetch(`/api/booking/decline-order/${bookingId}`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFormData(prev => ({ ...prev, availability: data.updatedAvailability }));
        setAvailabilityChanged(true);
        setMessage('✅ Booking declined and slot freed.');
      } else {
        alert(data.message || 'Error declining booking.');
      }
    } catch (err) {
      console.error('Decline booking error:', err);
      alert('Server error.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    console.log('Saving availability...');

    const reformattedAvailability = formData.availability;

    try {
      const res = await fetch(`/api/cleaners/${cleaner._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          availability: reformattedAvailability,
        }),
      });

      if (!res.ok) throw new Error('Update failed');

      const data = await res.json();
      setFormData(data.cleaner);
      setMessage('✅ Changes saved successfully!');
      setAvailabilityChanged(false);
    } catch (err) {
      console.error('Save error:', err);
      setMessage('❌ Error saving changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditToggle = () => {
    if (editMode) {
      setEditData({ ...formData });
      setSelectedFile(null);
      setImagePreview('');
    }
    setEditMode(!editMode);
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cleaners/${cleaner._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!res.ok) throw new Error('Update failed');

      setFormData({ ...editData });
      setEditMode(false);
      setMessage('✅ Profile updated successfully!');
      setSelectedFile(null);
      setImagePreview('');
    } catch (err) {
      console.error(err);
      setMessage('❌ Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleServicesChange = (value) => {
    const services = value.split(',').map(s => s.trim()).filter(s => s);
    setEditData(prev => ({
      ...prev,
      services
    }));
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return alert('Please select a file.');
    setImageUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', selectedFile);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      const data = await res.json();

      if (data.success) {
        const updateRes = await fetch(`/api/cleaners/${cleaner._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: data.url }),
        });

        if (updateRes.ok) {
          setMessage('✅ Profile picture updated successfully!');
          setFormData((prev) => ({ ...prev, image: data.url }));
          setEditData((prev) => ({ ...prev, image: data.url }));
          setImagePreview('');
          setSelectedFile(null);
        } else {
          alert('Failed to update profile with image.');
        }
      } else {
        alert('Image upload failed.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/cleaners/${cleaner._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
        router.push('/');
      } else {
        alert('Failed to delete profile. Please try again.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting profile.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleUpgradeClick = async () => {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId: cleaner._id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Upgrade failed:', err);
      alert('Something went wrong while starting your upgrade.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (!mounted) return null;
  if (loading || !formData) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-white py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-2">
                Cleaner Dashboard
              </h1>
              <p className="text-gray-600">Manage your cleaning services and availability</p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              <button
                onClick={handleGoHome}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
              >
                🏠 Home
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
              >
                🔐 Logout
              </button>
              <button
                onClick={handleEditToggle}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
              >
                {editMode ? '✕ Cancel Edit' : '✏️ Edit Profile'}
              </button>
              {editMode && (
                <button
                  onClick={handleEditSave}
                  disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium disabled:opacity-50 transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {saving ? '⏳ Saving...' : '💾 Save Profile'}
                </button>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
              >
                🗑️ Delete Profile
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-red-600 mb-4">⚠️ Delete Profile</h3>
              <p className="text-gray-700 mb-4">
                This action cannot be undone. This will permanently delete your cleaner profile and all associated data.
              </p>
              <p className="text-gray-700 mb-4">
                Type <strong>DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
                placeholder="Type DELETE"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-medium transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProfile}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium disabled:opacity-50 transition-all duration-300"
                >
                  {deleting ? '🗑️ Deleting...' : '🗑️ Delete Profile'}
                </button>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className={`mb-6 text-center text-white py-3 px-4 rounded-lg font-medium backdrop-blur-md border border-white/20 ${
            message.includes('✅') ? 'bg-green-500/80' : 'bg-red-500/80'
          }`}>
            {message}
          </div>
        )}

        {/* Premium Upgrade Section */}
        {!cleaner?.isPremium && (
          <div className="bg-gradient-to-r from-amber-400/20 to-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-800 px-4 py-3 rounded-lg mb-6">
            <p className="mb-2 font-semibold">✨ You are using a Free Account</p>
            <button
              onClick={handleUpgradeClick}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              💎 Upgrade to Premium (£7.99/month)
            </button>
          </div>
        )}

        {cleaner?.isPremium && (
          <div className="bg-gradient-to-r from-green-400/20 to-green-500/20 backdrop-blur-md border border-green-400/30 text-green-800 px-4 py-3 rounded-lg mb-6 font-semibold">
            ✨ You are a Premium Cleaner!
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl mb-6 p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-6">
            👤 Profile Information
          </h2>

          {/* (content unchanged) */}
          {/* --- keep all the profile, image upload, address, bio sections exactly as in your current file --- */}
          {/* For brevity, they’re omitted here, but the version you pasted can stay as-is. */}

          {/* ⭐ Google Review Rating */}
          {/* 🧮 Google Review Count */}
          {/* 🔗 Google Review URL */}
          {/* ... all your existing fields ... */}

          {/* The rest of your large profile form content from your message stays unchanged */}
        </div>

        {/* Availability Grid */}
        <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4 md:mb-0">
              🗓️ Availability Management
            </h2>
            {availabilityChanged && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
              >
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="font-semibold text-gray-700 text-center py-2">Time</div>
                {days.map(day => (
                  <div key={day} className="font-semibold text-gray-700 text-center py-2 text-sm">
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>

              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="font-medium text-gray-700 text-center py-3 bg-white/40 backdrop-blur-sm rounded-lg">
                    {hour}:00
                  </div>
                  {days.map(day => {
                    const slot = formData.availability?.[day]?.[hour];
                    const status = typeof slot === 'object' ? slot.status : slot;
                    const isAvailable = status === true;
                    const isUnavailable = status === 'unavailable';
                    const isPending = status === 'pending';
                    const isBooked = status === 'booked';

                    return (
                      <div key={`${day}-${hour}`} className="relative">
                        <button
                          onClick={() => toggleAvailability(day, hour)}
                          disabled={isPending || isBooked}
                          className={`w-full h-12 rounded-lg font-medium text-sm transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg border-2 ${
                            isAvailable
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-green-400'
                              : isUnavailable
                              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400'
                              : isPending
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 cursor-not-allowed'
                              : isBooked
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400 cursor-not-allowed'
                              : 'bg-white/40 backdrop-blur-sm hover:bg-white/60 text-gray-600 border-gray-300'
                          }`}
                        >
                          {isAvailable && '✓'}
                          {isUnavailable && '✗'}
                          {isPending && '⏳'}
                          {isBooked && '📅'}
                          {!status && '○'}
                        </button>

                        {/* Booking Action Buttons */}
                        {isPending && (
                          <div className="absolute top-14 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-2 shadow-lg">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleConfirm(day, hour)}
                                className="flex-1 px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded text-xs font-medium transition-all duration-300"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleDecline(day, hour)}
                                className="flex-1 px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded text-xs font-medium transition-all duration-300"
                              >
                                ✗
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-white/40 backdrop-blur-sm rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Legend:</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded border-2 border-green-400"></div>
                <span className="text-gray-700">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded border-2 border-red-400"></div>
                <span className="text-gray-700">Unavailable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded border-2 border-amber-400"></div>
                <span className="text-gray-700">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded border-2 border-blue-400"></div>
                <span className="text-gray-700">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white/40 backdrop-blur-sm rounded border-2 border-gray-300"></div>
                <span className="text-gray-700">Not set</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 text-center hover:transform hover:-translate-y-1 transition-all duration-300">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
              Profile Views
            </h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {formData.profileViews || 0}
            </p>
          </div>

          <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 text-center hover:transform hover:-translate-y-1 transition-all duration-300">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
              Rating
            </h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {formData.rating ? `${formData.rating.toFixed(1)}/5` : 'N/A'}
            </p>
          </div>

          <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 text-center hover:transform hover:-translate-y-1 transition-all duration-300">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
              Completed Jobs
            </h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {formData.completedJobs || 0}
            </p>
          </div>

          <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 text-center hover:transform hover:-translate-y-1 transition-all duration-300">
            <div className="text-3xl mb-2">💎</div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
              Account Status
            </h3>
            <p className="text-lg font-bold text-gray-800 mt-2">
              {formData.isPremium ? '✨ Premium' : '🆓 Free'}
            </p>
          </div>
        </div>

       {/* 📌 Quick Actions */}
<div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 mt-10">
  <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-6">
    ⚡ Quick Actions
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* 📄 Export Cleaner Data */}
    <button
      onClick={() => window.open('/api/cleaners/export-data', '_blank')}
      className="flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <span className="text-xl">📄</span>
      <span>Export My Data</span>
    </button>

    {/* 📋 View All Bookings */}
    <button
      onClick={() => router.push('/cleaner/bookings')}
      className="flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <span className="text-xl">📋</span>
      <span>View All Bookings</span>
    </button>

    {/* 💰 View Earnings */}
    <button
      onClick={() => router.push('/cleaners/earnings')}
      className="flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-xl font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <span className="text-xl">💰</span>
      <span>Check Earnings</span>
    </button>
  </div>
</div>

      </div>
    </div>
  );
}