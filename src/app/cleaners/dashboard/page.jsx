'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner'; // ✅ Loading component

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 13 }, (_, i) => `${7 + i}`);

// ✅ SEO Meta Tags
export const metadata = {
  title: 'Cleaner Dashboard | Find Trusted Cleaners',
  description: 'Manage your availability and cleaner profile on Find Trusted Cleaners.',
};

export default function CleanerDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cleaner, setCleaner] = useState(null);
  const [formData, setFormData] = useState({});
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
            router.push('/login/cleaners');
          } else {
            setCleaner(data.user);
          }
        } catch (err) {
          console.error('Error fetching cleaner:', err);
          router.push('/login/cleaners');
        } finally {
          setMounted(true);
        }
      };

      fetchCleaner();
    }
  }, [router]);

  useEffect(() => {
    const fetchCleanerDetails = async () => {
      try {
        const res = await fetch(`/api/cleaners?id=${cleaner.id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch cleaner');
        const data = await res.json();
        setFormData({
          ...data,
          services: data.services || [],
          availability: data.availability || {},
          allowPending: data.allowPending || false,
          googleReviewUrl: data.googleReviewUrl || '',
          facebookReviewUrl: data.facebookReviewUrl || '',
          embedCode: data.embedCode || '',
          image: data.image || '',
        });
      } catch (err) {
        console.error(err);
        router.push('/login/cleaners');
      } finally {
        setLoading(false);
      }
    };

    if (cleaner) fetchCleanerDetails();
  }, [cleaner, router]);

  const toggleAvailability = (day, hour) => {
    const isBooked = formData.availability?.[day]?.[hour] === false;
    if (isBooked) return;

    setFormData(prev => {
      const updated = { ...prev.availability };
      if (!updated[day]) {
        updated[day] = {};
      }
      updated[day][hour] = updated[day][hour] === true ? 'unavailable' : true;
      return { ...prev, availability: updated };
    });

    setAvailabilityChanged(true);
    setMessage('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cleaners/${cleaner.id}`, {
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
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-xl">
      <h1 className="text-3xl font-bold text-teal-700 mb-6 text-center">Cleaner Dashboard</h1>

      {message && (
        <div className={`mb-4 text-center text-white py-2 rounded ${message.includes('✅') ? 'bg-green-600' : 'bg-red-600'}`}>
          {message}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-teal-700 mb-2">Availability Grid</h2>

        <div className="hidden sm:grid grid-cols-[80px_repeat(13,_1fr)] gap-1 text-sm">
          <div></div>
          {hours.map(hour => (
            <div key={hour} className="text-center font-bold text-gray-700">{hour}:00</div>
          ))}

          {days.map(day => (
            <React.Fragment key={day}>
              <div className="font-semibold text-gray-800">{day}</div>
              {hours.map(hour => {
                const isAvailable = formData.availability?.[day]?.[hour] === true;
                const isBooked = formData.availability?.[day]?.[hour] === false;

                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`h-8 w-full flex items-center justify-center rounded cursor-pointer ${isBooked
                      ? 'bg-red-500 text-white cursor-not-allowed'
                      : isAvailable
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300'
                      }`}
                    onClick={() => toggleAvailability(day, hour)}
                  >
                    {isBooked ? 'Booked' : isAvailable ? 'Available' : 'Unavailable'}
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
              <div className="grid grid-cols-3 gap-2 text-sm">
                {hours.map(hour => {
                  const isAvailable = formData.availability?.[day]?.[hour] === true;
                  const isBooked = formData.availability?.[day]?.[hour] === false;

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`w-full py-1 text-center rounded cursor-pointer ${isBooked
                        ? 'bg-red-500 text-white cursor-not-allowed'
                        : isAvailable
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300'
                        }`}
                      onClick={() => toggleAvailability(day, hour)}
                    >
                      {isBooked ? `${hour}:00 Booked` : isAvailable ? `${hour}:00 Available` : `${hour}:00 Unavailable`}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

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
  );
}
