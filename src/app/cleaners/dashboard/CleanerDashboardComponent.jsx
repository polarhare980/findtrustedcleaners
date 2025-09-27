'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { secureFetch } from '@/lib/secureFetch';

// -------------------- Constants (match Profile) --------------------
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 7..19

const BOOKED_STATUSES = new Set(['approved','accepted','confirmed','booked']);
const PENDING_STATUSES = new Set(['pending','pending_approval']);

const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`;

// -------------------- Date helpers for week selector --------------------
function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0,0,0,0);
  return date;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function addWeeks(date, w) {
  return addDays(date, w * 7);
}
function fmtShort(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // e.g., 19 Aug
}
function fmtRangeLabel(monday) {
  const start = fmtShort(monday);
  const end = fmtShort(addDays(monday, 6));
  return `${start} – ${end}`;
}
function toISODate(d) {
  const z = new Date(d);
  z.setHours(0,0,0,0);
  return z.toISOString().slice(0,10); // YYYY-MM-DD
}
function getWeekISODates(mondayDate) {
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(mondayDate, i)));
}

// -------------------- Overlay Builders (from combined API) --------------------
function buildOverlayMaps(combined = []) {
  const pendingKeyToPurchaseId = new Map(); // `${day}|${hour}` -> purchaseId
  const bookedKeys = new Set();             // `${day}|${hour}`

  for (const row of combined) {
    const day = row?.day;
    const hour = String(row?.hour ?? '');
    if (!day || !hour) continue;

    const key = `${day}|${hour}`;
    const status = String(row?.status || '').toLowerCase();

    if (PENDING_STATUSES.has(status)) {
      pendingKeyToPurchaseId.set(key, String(row?._id || ''));
    } else if (BOOKED_STATUSES.has(status)) {
      bookedKeys.add(key);
    }
  }

  return { pendingKeyToPurchaseId, bookedKeys };
}

/**
 * Build the week view by:
 * 1) start from base weekly pattern (Mon..Sun)
 * 2) apply date-specific overrides for each calendar day (YYYY-MM-DD)
 * 3) overlay pending/booked (from purchases/bookings)
 *
 * Result shape: { [dayName]: { [hourStr]: true|false|'unavailable'|{status} } }
 */
function composeWeekView(baseWeekly = {}, overridesByISO = {}, mondayDate, overlays) {
  const { pendingKeyToPurchaseId, bookedKeys } = overlays;
  const weekISO = getWeekISODates(mondayDate);
  const out = {};

  DAYS.forEach((dayName, idx) => {
    const iso = weekISO[idx];
    const baseDay = baseWeekly?.[dayName] || {};
    const overrideDay = overridesByISO?.[iso] || {};
    out[dayName] = {};

    HOURS.forEach((h) => {
      const hour = String(h);
      // Start from base
      let val = baseDay?.[hour];
      // Apply override if present
      if (Object.prototype.hasOwnProperty.call(overrideDay, hour)) {
        val = overrideDay[hour];
      }

      // Overlay precedence: booked > pending > base/override
      const overlayKey = `${dayName}|${hour}`;
      if (bookedKeys.has(overlayKey)) {
        out[dayName][hour] = { status: 'booked' };
      } else if (pendingKeyToPurchaseId.has(overlayKey)) {
        out[dayName][hour] = { status: 'pending', bookingId: pendingKeyToPurchaseId.get(overlayKey) };
      } else {
        out[dayName][hour] = val; // true | false | 'unavailable' | undefined
      }
    });
  });

  return out;
}

// -------------------- Component --------------------
export default function CleanerDashboard() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState(null);                 // logged-in cleaner doc (auth/me)
  const [formData, setFormData] = useState(null);     // editor state (includes availability)
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [combined, setCombined] = useState([]);       // bookings + pending purchases
  const overlays = useMemo(() => buildOverlayMaps(combined), [combined]);

  // Client-side copy of overrides we edit before saving
  const [editOverrides, setEditOverrides] = useState({});

  // Week selector state
  const [weekOffset, setWeekOffset] = useState(0); // 0=this week
  const mondayThisWeek = useMemo(() => getMonday(new Date()), []);
  const mondaySelected = useMemo(() => addWeeks(mondayThisWeek, weekOffset), [mondayThisWeek, weekOffset]);

  // NEW: when true, even week 0 writes overrides (doesn't touch base template)
  const [editThisWeekOnly, setEditThisWeekOnly] = useState(true);

  const displayAvailability = useMemo(
    () => composeWeekView(formData?.availability || {}, editOverrides || {}, mondaySelected, overlays),
    [formData?.availability, editOverrides, mondaySelected, overlays]
  );

  const [availabilityChanged, setAvailabilityChanged] = useState(false);

  // Profile image upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  // Delete profile
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // --- Gallery UX state / handlers ---
  const fileInputRef = useRef(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [galleryDirty, setGalleryDirty] = useState(false);

  function openFilePicker() {
    fileInputRef.current?.click();
  }
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function uploadSingleFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || !data?.success || !data?.url) {
      throw new Error(data?.message || 'Upload failed');
    }
    return { url: data.url, public_id: data.public_id, hasText: false };
  }

  async function handleGalleryFiles(files) {
    if (!files?.length) return;
    setGalleryUploading(true);
    setGalleryProgress(0);

    const list = Array.from(files);
    const out = [];
    for (let i = 0; i < list.length; i++) {
      try {
        const uploaded = await uploadSingleFile(list[i]);
        out.push(uploaded);
        setGalleryProgress(Math.round(((i + 1) / list.length) * 100));
      } catch (err) {
        console.error('Gallery upload error:', err);
        alert(`Failed to upload ${list[i]?.name || 'a file'}.`);
      }
    }

    if (out.length) {
      setEditData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...out],
      }));
      setGalleryDirty(true);
    }

    setGalleryUploading(false);
    setGalleryProgress(0);
  }

  async function handleSaveGallery() {
    try {
      const res = await fetch(`/api/cleaners/${me._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: editData.photos || [] }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || 'Failed to save gallery');

      // sync
      setFormData(prev => ({ ...prev, photos: editData.photos || [] }));
      setMessage('✅ Gallery saved.');
      setGalleryDirty(false);
    } catch (e) {
      console.error(e);
      setMessage('❌ Error saving gallery.');
    }
  }

  // DELETE via your existing POST route that expects { public_id }
  async function handleDeletePhoto(ph, index) {
    // If no public_id (legacy uploads), just remove locally and Save Gallery will persist.
    if (!ph.public_id) {
      setEditData(prev => ({
        ...prev,
        photos: (prev.photos || []).filter((_, i) => i !== index),
      }));
      setGalleryDirty(true);
      return;
    }

    const prevPhotos = editData.photos || [];
    const nextPhotos = prevPhotos.filter((_, i) => i !== index);
    setEditData(prev => ({ ...prev, photos: nextPhotos }));

    try {
      const res = await fetch('/api/delete-photo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: ph.public_id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.success) {
        throw new Error(j?.message || 'Delete failed');
      }
      // Keep UI in sync; server already removed from DB
      setFormData(prev => ({ ...prev, photos: nextPhotos }));
      setMessage('✅ Photo deleted.');
      setGalleryDirty(false); // deletion persisted
    } catch (err) {
      console.error('Delete photo error:', err);
      // rollback
      setEditData(prev => ({ ...prev, photos: prevPhotos }));
      setMessage('❌ Failed to delete photo. Try again.');
    }
  }

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

        // Seed dashboard state (now includes availabilityOverrides)
        const seed = {
          ...cleanerUser,
          services: cleanerUser.services || [],
          servicesDetailed: cleanerUser.servicesDetailed || [],
          photos: cleanerUser.photos || [],
          availability: cleanerUser.availability || {},
          availabilityOverrides: cleanerUser.availabilityOverrides || {},
          businessInsurance: !!cleanerUser.businessInsurance,
          dbsChecked: !!cleanerUser.dbsChecked,
          bio: cleanerUser.bio || '',
        };
        setFormData(seed);
        setEditData(seed);
        setEditOverrides(seed.availabilityOverrides || {});
      } catch (e) {
        console.error('Dashboard init failed:', e);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Toggle availability for a specific day/hour
  const toggleAvailability = (day, hourNumber) => {
    const hour = String(hourNumber);
    const slot = displayAvailability?.[day]?.[hour];
    const status = typeof slot === 'object' ? slot.status : slot;

    // Pending/booked overlays cannot be toggled
    if (status === 'pending' || status === 'booked') return;

    // Decide if we write base weekly pattern or date-specific override
    const useOverrides = (weekOffset !== 0) || editThisWeekOnly;

    if (!useOverrides) {
      // Modify base weekly pattern
      setFormData(prev => {
        const nextAvail = { ...(prev.availability || {}) };
        if (!nextAvail[day]) nextAvail[day] = {};
        const current = nextAvail[day][hour];
        const currentVal = typeof current === 'object' ? current?.status : current;

        if (currentVal === true || currentVal === 'available') {
          nextAvail[day][hour] = 'unavailable';
        } else {
          nextAvail[day][hour] = true;
        }
        return { ...prev, availability: nextAvail };
      });
    } else {
      // Write a date-specific override for the selected week (including week 0 when toggle is on)
      const isoByDay = getWeekISODates(mondaySelected);
      const dayIdx = DAYS.indexOf(day);
      const isoDate = isoByDay[dayIdx];

      // What is currently visible? (true | false | 'unavailable' | undefined)
      const visible = typeof status === 'object' ? undefined : status;
      const nextVal = (visible === true || visible === 'available') ? 'unavailable' : true;

      setEditOverrides(prev => {
        const next = { ...(prev || {}) };
        const dayMap = { ...(next[isoDate] || {}) };

        // Compare against base weekly value to store only differences
        const baseVal = formData?.availability?.[day]?.[hour];

        if (nextVal === baseVal) {
          // Same as base => remove override
          delete dayMap[hour];
        } else {
          dayMap[hour] = nextVal;
        }

        if (Object.keys(dayMap).length === 0) {
          delete next[isoDate];
        } else {
          next[isoDate] = dayMap;
        }
        return next;
      });
    }

    setAvailabilityChanged(true);
    setMessage('');
  };

  // Accept pending (uses purchaseId from overlay map)
  const handleAccept = async (day, hourNumber) => {
    const hour = String(hourNumber);
    const key = `${day}|${hour}`;
    const purchaseId = overlays.pendingKeyToPurchaseId.get(key);
    if (!purchaseId) {
      alert('No pending request found for this slot.');
      return;
    }
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/approve`, { method: 'PUT', credentials: 'include' });
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
  const handleDecline = async (day, hourNumber) => {
    const hour = String(hourNumber);
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

  // Save base or overrides depending on selected week
  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const useOverrides = (weekOffset !== 0) || editThisWeekOnly;

      if (!useOverrides) {
        // Save base weekly pattern using existing endpoint
        const res = await fetch(`/api/bookings/cleaner/${me._id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ availability: formData.availability }),
        });
        const j = await res.json();
        if (!res.ok || !j?.success) throw new Error(j?.message || 'Update failed');

        setFormData((prev) => ({ ...prev, availability: j.cleaner?.availability || prev.availability }));
      } else {
        // Save date-specific overrides back to the Cleaner document
        const res = await fetch(`/api/cleaners/${me._id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ availabilityOverrides: editOverrides }),
        });
        if (!res.ok) throw new Error('Update overrides failed');

        setFormData((prev) => ({ ...prev, availabilityOverrides: editOverrides }));
      }

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

  // Profile picture upload
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

  // Week navigation (limit by premium status)
  const canGoPrev = weekOffset > 0; // lock to current+future; disable past weeks
  const maxAhead = formData?.isPremium ? 3 : 0; // 0=only this week; 3=+3 weeks => total 4
  const canGoNext = weekOffset < maxAhead;

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
              <button onClick={() => router.push('/')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300">
                🏠 Home
              </button>
              <button onClick={async () => { try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } finally { router.push('/login'); } }} className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-300">
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
                  onClick={async () => {
                    if (deleteConfirmText !== 'DELETE') { alert('Please type DELETE to confirm'); return; }
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
                  }}
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
            <p className="text-sm mb-3">Upgrade to set your diary up to <strong>4 weeks ahead</strong> and get a gallery.</p>
            <button
              onClick={async () => {
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
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-2 rounded-lg"
            >
              💎 Upgrade to Premium (£7.99/month)
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-400/20 to-green-500/20 backdrop-blur-md border border-green-400/30 text-green-800 px-4 py-3 rounded-lg mb-6 font-semibold">
            ✨ You are a Premium Cleaner! You can schedule up to 4 weeks ahead.
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
            <Field label="Real Name" editMode={editMode}>
              {editMode ? (
                <input className="w-full p-3 bg-white/80 border rounded-lg" value={editData.realName || ''} onChange={(e) => handleInputChange('realName', e.target.value)} />
              ) : <p className="text-gray-800 font-medium">{formData.realName || 'Not set'}</p>}
            </Field>

            <Field label="⭐ Google Rating (0–5)" editMode={editMode}>
              {editMode ? (
                <input type="number" step="0.1" min="0" max="5" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.googleReviewRating || ''} onChange={(e) => handleInputChange('googleReviewRating', parseFloat(e.target.value))} />
              ) : <p className="text-gray-800 font-medium">{formData.googleReviewRating ? `${formData.googleReviewRating} / 5` : 'Not set'}</p>}
            </Field>

            <Field label="🧮 Review Count" editMode={editMode}>
              {editMode ? (
                <input type="number" min="0" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.googleReviewCount || ''} onChange={(e) => handleInputChange('googleReviewCount', parseInt(e.target.value))} />
              ) : <p className="text-gray-800 font-medium">{formData.googleReviewCount ? `${formData.googleReviewCount} reviews` : 'Not set'}</p>}
            </Field>

            <Field wide label="🔗 Google Review Link" editMode={editMode}>
              {editMode ? (
                <input type="url" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.googleReviewUrl || ''} onChange={(e) => handleInputChange('googleReviewUrl', e.target.value)} placeholder="https://www.google.com/search?q=your+business" />
              ) : <p className="text-blue-600 underline break-words">{formData.googleReviewUrl || 'Not set'}</p>}
            </Field>

            <Field label="Company Name" editMode={editMode}>
              {editMode ? (
                <input className="w-full p-3 bg-white/80 border rounded-lg" value={editData.companyName || ''} onChange={(e) => handleInputChange('companyName', e.target.value)} />
              ) : <p className="text-gray-800 font-medium">{formData.companyName || 'Not set'}</p>}
            </Field>

            <Field label="Email" editMode={editMode}>
              {editMode ? (
                <input type="email" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} />
              ) : <p className="text-gray-800 font-medium">{formData.email || 'Not set'}</p>}
            </Field>

            <Field label="Phone" editMode={editMode}>
              {editMode ? (
                <input type="tel" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} />
              ) : <p className="text-gray-800 font-medium">{formData.phone || 'Not set'}</p>}
            </Field>

            <Field label="Hourly Rate (£)" editMode={editMode}>
              {editMode ? (
                <input type="number" className="w-full p-3 bg-white/80 border rounded-lg" value={editData.rates || ''} onChange={(e) => handleInputChange('rates', e.target.value)} />
              ) : <p className="text-gray-800 font-medium">£{formData.rates ?? '0'}</p>}
            </Field>

            <Field label="Business Insurance" editMode={editMode}>
              {editMode ? (
                <select className="w-full p-3 bg-white/80 border rounded-lg" value={editData.businessInsurance ? 'true' : 'false'} onChange={(e) => handleInputChange('businessInsurance', e.target.value === 'true')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : <p className="text-gray-800 font-medium">{formData.businessInsurance ? 'Yes' : 'No'}</p>}
            </Field>

            <Field label="DBS Checked" editMode={editMode}>
              {editMode ? (
                <select className="w-full p-3 bg-white/80 border rounded-lg" value={editData.dbsChecked ? 'true' : 'false'} onChange={(e) => handleInputChange('dbsChecked', e.target.value === 'true')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : <p className="text-gray-800 font-medium">{formData.dbsChecked ? 'Yes' : 'No'}</p>}
            </Field>

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
                </>
              ) : (
                <p className="text-gray-800 font-medium">
                  {formData.address
                    ? `${formData.address.houseNameNumber || ''} ${formData.address.street || ''}, ${formData.address.county || ''} ${formData.address.postcode || ''}`.trim()
                    : 'Address not set'}
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

        {/* Services & Duration (everyone) */}
        <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl mb-6 p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4">
            🧹 Services & Duration
          </h2>

          {editMode ? (
            <div className="space-y-4">
              {(editData.servicesDetailed || []).map((svc, idx) => (
                <div key={idx} className="p-4 bg-white/70 rounded-xl border border-gray-200 space-y-2">
                  {/* Service Name */}
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Service Name"
                    value={svc.name || ''}
                    onChange={(e) => {
                      const next = [...editData.servicesDetailed];
                      next[idx].name = e.target.value;
                      setEditData({ ...editData, servicesDetailed: next });
                    }}
                  />

                  {/* Grid of numeric fields */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <input
                      type="number"
                      className="p-2 border rounded"
                      placeholder="Default Duration (mins)"
                      value={svc.defaultDurationMins ?? ''}
                      onChange={(e) => {
                        const next = [...editData.servicesDetailed];
                        next[idx].defaultDurationMins = e.target.value;
                        setEditData({ ...editData, servicesDetailed: next });
                      }}
                    />
                    <input
                      type="number"
                      className="p-2 border rounded"
                      placeholder="Buffer Before (mins)"
                      value={svc.bufferBeforeMins ?? ''}
                      onChange={(e) => {
                        const next = [...editData.servicesDetailed];
                        next[idx].bufferBeforeMins = e.target.value;
                        setEditData({ ...editData, servicesDetailed: next });
                      }}
                    />
                    <input
                      type="number"
                      className="p-2 border rounded"
                      placeholder="Buffer After (mins)"
                      value={svc.bufferAfterMins ?? ''}
                      onChange={(e) => {
                        const next = [...editData.servicesDetailed];
                        next[idx].bufferAfterMins = e.target.value;
                        setEditData({ ...editData, servicesDetailed: next });
                      }}
                    />
                    <input
                      type="number"
                      className="p-2 border rounded"
                      placeholder="Increment (mins)"
                      value={svc.incrementMins ?? ''}
                      onChange={(e) => {
                        const next = [...editData.servicesDetailed];
                        next[idx].incrementMins = e.target.value;
                        setEditData({ ...editData, servicesDetailed: next });
                      }}
                    />
                    <input
                      type="number"
                      className="p-2 border rounded"
                      placeholder="Min Duration (mins)"
                      value={svc.minDurationMins ?? ''}
                      onChange={(e) => {
                        const next = [...editData.servicesDetailed];
                        next[idx].minDurationMins = e.target.value;
                        setEditData({ ...editData, servicesDetailed: next });
                      }}
                    />
                    <input
                      type="number"
                      className="p-2 border rounded"
                      placeholder="Max Duration (mins)"
                      value={svc.maxDurationMins ?? ''}
                      onChange={(e) => {
                        const next = [...editData.servicesDetailed];
                        next[idx].maxDurationMins = e.target.value;
                        setEditData({ ...editData, servicesDetailed: next });
                      }}
                    />
                  </div>

                  {/* Active toggle */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={svc.active !== false}
                      onChange={(e) => {
                        const next = [...editData.servicesDetailed];
                        next[idx].active = e.target.checked;
                        setEditData({ ...editData, servicesDetailed: next });
                      }}
                    />
                    Active
                  </label>

                  {/* Remove button */}
                  <button
                    className="text-red-600 text-sm"
                    onClick={() => {
                      const next = [...editData.servicesDetailed];
                      next.splice(idx, 1);
                      setEditData({ ...editData, servicesDetailed: next });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {/* Add new service */}
              <button
                className="px-4 py-2 bg-teal-600 text-white rounded"
                onClick={() =>
                  setEditData({
                    ...editData,
                    servicesDetailed: [
                      ...(editData.servicesDetailed || []),
                      {
                        name: '',
                        defaultDurationMins: '',
                        bufferBeforeMins: '',
                        bufferAfterMins: '',
                        incrementMins: '',
                        minDurationMins: '',
                        maxDurationMins: '',
                        active: true,
                      },
                    ],
                  })
                }
              >
                ➕ Add Service
              </button>
            </div>
          ) : (
            <>
              {(formData.servicesDetailed || []).filter((s) => s.active !== false).length > 0 ? (
                <ul className="list-disc list-inside text-gray-800">
                  {formData.servicesDetailed.map((svc, i) => (
                    <li key={i}>
                      {svc.name} ({svc.defaultDurationMins || 60} mins)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No detailed services listed</p>
              )}
            </>
          )}
        </div>

        {/* Gallery (Premium only) */}
        {formData.isPremium && (
          <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl mb-6 p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                🖼️ Gallery (Premium)
              </h2>

              {editMode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openFilePicker}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-medium"
                  >
                    ➕ Insert picture
                  </button>
                  <button
                    onClick={handleSaveGallery}
                    disabled={!galleryDirty || galleryUploading}
                    className={`px-4 py-2 rounded-lg text-white font-medium ${galleryDirty && !galleryUploading ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                    title={galleryDirty ? 'Save gallery changes' : 'No changes to save'}
                  >
                    {galleryUploading ? '⏳ Uploading...' : '💾 Save Gallery'}
                  </button>
                </div>
              )}
            </div>

            {/* Hidden file input for button */}
            {editMode && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleGalleryFiles(e.target.files)}
                className="hidden"
              />
            )}

            {/* Drop zone */}
            {editMode && (
              <div
                onDragEnter={preventDefaults}
                onDragOver={preventDefaults}
                onDragLeave={preventDefaults}
                onDrop={(e) => {
                  preventDefaults(e);
                  const files = e.dataTransfer?.files;
                  handleGalleryFiles(files);
                }}
                className="border-2 border-dashed border-teal-300 rounded-xl p-6 text-center bg-white/60"
              >
                <p className="text-gray-700 font-medium mb-1">Drag & drop photos here</p>
                <p className="text-sm text-gray-500">or click <span className="underline cursor-pointer" onClick={openFilePicker}>Insert picture</span></p>

                {galleryUploading && (
                  <div className="mt-4">
                    <div className="w-full h-3 bg-gray-200 rounded">
                      <div className="h-3 bg-teal-500 rounded" style={{ width: `${galleryProgress}%` }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{galleryProgress}%</p>
                  </div>
                )}
              </div>
            )}

            {/* Thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
              {(editMode ? (editData.photos || []) : (formData.photos || [])).map((ph, i) => (
                <div key={ph.public_id || ph.url || i} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white">
                  <img
                    src={ph.url}
                    alt={`Gallery ${i}`}
                    className="w-full h-36 object-cover"
                    loading="lazy"
                  />

                  {editMode && (
                    <button
                      className="absolute top-2 right-2 bg-red-600/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                      onClick={() => handleDeletePhoto(ph, i)}
                      title="Delete from gallery"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {/* Empty state */}
              {((editMode ? editData.photos : formData.photos) || []).length === 0 && (
                <div className="col-span-full">
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center bg-white/60">
                    <p className="text-gray-700 font-medium">No photos yet</p>
                    {editMode && (
                      <button
                        onClick={openFilePicker}
                        className="mt-3 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-medium"
                      >
                        ➕ Insert your first picture
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Tip: Add before/after shots and a clean team photo. Keep files under 5MB for best performance.
            </p>
          </div>
        )}

        {/* Availability grid — honours overrides; week-0 override toggle */}
        <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl mb-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
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

            {/* Week Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                disabled={!canGoPrev}
                className={`px-3 py-2 rounded-lg border ${canGoPrev ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                title="Previous week (disabled)"
              >
                ◀
              </button>
              <div className="px-3 py-2 rounded-lg bg-white/70 border font-medium">
                Week of {fmtRangeLabel(mondaySelected)}
                {!formData.isPremium && <span className="ml-2 text-xs text-amber-700">(Free: this week only)</span>}
              </div>
              <button
                onClick={() => setWeekOffset((w) => Math.min(maxAhead, w + 1))}
                disabled={!canGoNext}
                className={`px-3 py-2 rounded-lg border ${canGoNext ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                title={canGoNext ? 'Next week' : 'Upgrade to view more weeks'}
              >
                ▶
              </button>

              {formData?.isPremium && (
                <label className="ml-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editThisWeekOnly}
                    onChange={(e) => setEditThisWeekOnly(e.target.checked)}
                  />
                  Edit only this week
                </label>
              )}

              {availabilityChanged && (
                <button onClick={handleSave} disabled={saving} className="ml-3 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg disabled:opacity-50">
                  {saving ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header row with dates */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="font-semibold text-gray-700 text-center py-2">Time</div>
                {DAYS.map((d, idx) => {
                  const dateForDay = addDays(mondaySelected, idx);
                  return (
                    <div key={d} className="font-semibold text-gray-700 text-center py-2 text-sm">
                      <div>{d.slice(0, 3)}</div>
                      <div className="text-xs text-gray-500">{fmtShort(dateForDay)}</div>
                    </div>
                  );
                })}
              </div>

              {HOURS.map((h) => (
                <div key={h} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="font-medium text-gray-700 text-center py-3 bg-white/40 rounded-lg">{hourLabel(h)}</div>
                  {DAYS.map((day) => {
                    const slot = displayAvailability?.[day]?.[String(h)];
                    const statusVal = typeof slot === 'object' ? slot?.status : slot;

                    // New: separate overlay-booked vs base-unavailable
                    const isPending = statusVal === 'pending' || statusVal === 'pending_approval';
                    const isBookedOverlay = statusVal === 'booked';
                    const isUnavailable = statusVal === false || statusVal === 'unavailable';
                    const isAvailable = statusVal === true || statusVal === 'available';

                    return (
                      <div key={`${day}-${h}`} className="relative">
                        <button
                          onClick={() => toggleAvailability(day, h)}
                          disabled={isPending || isBookedOverlay}
                          className={`w-full h-12 rounded-lg font-medium text-sm transition-all border-2 ${
                            isBookedOverlay
                              ? 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed'   // overlay booked
                              : isPending
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300 cursor-not-allowed' // overlay pending
                              : isAvailable
                              ? 'bg-green-100 text-green-800 border-green-300'                 // editable
                              : isUnavailable
                              ? 'bg-gray-100 text-gray-600 border-gray-300'                    // editable
                              : 'bg-gray-100 text-gray-600 border-gray-300'                    // not set
                          }`}
                          title={
                            isPending ? 'Pending request'
                            : isBookedOverlay ? 'Booked'
                            : isAvailable ? 'Click to mark unavailable'
                            : 'Click to mark available'
                          }
                        >
                          {isAvailable ? '•' : isPending ? '⏳' : isBookedOverlay ? '✗' : '○'}
                        </button>

                        {isPending && (
                          <div className="absolute top-14 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-2 shadow-lg">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleAccept(day, h)}
                                className="flex-1 px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded text-xs font-medium"
                                title="Accept & capture"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleDecline(day, h)}
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
              <Legend swatchClass="bg-green-100 border-green-300" label="Available" />
              <Legend swatchClass="bg-yellow-100 border-yellow-300" label="Pending" />
              <Legend swatchClass="bg-red-100 border-red-300" label="Booked (locked)" />
              <Legend swatchClass="bg-gray-100 border-gray-300" label="Unavailable / Not set" />
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
        <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-XL p-6 mt-10">
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
    <div className="bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 text-center hover:-translate-y-1 transition-all">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
        {title}
      </h3>
      <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
  );
}

function Legend({ swatchClass, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded border ${swatchClass}`}></div>
      <span className="text-gray-700">{label}</span>
    </div>
  );
}
