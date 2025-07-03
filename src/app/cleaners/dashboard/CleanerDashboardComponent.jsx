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
        } catch {
          router.push('/login');
        } finally {
          setMounted(true);
        }
      };

      fetchCleaner();
    }
  }, [router]);

  useEffect(() => {
    if (!cleaner) return;

    const fetchCleanerDetails = async () => {
      try {
        const res = await fetch(`/api/cleaners?id=${cleaner._id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch cleaner details');

        const data = await res.json();
        if (!data.cleaner) throw new Error('Cleaner data missing');

        setFormData({
          ...data.cleaner,
          services: data.cleaner.services || [],
          availability: data.cleaner.availability || {},
          businessInsurance: data.cleaner.businessInsurance || false,
        });
      } catch (err) {
        console.error(err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchCleanerDetails();
  }, [cleaner, router]);

  const toggleAvailability = (day, hour) => {
    const slot = formData.availability?.[day]?.[hour];
    const status = typeof slot === 'object' ? slot.status : slot;

    if (status === false || status === 'pending') return; // Can't change booked/pending

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
        setFormData(prev => {
          const updated = { ...prev.availability };
          updated[day][hour] = false; // booked
          return { ...prev, availability: updated };
        });
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
        setFormData(prev => {
          const updated = { ...prev.availability };
          updated[day][hour] = true; // available again
          return { ...prev, availability: updated };
        });
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
        body: JSON.stringify(formData),
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

  if (!mounted) return null;
  if (loading || !formData) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-teal-700 py-10 px-4">
      <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-xl">
        <h1 className="text-3xl font-bold text-teal-700 mb-6 text-center">Cleaner Dashboard</h1>

        {message && (
          <div className={`mb-4 text-center text-white py-2 rounded ${message.includes('✅') ? 'bg-green-600' : 'bg-red-600'}`}>
            {message}
          </div>
        )}

        {/* Profile Info Display */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-teal-700 mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div><strong>Real Name:</strong> {formData.realName}</div>
            <div><strong>Company Name:</strong> {formData.companyName}</div>
            <div><strong>Email:</strong> {formData.email}</div>
            <div><strong>Phone:</strong> {formData.phone}</div>
            <div><strong>Hourly Rate:</strong> £{formData.rates}</div>
            <div><strong>Business Insurance:</strong> {formData.businessInsurance ? 'Yes' : 'No'}</div>
            <div className="sm:col-span-2">
              <strong>Services Offered:</strong>{' '}
              {formData.services.length > 0 ? formData.services.join(', ') : 'None'}
            </div>
            <div className="sm:col-span-2">
              <strong>Address:</strong> {formData.address?.houseNameNumber} {formData.address?.street}, {formData.address?.county}, {formData.address?.postcode}
            </div>
          </div>
        </section>

        {/* Availability Grid */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-teal-700 mb-2">Availability Grid</h2>

          <div className="hidden sm:grid grid-cols-[80px_repeat(13,_1fr)] gap-0.5 text-xs">
            <div></div>
            {hours.map(hour => (
              <div key={hour} className="text-center font-bold text-gray-700">{hour}:00</div>
            ))}

            {days.map(day => (
              <React.Fragment key={day}>
                <div className="font-semibold text-gray-800">{day}</div>
                {hours.map(hour => {
                  const slot = formData.availability?.[day]?.[hour];
                  const status = typeof slot === 'object' ? slot.status : slot;

                  if (status === 'pending') {
                    return (
                      <div key={`${day}-${hour}`} className="flex flex-col items-center justify-center bg-yellow-400 text-white rounded p-1">
                        <span>Pending</span>
                        <div className="flex space-x-1 mt-1">
                          <button className="bg-green-600 px-1 rounded" onClick={() => handleConfirm(day, hour)}>✔️</button>
                          <button className="bg-red-600 px-1 rounded" onClick={() => handleDecline(day, hour)}>❌</button>
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
                      className={`h-5 w-full flex items-center justify-center rounded cursor-pointer ${isBooked
                        ? 'bg-red-700 text-white cursor-not-allowed'
                        : isUnavailable
                          ? 'bg-red-500 text-white'
                          : isAvailable
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300'
                        }`}
                      onClick={() => toggleAvailability(day, hour)}
                    >
                      {isBooked ? 'Booked' : isUnavailable ? '❌' : isAvailable ? '✔️' : 'Unavailable'}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile View */}
          <div className="sm:hidden space-y-4 mt-4">
            {days.map(day => (
              <div key={day}>
                <h3 className="text-md font-semibold text-gray-700">{day}</h3>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {hours.map(hour => {
                    const slot = formData.availability?.[day]?.[hour];
                    const status = typeof slot === 'object' ? slot.status : slot;

                    if (status === 'pending') {
                      return (
                        <div key={`${day}-${hour}`} className="flex flex-col items-center justify-center bg-yellow-400 text-white rounded p-1">
                          <span>Pending</span>
                          <div className="flex space-x-1 mt-1">
                            <button className="bg-green-600 px-1 rounded" onClick={() => handleConfirm(day, hour)}>✔️</button>
                            <button className="bg-red-600 px-1 rounded" onClick={() => handleDecline(day, hour)}>❌</button>
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
                        className={`w-full py-0.5 text-center rounded cursor-pointer ${isBooked
                          ? 'bg-red-700 text-white cursor-not-allowed'
                          : isUnavailable
                            ? 'bg-red-500 text-white'
                            : isAvailable
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300'
                          }`}
                        onClick={() => toggleAvailability(day, hour)}
                      >
                        {isBooked ? `${hour}:00 Booked` : isUnavailable ? `${hour}:00 ❌` : isAvailable ? `${hour}:00 ✔️` : `${hour}:00 Unavailable`}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg shadow disabled:opacity-50"
            disabled={!availabilityChanged || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
