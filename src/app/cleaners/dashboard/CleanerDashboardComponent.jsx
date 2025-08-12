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

  // ⬇️ helper: make "pending" slots objects with bookingId so ✓ / ✗ show & work
  // inject pending purchases as pending slots if missing
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


  useEffect(() => {
    if (typeof window === 'undefined') return;


  // ✅ put this back in (you removed it)
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

// get pending purchases
const fetchPurchases = async () => {
  try {
    const res = await fetch(`/api/purchases/cleaner/${cleanerUser._id}`, { credentials: 'include' });
    const data = await res.json();
    if (data?.success) {
      const purchases = data.purchases || data.bookings || []; // handles either key
      console.log('🧾 Dashboard received purchases →', purchases.map(p => ({
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

    // Fallback: find a pending item in the fetched bookings list for this day/hour
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

    // Fallback: find a pending item in the fetched bookings list for this day/hour
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

    // ✅ Reformat availability into { Monday: { 7: true }, ... }
    // 🛠️ Convert flat keys like 'Mon-11' into nested format like { Monday: { 11: true } }

const reformattedAvailability = formData.availability;


    try {
      const res = await fetch(`/api/cleaners/${cleaner._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          availability: reformattedAvailability, // 🧠 THIS is what needs saving
        }),
      });

      if (!res.ok) throw new Error('Update failed');

      const data = await res.json();
      setFormData(data.cleaner); // 🧠 Refresh the state
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
      // Reset image upload states when canceling edit
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
      // Reset image upload states after saving
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

  // Enhanced image upload handler
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

  // Delete profile handler
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
        // Logout and redirect
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

  // Navigation functions
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
              {/* Navigation Buttons */}
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
              {/* Profile Edit Buttons */}
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
              {/* Delete Profile Button */}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Real Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={editData.realName || ''}
                  onChange={(e) => handleInputChange('realName', e.target.value)}
                  className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                />
              ) : (
                <p className="text-gray-800 font-medium">{formData.realName || 'Not set'}</p>
              )}
            </div>

{/* ⭐ Google Review Rating */}
<div className="space-y-2">
  <label className="text-sm font-medium text-gray-600">⭐ Google Rating (0–5)</label>
  {editMode ? (
    <input
      type="number"
      step="0.1"
      min="0"
      max="5"
      value={editData.googleReviewRating || ''}
      onChange={(e) => handleInputChange('googleReviewRating', parseFloat(e.target.value))}
      className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
    />
  ) : (
    <p className="text-gray-800 font-medium">
      {formData.googleReviewRating ? `${formData.googleReviewRating} / 5` : 'Not set'}
    </p>
  )}
</div>

{/* 🧮 Google Review Count */}
<div className="space-y-2">
  <label className="text-sm font-medium text-gray-600">🧮 Review Count</label>
  {editMode ? (
    <input
      type="number"
      min="0"
      value={editData.googleReviewCount || ''}
      onChange={(e) => handleInputChange('googleReviewCount', parseInt(e.target.value))}
      className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
    />
  ) : (
    <p className="text-gray-800 font-medium">
      {formData.googleReviewCount ? `${formData.googleReviewCount} reviews` : 'Not set'}
    </p>
  )}
</div>

{/* 🔗 Google Review URL */}
<div className="space-y-2 md:col-span-2 lg:col-span-3">
  <label className="text-sm font-medium text-gray-600">🔗 Google Review Link</label>
  {editMode ? (
    <input
      type="url"
      value={editData.googleReviewUrl || ''}
      onChange={(e) => handleInputChange('googleReviewUrl', e.target.value)}
      className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
      placeholder="https://www.google.com/search?q=your+business"
    />
  ) : (
    <p className="text-blue-600 underline break-words">
      {formData.googleReviewUrl || 'Not set'}
    </p>
  )}
</div>
 
<div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Company Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={editData.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                />
              ) : (
                <p className="text-gray-800 font-medium">{formData.companyName || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Email</label>
              {editMode ? (
                <input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                />
              ) : (
                <p className="text-gray-800 font-medium">{formData.email || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Phone</label>
              {editMode ? (
                <input
                  type="tel"
                  value={editData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                />
              ) : (
                <p className="text-gray-800 font-medium">{formData.phone || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Hourly Rate (£)</label>
              {editMode ? (
                <input
                  type="number"
                  value={editData.rates || ''}
                  onChange={(e) => handleInputChange('rates', e.target.value)}
                  className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                />
              ) : (
                <p className="text-gray-800 font-medium">£{formData.rates || '0'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Business Insurance</label>
              {editMode ? (
                <select
                  value={editData.businessInsurance ? 'true' : 'false'}
                  onChange={(e) => handleInputChange('businessInsurance', e.target.value === 'true')}
                  className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : (
                <p className="text-gray-800 font-medium">{formData.businessInsurance ? 'Yes' : 'No'}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
  <label className="text-sm font-medium text-gray-600">Services Offered</label>
  {editMode ? (
    <input
      type="text"
      value={editData.services?.join(', ') || ''}
      onChange={(e) => handleServicesChange(e.target.value)}
      placeholder="e.g., Deep cleaning, Regular cleaning, Move-in/out"
      className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
    />
  ) : formData.services?.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {formData.services.map((service, i) => (
        <span
          key={i}
          className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300"
        >
          {service}
        </span>
      ))}
    </div>
  ) : (
    <p className="text-gray-800 font-medium">No services listed</p>
  )}


            </div>

            {/* Enhanced Profile Image Upload */}
            {/* ✅ Premium Gallery Uploads */}
{cleaner?.isPremium && (
  <>
    {/* 📸 Additional Photos */}
    <div className="space-y-2 md:col-span-2 lg:col-span-3">
      <label className="text-sm font-medium text-gray-600">📸 Photo Gallery (Max 10)</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={async (e) => {
          const files = Array.from(e.target.files);
          if (!files.length) return;
          const newPhotos = [...(formData.photos || [])];

          for (const file of files) {
            if (newPhotos.length >= 10) break;
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
            const data = await res.json();
            if (data.success && data.url) newPhotos.push(data.url);
          }

          setFormData((prev) => ({ ...prev, photos: newPhotos }));

          await fetch(`/api/cleaners/${cleaner._id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photos: newPhotos }),
          });
        }}
        className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg"
      />
      {formData.photos?.length > 0 && (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
    {formData.photos.map((url, i) => (
      <div key={i} className="relative group">
        <img
          src={url}
          alt={`Photo ${i + 1}`}
          className="w-full h-32 object-cover rounded-lg border shadow"
          loading="lazy"
        />
        <button
          onClick={async () => {
            const updated = formData.photos.filter((_, index) => index !== i);
            setFormData((prev) => ({ ...prev, photos: updated }));

            await fetch(`/api/cleaners/${cleaner._id}`, {
              method: 'PUT',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ photos: updated }),
            });
          }}
          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
          title="Remove photo"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
)}

    </div>

    {/* 🎥 Intro Video URL */}
    <div className="space-y-2 md:col-span-2 lg:col-span-3 mt-6">
      <label className="text-sm font-medium text-gray-600">🎥 Intro Video URL</label>
      <input
        type="url"
        placeholder="https://yourvideo.com"
        value={formData.videoUrl || ''}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))
        }
        onBlur={async () => {
          await fetch(`/api/cleaners/${cleaner._id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoUrl: formData.videoUrl }),
          });
        }}
        className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg"
      />
    </div>
  </>
)}

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium text-gray-600">📸 Profile Picture</label>
              
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Current/Preview Image */}
                <div className="flex-shrink-0">
                  {(imagePreview || formData.image) && (
                    <div className="relative">
                      <img 
  src={
    imagePreview ||
    (formData.image?.trim()
      ? formData.image
      : '/default-avatar.png')
  }
  alt="Profile"
  loading="lazy"
  className="w-32 h-32 object-cover rounded-full border-4 border-teal-200 shadow-lg transition-transform duration-300 hover:scale-105" 
/>

                      {!imagePreview && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                  )}
                  {!imagePreview && !formData.image && (
                    <div className="w-32 h-32 bg-gray-200 rounded-full border-4 border-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-4xl">👤</span>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                  />
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleImageUpload}
                      disabled={!selectedFile || imageUploading}
                      className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      {imageUploading ? '📤 Uploading...' : '📤 Upload New Picture'}
                    </button>
                    
                    {imagePreview && (
                      <button
                        onClick={() => {
                          setImagePreview('');
                          setSelectedFile(null);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        🗑️ Cancel
                      </button>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    📝 Upload a professional headshot for better client trust. Max size: 5MB
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
  <label className="text-sm font-medium text-gray-600">📍 Address</label>

  {editMode ? (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          value={editData.address?.houseNameNumber || ''}
          onChange={(e) => handleInputChange('address.houseNameNumber', e.target.value)}
          placeholder="House/Number"
          className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
        />
        <input
          type="text"
          value={editData.address?.street || ''}
          onChange={(e) => handleInputChange('address.street', e.target.value)}
          placeholder="Street"
          className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
        />
        <input
          type="text"
          value={editData.address?.county || ''}
          onChange={(e) => handleInputChange('address.county', e.target.value)}
          placeholder="County"
          className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
        />
        <input
          type="text"
          value={editData.address?.postcode || ''}
          onChange={(e) => handleInputChange('address.postcode', e.target.value)}
          placeholder="Postcode"
          className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
        />
      </div>

      {cleaner.isPremium && (
        <div className="pt-4">
          <label className="text-sm font-medium text-gray-600">
            🗺️ Additional Postcodes You Cover (Premium)
          </label>
          <input
  type="text"
  value={postcodeInput}
  onChange={(e) => setPostcodeInput(e.target.value)}
  placeholder="e.g. BN1, RH10, GU2"
  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
/>

          <p className="text-xs text-gray-500 italic mt-1">
            You’ll appear in searches for any of these postcodes. Separate with commas.
          </p>
        </div>
      )}
    </>
  ) : (
    <p className="text-gray-800 font-medium">
      {formData.address
        ? `${formData.address.houseNameNumber || ''} ${formData.address.street || ''}, ${formData.address.county || ''} ${formData.address.postcode || ''}`.trim()
        : 'Address not set'}
      {cleaner.isPremium && formData.additionalPostcodes?.length > 0 && (
        <span className="block text-sm text-gray-600 mt-1">
          Covers: {formData.additionalPostcodes.join(', ')}
        </span>
      )}
    </p>
  )}
</div>


            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium text-gray-600">📝 Public Bio</label>
{editMode ? (
  <textarea
    value={editData.bio || ''}
    onChange={(e) => handleInputChange('bio', e.target.value)}
    placeholder="Tell clients about your experience, services, and what makes you stand out. Don’t include contact info or company names."
    rows="4"
    maxLength="1000"
    className="w-full p-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 resize-none"
  />
) : (
  <p className="text-gray-800 font-medium whitespace-pre-wrap">
    {formData.bio || 'No public bio added yet.'}
  </p>
)}

            </div>
          </div>
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