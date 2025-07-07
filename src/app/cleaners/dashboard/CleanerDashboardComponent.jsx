'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

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
  
  // Image upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fetchCleaner = async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          const data = await res.json();

          if (!data.success || data.user.type !== 'cleaner') {
            router.push('/login');
            return;
          }

          setCleaner(data.user);
          const cleanerData = {
            ...data.user,
            services: data.user.services || [],
            availability: data.user.availability || {},
            businessInsurance: data.user.businessInsurance || false,
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

      fetchCleaner();
    }
  }, [router]);

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
      const slot = formData.availability?.[day]?.[hour];
      const bookingId = slot?.bookingId;

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
      const slot = formData.availability?.[day]?.[hour];
      const bookingId = slot?.bookingId;

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

  try {
    const res = await fetch(`/api/cleaners/${cleaner._id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        availability: formData.availability, // ✅ Send as-is (no reformatting)
      }),
    });

    if (!res.ok) throw new Error('Update failed');
    setMessage('✅ Changes saved successfully!');
    setAvailabilityChanged(false);
  } catch (err) {
    console.error(err);
    setMessage('❌ Error saving changes.');
  } finally {
    setSaving(false);
  }
};


    if (!res.ok) throw new Error('Update failed');
    setMessage('✅ Changes saved successfully!');
    setAvailabilityChanged(false);
  } catch (err) {
    console.error(err);
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

  // Image upload handler
  const handleUpload = async () => {
    if (!selectedFile) return alert('Please select a file.');
    
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
          alert('Profile picture uploaded successfully!');
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
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-teal-700 mb-2">Cleaner Dashboard</h1>
              <p className="text-gray-600">Manage your cleaning services and availability</p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              {/* Navigation Buttons */}
              <button
                onClick={handleGoHome}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                🏠 Home
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                🔐 Logout
              </button>
              {/* Profile Edit Buttons */}
              <button
                onClick={handleEditToggle}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                {editMode ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              {editMode && (
                <button
                  onClick={handleEditSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 text-center text-white py-3 px-4 rounded-lg font-medium ${
            message.includes('✅') ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {message}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-6">
          <h2 className="text-2xl font-bold text-teal-700 mb-6">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Real Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={editData.realName || ''}
                  onChange={(e) => handleInputChange('realName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              ) : (
                <p className="text-gray-800 font-medium">{formData.realName || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Company Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={editData.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              ) : (
                <p className="text-gray-800 font-medium">
                  {formData.services?.length > 0 ? formData.services.join(', ') : 'No services listed'}
                </p>
              )}
            </div>

            {/* Profile Image Upload */}
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium text-gray-600">Profile Picture</label>
              
              {formData.image && !editMode && (
                <img 
                  src={formData.image} 
                  alt="Profile" 
                  className="w-32 h-32 object-cover rounded-full mb-4 border-4 border-teal-200" 
                />
              )}
              
              {editMode && (
                <>
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  
                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-full border-4 border-teal-200" 
                      />
                    </div>
                  )}
                  
                  {formData.image && !imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Current Profile Picture:</p>
                      <img 
                        src={formData.image} 
                        alt="Current Profile" 
                        className="w-32 h-32 object-cover rounded-full border-4 border-teal-200" 
                      />
                    </div>
                  )}
                  
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile}
                    className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload Profile Picture
                  </button>
                </>
              )}
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium text-gray-600">Address</label>
              {editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={editData.address?.houseNameNumber || ''}
                    onChange={(e) => handleInputChange('address.houseNameNumber', e.target.value)}
                    placeholder="House/Number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <input
                    type="text"
                    value={editData.address?.street || ''}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    placeholder="Street"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <input
                    type="text"
                    value={editData.address?.county || ''}
                    onChange={(e) => handleInputChange('address.county', e.target.value)}
                    placeholder="County"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <input
                    type="text"
                    value={editData.address?.postcode || ''}
                    onChange={(e) => handleInputChange('address.postcode', e.target.value)}
                    placeholder="Postcode"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              ) : (
                <p className="text-gray-800 font-medium">
                  {formData.address?.houseNameNumber} {formData.address?.street}, {formData.address?.county}, {formData.address?.postcode}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Availability Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-teal-700 mb-6">Availability Grid</h2>
          
          {/* Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="grid grid-cols-[120px_repeat(13,_minmax(70px,_1fr))] gap-1 text-sm">
              <div className="p-2 font-bold text-center text-gray-700"></div>
              {hours.map(hour => (
                <div key={hour} className="p-2 text-center font-bold text-gray-700 bg-gray-50 rounded">
                  {hour}:00
                </div>
              ))}

              {days.map(day => (
                <React.Fragment key={day}>
                  <div className="p-2 font-bold text-gray-800 bg-gray-50 rounded flex items-center">
                    {day}
                  </div>
                  {hours.map(hour => {
                    const slot = formData.availability?.[day]?.[hour];
                    const status = typeof slot === 'object' ? slot.status : slot;

                    if (status === 'pending') {
                      return (
                        <div key={`${day}-${hour}`} className="p-2 bg-yellow-400 text-white rounded flex flex-col items-center justify-center min-h-[60px]">
                          <span className="text-xs font-medium mb-1">Pending</span>
                          <div className="flex space-x-1">
                            <button 
                              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs transition-colors" 
                              onClick={() => handleConfirm(day, hour)}
                            >
                              ✔️
                            </button>
                            <button 
                              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors" 
                              onClick={() => handleDecline(day, hour)}
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const isBooked = status === false;
                    const isAvailable = status === true;
                    const isUnavailable = status === 'unavailable';

                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`p-2 min-h-[60px] flex items-center justify-center rounded cursor-pointer transition-all font-medium text-sm ${
                          isBooked
                            ? 'bg-red-600 text-white cursor-not-allowed'
                            : isUnavailable
                              ? 'bg-red-400 text-white hover:bg-red-500'
                              : isAvailable
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        }`}
                        onClick={() => toggleAvailability(day, hour)}
                      >
                        {isBooked ? 'Booked' : isUnavailable ? 'Unavailable' : isAvailable ? 'Available' : 'Set'}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Mobile/Tablet View */}
          <div className="lg:hidden space-y-6">
            {days.map(day => (
              <div key={day} className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">{day}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {hours.map(hour => {
                    const slot = formData.availability?.[day]?.[hour];
                    const status = typeof slot === 'object' ? slot.status : slot;

                    if (status === 'pending') {
                      return (
                        <div key={`${day}-${hour}`} className="p-3 bg-yellow-400 text-white rounded-lg flex flex-col items-center justify-center">
                          <span className="text-xs font-medium mb-2">{hour}:00</span>
                          <span className="text-xs mb-2">Pending</span>
                          <div className="flex space-x-1">
                            <button 
                              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs transition-colors" 
                              onClick={() => handleConfirm(day, hour)}
                            >
                              ✔️
                            </button>
                            <button 
                              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors" 
                              onClick={() => handleDecline(day, hour)}
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const isBooked = status === false;
                    const isAvailable = status === true;
                    const isUnavailable = status === 'unavailable';

                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`p-3 rounded-lg cursor-pointer transition-all text-center font-medium ${
                          isBooked
                            ? 'bg-red-600 text-white cursor-not-allowed'
                            : isUnavailable
                              ? 'bg-red-400 text-white hover:bg-red-500'
                              : isAvailable
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        }`}
                        onClick={() => toggleAvailability(day, hour)}
                      >
                        <div className="text-xs font-bold mb-1">{hour}:00</div>
                        <div className="text-xs">
                          {isBooked ? 'Booked' : isUnavailable ? 'Unavailable' : isAvailable ? 'Available' : 'Set'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg disabled:opacity-50 transition-all"
              disabled={!availabilityChanged || saving}
            >
              {saving ? 'Saving...' : 'Save Availability Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}