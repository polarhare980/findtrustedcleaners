'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { secureFetch } from '@/lib/secureFetch';

// Hours / days grid
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i)); // "7".."19"

// Build fast lookups for overlay states from combined bookings API
function buildOverlayMaps(combined = []) {
  const pendingKeyToPurchaseId = new Map(); // `${day}|${hour}` -> purchaseId
  const bookedKeys = new Set();             // `${day}|${hour}`

  for (const row of combined) {
    const day = row?.day;
    const hour = String(row?.hour ?? '');
    if (!day || !hour) continue;

    const key = `${day}|${hour}`;
    const status = String(row?.status || '').toLowerCase();

    if (status === 'pending' || status === 'pending_approval') {
      // For merged purchases we exposed _id as the purchase id
      pendingKeyToPurchaseId.set(key, String(row?._id || ''));
    } else if (status === 'accepted' || status === 'booked' || status === 'confirmed' || status === 'approved') {
      bookedKeys.add(key);
    }
  }

  return { pendingKeyToPurchaseId, bookedKeys };
}

// Create a UI availability by overlaying pending/booked on top of base availability
function composeDisplayAvailability(baseAvailability = {}, overlays) {
  const { pendingKeyToPurchaseId, bookedKeys } = overlays;
  const out = JSON.parse(JSON.stringify(baseAvailability || {}));
  for (const day of DAYS) {
    if (!out[day]) out[day] = {};
    for (const hour of HOURS) {
      const key = `${day}|${hour}`;
      if (bookedKeys.has(key)) {
        out[day][hour] = { status: 'booked' };
      } else if (pendingKeyToPurchaseId.has(key)) {
        out[day][hour] = { status: 'pending', bookingId: pendingKeyToPurchaseId.get(key) };
      } else {
        // leave as-is (true / 'unavailable' / undefined)
      }
    }
  }
  return out;
}

export default function CleanerDashboard() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState(null);                 // logged-in cleaner user doc (auth/me)
  const [formData, setFormData] = useState(null);     // editor state (includes availability)
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [combined, setCombined] = useState([]);       // bookings + pending purchases
  const overlays = useMemo(() => buildOverlayMaps(combined), [combined]);
  const displayAvailability = useMemo(
    () => composeDisplayAvailability(formData?.availability || {}, overlays),
    [formData?.availability, overlays]
  );

  const [availabilityChanged, setAvailabilityChanged] = useState(false);

  // Image upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  // Delete profile
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Premium extra
  const [postcodeInput, setPostcodeInput] = useState('');

  useEffect(() => setMounted(true), []);

  // Load everything
  useEffect(() => {
    if (typeof window === 'undefined') return;

    (async () => {
      try {
        setLoading(true);

        // Who am I?
        const resMe = await secureFetch('/api/auth/me');
        const dataMe = await resMe.json();
        if (!dataMe?.success || dataMe?.user?.type !== 'cleaner') {
          router.push('/login');
          return;
        }

        const cleanerUser = { ...dataMe.user, _id: String(dataMe.user._id || dataMe.user.id) };
        setMe(cleanerUser);

        // Get merged bookings (real + pending purchases)
        const resB = await fetch(`/api/bookings/cleaner/${cleanerUser._id}`, { credentials: 'include' });
        const dataB = await resB.json();
        const merged = dataB?.success ? (dataB.bookings || []) : [];
        setCombined(merged);

        // Seed dashboard state
        const seed = {
          ...cleanerUser,
          services: cleanerUser.services || [],
          availability: cleanerUser.availability || {},
          businessInsurance: !!cleanerUser.businessInsurance,
          dbsChecked: !!cleanerUser.dbsChecked,
          bio: cleanerUser.bio || '',
        };
        setFormData(seed);
        setEditData(seed);
      } catch (e) {
        console.error('Dashboard init failed:', e);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Toggle base availability (cannot toggle pending or booked)
  const toggleAvailability = (day, hour) => {
    const slot = displayAvailability?.[day]?.[hour];
    const status = typeof slot === 'object' ? slot.status : slot;

    if (status === 'pending' || status === 'booked') return; // cannot toggle overlays

    setFormData(prev => {
      const next = { ...(prev.availability || {}) };
      if (!next[day]) next[day] = {};

      // Only toggle true/undefined/'unavailable'
      const current = next[day][hour];
      const currentVal = typeof current === 'object' ? current?.status : current;

      if (currentVal === true) {
        next[day][hour] = 'unavailable';
      } else {
        next[day][hour] = true;
      }

      return { ...prev, availability: next };
    });

    setAvailabilityChanged(true);
    setMessage('');
  };

  // Accept pending (uses purchaseId from overlay map)
  const handleAccept = async (day, hour) => {
    const key = `${day}|${hour}`;
    const purchaseId = overlays.pendingKeyToPurchaseId.get(key);
    if (!purchaseId) {
      alert('No pending request found for this slot.');
      return;
    }
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/accept`, { method: 'PUT', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Accept failed');

      setMessage('✅ Booking accepted and payment captured!');
      // Refresh combined overlay
      const resB = await fetch(`/api/bookings/cleaner/${me._id}`, { credentials: 'include' });
      const dataB = await resB.json();
      setCombined(dataB?.success ? (dataB.bookings || []) : []);
    } catch (e) {
      console.error('Accept error', e);
      alert(e.message || 'Server error.');
    }
  };

  // Decline pending
  const handleDecline = async (day, hour) => {
    const key = `${day}|${hour}`;
    const purchaseId = overlays.pendingKeyToPurchaseId.get(key);
    if (!purchaseId) {
      alert('No pending request found for this slot.');
      return;
    }
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/decline`, { method: 'PUT', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Decline failed');

      setMessage('✅ Booking declined and slot freed.');
      // Refresh combined overlay
      const resB = await fetch(`/api/bookings/cleaner/${me._id}`, { credentials: 'include' });
      const dataB = await resB.json();
      setCombined(dataB?.success ? (dataB.bookings || []) : []);
    } catch (e) {
      console.error('Decline error', e);
      alert(e.message || 'Server error.');
    }
  };

  // Save base availability
  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/bookings/cleaner/${me._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: formData.availability }),
      });
      const j = await res.json();
      if (!res.ok || !j?.success) throw new Error(j?.message || 'Update failed');
      setFormData((prev) => ({ ...prev, availability: j.cleaner?.availability || prev.availability }));
      setAvailabilityChanged(false);
      setMessage('✅ Availability saved.');
    } catch (err) {
      console.error('Save error:', err);
      setMessage('❌ Error saving changes.');
    } finally {
      setSaving(false);
    }
  };

  // Edit profile on/off
  const handleEditToggle = () => {
    if (editMode) {
      setEditData({ ...formData });
      setSelectedFile(null);
      setImagePreview('');
    }
    setEditMode(!editMode);
  };

  // Save profile fields (non-availability)
  const handleEditSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/cleaners/${me._id}`, {
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
      setEditData((prev) => ({ ...prev, [parent]: { ...(prev[parent] || {}), [child]: value } }));
    } else {
      setEditData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleServicesChange = (value) => {
    const services = value.split(',').map((s) => s.trim()).filter(Boolean);
    setEditData((prev) => ({ ...prev, services }));
  };

  // Image upload
  const handleImageUpload = async () => {
    if (!selectedFile) return alert('Please select a file.');
    setImageUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', selectedFile);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      const data = await res.json();
      if (data?.success && data?.url) {
        const upd = await fetch(`/api/cleaners/${me._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: data.url }),
        });
        if (upd.ok) {
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

  // Delete profile
  const handleDeleteProfile = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/cleaners/${me._id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
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

  // Premium upgrade
  const handleUpgradeClick = async () => {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId: me._id }),
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error('Upgrade failed:', err);
      alert('Something went wrong while starting your upgrade.');
    }
  };

  // Auth actions
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };
  const handleGoHome = () => router.push('/');

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

            <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
              {formData?.dbsChecked && (
                <span className="inline-flex items-center gap-2 px-2 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm">
                  ✅ DBS Checked
                </span>
              )}
              <button onClick={handleGoHome} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300">
                🏠 Home
              </button>
              <button onClick={handleLogout} className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-300">
                🔐 Logout
              </button>
              <button onClick={handleEditToggle} className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-lg font-medium transition-all duration-300">
                {editMode ? '✕ Cancel Edit' : '✏️ Edit Profile'}
              </button>
              {editMode && (
                <button onClick={handleEditSave} disabled={saving} className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium disabled:opacity-50 transition-all duration-300">
                  {saving ? '⏳ Saving...' : '💾 Save Profile'}
                </button>
              )}
              <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-300">
                🗑️ Delete Profile
              </button>
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-red-600 mb-4">⚠️ Delete Profile</h3>
              <p className="text-gray-700 mb-4">This action cannot be undone.</p>
              <p className="text-gray-700 mb-4">Type <strong>DELETE</strong> to confirm:</p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
                placeholder="Type DELETE"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProfile}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg disabled:opacity-50"
                >
                  {deleting ? '🗑️ Deleting...' : '🗑️ Delete Profile'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Flash message */}
        {message && (
          <div className={`mb-6 text-center text-white py-3 px-4 rounded-lg font-medium backdrop-blur-md border border-white/20 ${message.includes('✅') ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
            {message}
          </div>
        )}

        {/* Premium upsell/status */}
        {!formData?.isPremium ? (
          <div className="bg-gradient-to-r from-amber-400/20 to-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-800 px-4 py-3 rounded-lg mb-6">
            <p className="mb-2 font-semibold">✨ You are using a Free Account</p>
            <button onClick={handleUpgradeClick} className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-2 rounded-lg">
              💎 Upgrade to Premium (£7.99/month)
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-400/20 to-green-500/20 backdrop-blur-md border border-green-400/30 text-green-800 px-4 py-3 rounded-lg mb-6 font-semibold">
            ✨ You are a Premium Cleaner!
          </div>
        )}

        {/* Profile info */}
        <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl mb-6 p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4">
            👤 Profile Information
          </h2>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {formData.isPremium && (
              <span className="inline-block text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
                Premium Cleaner
              </span>
            )}
            {formData.businessInsurance && (
              <span className="inline-block text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                ✔ Insured
              </span>
            )}
            {formData.dbsChecked && (
              <span className="inline-block text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)' }}>
                ✔ DBS Checked
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Real Name */}
            <Field label="Real Name" editMode={editMode}>
              {editMode ? (
                <input className="w-full p-3 bg-white/80 border rounded-lg" value={editData.realName || ''} onChange={(e) => handleInputChange('realName', e.target.value)} />
              ) : <p className="text-gray-800 font-medium">{formData.realName || 'Not set'}</p>}
            </Field>

            {/* Google rating */}
            <Field label="⭐ Google Rating (0–5)" editMode={editMode}>
              {editMode ? (
                <input type="number" step="0.1" min="0" max="5" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.googleReviewRating || ''} onChange={(e) => handleInputChange('googleReviewRating', parseFloat(e.target.value))} />
              ) : <p className="text-gray-800 font-medium">{formData.googleReviewRating ? `${formData.googleReviewRating} / 5` : 'Not set'}</p>}
            </Field>

            {/* Review count */}
            <Field label="🧮 Review Count" editMode={editMode}>
              {editMode ? (
                <input type="number" min="0" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.googleReviewCount || ''} onChange={(e) => handleInputChange('googleReviewCount', parseInt(e.target.value))} />
              ) : <p className="text-gray-800 font-medium">{formData.googleReviewCount ? `${formData.googleReviewCount} reviews` : 'Not set'}</p>}
            </Field>

            {/* Google URL */}
            <Field wide label="🔗 Google Review Link" editMode={editMode}>
              {editMode ? (
                <input type="url" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.googleReviewUrl || ''} onChange={(e) => handleInputChange('googleReviewUrl', e.target.value)} placeholder="https://www.google.com/search?q=your+business" />
              ) : <p className="text-blue-600 underline break-words">{formData.googleReviewUrl || 'Not set'}</p>}
            </Field>

            {/* Company */}
            <Field label="Company Name" editMode={editMode}>
              {editMode ? (
                <input className="w-full p-3 bg-white/80 border rounded-lg" value={editData.companyName || ''} onChange={(e) => handleInputChange('companyName', e.target.value)} />
              ) : <p className="text-gray-800 font-medium">{formData.companyName || 'Not set'}</p>}
            </Field>

            {/* Email */}
            <Field label="Email" editMode={editMode}>
              {editMode ? (
                <input type="email" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} />
              ) : <p className="text-gray-800 font-medium">{formData.email || 'Not set'}</p>}
            </Field>

            {/* Phone */}
            <Field label="Phone" editMode={editMode}>
              {editMode ? (
                <input type="tel" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} />
              ) : <p className="text-gray-800 font-medium">{formData.phone || 'Not set'}</p>}
            </Field>

            {/* Rates */}
            <Field label="Hourly Rate (£)" editMode={editMode}>
              {editMode ? (
                <input type="number" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.rates || ''} onChange={(e) => handleInputChange('rates', e.target.value)} />
              ) : <p className="text-gray-800 font-medium">£{formData.rates ?? '0'}</p>}
            </Field>

            {/* Insurance */}
            <Field label="Business Insurance" editMode={editMode}>
              {editMode ? (
                <select className="w-full p-3 bg-white/80 border rounded-lg" value={editData.businessInsurance ? 'true' : 'false'} onChange={(e) => handleInputChange('businessInsurance', e.target.value === 'true')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : <p className="text-gray-800 font-medium">{formData.businessInsurance ? 'Yes' : 'No'}</p>}
            </Field>

            {/* DBS */}
            <Field label="DBS Checked" editMode={editMode}>
              {editMode ? (
                <select className="w-full p-3 bg-white/80 border rounded-lg" value={editData.dbsChecked ? 'true' : 'false'} onChange={(e) => handleInputChange('dbsChecked', e.target.value === 'true')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : <p className="text-gray-800 font-medium">{formData.dbsChecked ? 'Yes' : 'No'}</p>}
            </Field>

            {/* Services */}
            <Field wide label="Services Offered" editMode={editMode}>
              {editMode ? (
                <input
                  className="w-full p-3 bg-white/80 border rounded-lg"
                  value={editData.services?.join(', ') || ''}
                  onChange={(e) => handleServicesChange(e.target.value)}
                  placeholder="e.g., Deep cleaning, Regular cleaning, Oven clean"
                />
              ) : formData.services?.length ? (
                <div className="flex flex-wrap gap-2">
                  {formData.services.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-800 font-medium">No services listed</p>
              )}
            </Field>

            {/* Profile Image */}
            <Field wide label="📸 Profile Picture" editMode>
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  {(imagePreview || formData.image) ? (
                    <div className="relative">
                      <img
                        src={imagePreview || (formData.image?.trim() ? formData.image : '/default-avatar.png')}
                        alt="Profile"
                        className="w-32 h-32 object-cover rounded-full border-4 border-teal-200 shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-full border-4 border-gray-300 grid place-items-center">
                      <span className="text-gray-500 text-4xl">👤</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setSelectedFile(f); setImagePreview(URL.createObjectURL(f)); }
                    }}
                    className="w-full p-3 bg-white/80 border rounded-lg"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button onClick={handleImageUpload} disabled={!selectedFile || imageUploading} className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg disabled:opacity-50">
                      {imageUploading ? '📤 Uploading...' : '📤 Upload New Picture'}
                    </button>
                    {imagePreview && (
                      <button onClick={() => { setImagePreview(''); setSelectedFile(null); }} className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg">
                        🗑️ Cancel
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-gray-600">📝 Upload a professional headshot. Max 5MB.</p>
                </div>
              </div>
            </Field>

            {/* Address */}
            <Field wide label="📍 Address">
              {editMode ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input className="w-full p-3 bg-white/80 border rounded-lg" placeholder="House/Number" value={editData.address?.houseNameNumber || ''} onChange={(e) => handleInputChange('address.houseNameNumber', e.target.value)} />
                    <input className="w-full p-3 bg-white/80 border rounded-lg" placeholder="Street" value={editData.address?.street || ''} onChange={(e) => handleInputChange('address.street', e.target.value)} />
                    <input className="w-full p-3 bg-white/80 border rounded-lg" placeholder="County" value={editData.address?.county || ''} onChange={(e) => handleInputChange('address.county', e.target.value)} />
                    <input className="w-full p-3 bg-white/80 border rounded-lg" placeholder="Postcode" value={editData.address?.postcode || ''} onChange={(e) => handleInputChange('address.postcode', e.target.value)} />
                  </div>

                  {formData.isPremium && (
                    <div className="pt-4">
                      <label className="text-sm font-medium text-gray-600">🗺️ Additional Postcodes (Premium)</label>
                      <input
                        className="w-full mt-2 px-4 py-2 border rounded-lg"
                        value={postcodeInput}
                        onChange={(e) => setPostcodeInput(e.target.value)}
                        placeholder="e.g. BN1, RH10, GU2"
                      />
                      <p className="text-xs text-gray-500 italic mt-1">Separate with commas.</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-800 font-medium">
                  {formData.address
                    ? `${formData.address.houseNameNumber || ''} ${formData.address.street || ''}, ${formData.address.county || ''} ${formData.address.postcode || ''}`.trim()
                    : 'Address not set'}
                  {formData.isPremium && formData.additionalPostcodes?.length > 0 && (
                    <span className="block text-sm text-gray-600 mt-1">Covers: {formData.additionalPostcodes.join(', ')}</span>
                  )}
                </p>
              )}
            </Field>

            {/* Bio */}
            <Field wide label="📝 Public Bio">
              {editMode ? (
                <textarea
                  rows={4}
                  maxLength={1000}
                  className="w-full p-3 bg-white/80 border rounded-lg resize-none"
                  value={editData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell clients about your experience. Don’t include direct contact details."
                />
              ) : (
                <p className="text-gray-800 font-medium whitespace-pre-wrap">
                  {formData.bio || 'No public bio added yet.'}
                </p>
              )}
            </Field>
          </div>
        </div>

        {/* Availability grid */}
        <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                🗓️ Availability Management
              </h2>
              {formData?.dbsChecked && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white">
                  ✅ DBS Checked
                </span>
              )}
            </div>

            {availabilityChanged && (
              <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg disabled:opacity-50">
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="font-semibold text-gray-700 text-center py-2">Time</div>
                {DAYS.map((d) => (
                  <div key={d} className="font-semibold text-gray-700 text-center py-2 text-sm">
                    {d.slice(0, 3)}
                  </div>
                ))}
              </div>

              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="font-medium text-gray-700 text-center py-3 bg-white/40 rounded-lg">{hour}:00</div>
                  {DAYS.map((day) => {
                    const slot = displayAvailability?.[day]?.[hour];
                    const status = typeof slot === 'object' ? slot.status : slot;

                    const isAvailable = status === true;
                    const isUnavailable = status === 'unavailable';
                    const isPending = status === 'pending' || status === 'pending_approval';
                    const isBooked = status === 'booked';

                    return (
                      <div key={`${day}-${hour}`} className="relative">
                        <button
                          onClick={() => toggleAvailability(day, hour)}
                          disabled={isPending || isBooked}
                          className={`w-full h-12 rounded-lg font-medium text-sm transition-all border-2 ${
                            isAvailable
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400'
                              : isUnavailable
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400'
                              : isPending
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 cursor-not-allowed'
                              : isBooked
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400 cursor-not-allowed'
                              : 'bg-white/40 text-gray-600 border-gray-300'
                          }`}
                          title={
                            isPending ? 'Pending approval' :
                            isBooked ? 'Booked' :
                            isAvailable ? 'Click to mark unavailable' :
                            isUnavailable ? 'Click to mark available' :
                            'Click to toggle'
                          }
                        >
                          {isAvailable && '✓'}
                          {isUnavailable && '✗'}
                          {isPending && '⏳'}
                          {isBooked && '📅'}
                          {!status && '○'}
                        </button>

                        {isPending && (
                          <div className="absolute top-14 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-2 shadow-lg">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleAccept(day, hour)}
                                className="flex-1 px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded text-xs font-medium"
                                title="Accept & capture"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleDecline(day, hour)}
                                className="flex-1 px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded text-xs font-medium"
                                title="Decline & free"
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
          <div className="mt-6 p-4 bg-white/40 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Legend:</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <Legend dotClass="from-green-500 to-green-600 border-green-400" label="Available" />
              <Legend dotClass="from-red-500 to-red-600 border-red-400" label="Unavailable" />
              <Legend dotClass="from-amber-500 to-amber-600 border-amber-400" label="Pending" />
              <Legend dotClass="from-blue-500 to-blue-600 border-blue-400" label="Booked" />
              <Legend dotClass="bg-white/40 border-gray-300" label="Not set" custom />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard icon="📊" title="Profile Views" value={formData.views || 0} />
          <StatCard icon="⭐" title="Rating" value={formData.rating ? `${Number(formData.rating).toFixed(1)}/5` : 'N/A'} />
          <StatCard icon="🏆" title="Completed Jobs" value={formData.completedJobs || 0} />
          <StatCard icon="💎" title="Account Status" value={formData.isPremium ? '✨ Premium' : '🆓 Free'} />
        </div>

        {/* Quick Actions */}
        <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 mt-10">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-6">
            ⚡ Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => window.open('/api/cleaners/export-data', '_blank')}
              className="flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all"
            >
              <span className="text-xl">📄</span>
              <span>Export My Data</span>
            </button>
            <button
              onClick={() => router.push('/cleaners/bookings')}
              className="flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all"
            >
              <span className="text-xl">📋</span>
              <span>View All Bookings</span>
            </button>
            <button
              onClick={() => router.push('/cleaners/earnings')}
              className="flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-xl font-semibold transition-all"
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

/* ---------- UI helpers ---------- */

function Field({ label, children, wide, editMode }) {
  return (
    <div className={wide ? 'space-y-2 md:col-span-2 lg:col-span-3' : 'space-y-2'}>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 text-center hover:-translate-y-1 transition-all">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
        {title}
      </h3>
      <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
  );
}

function Legend({ dotClass, label, custom = false }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded border-2 ${custom ? dotClass : `bg-gradient-to-r ${dotClass}`}`}></div>
      <span className="text-gray-700">{label}</span>
    </div>
  );
}
