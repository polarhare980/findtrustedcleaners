"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 13 }, (_, i) => `${7 + i}:00`);
const allServices = ['Oven Cleaning', 'Carpet Cleaning', 'Window Cleaning', 'White Goods', 'End of Tenancy'];

export default function CleanerDashboard() {
  const router = useRouter();
  const id = localStorage.getItem('cleanerId');

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [availabilityChanged, setAvailabilityChanged] = useState(false);

  useEffect(() => {
    const fetchCleaner = async () => {
      try {
        const res = await fetch(`/api/cleaners?id=${id}`);
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
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCleaner();
  }, [id, router]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!id) return;

      try {
        const res = await fetch(`/api/bookings/cleaner/${id}`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error('Error fetching bookings:', err.message);
      }
    };

    fetchBookings();
  }, [id]);

  const handleBookingUpdate = async (bookingId, newStatus) => {
    const confirmMessage =
      newStatus === 'accepted'
        ? 'Are you sure you want to ACCEPT this booking?'
        : 'Are you sure you want to REJECT this booking?';

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/bookings/update/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update booking');

      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
      alert(`Booking ${newStatus}`);
    } catch (err) {
      console.error('Error updating booking:', err.message);
      alert('There was a problem updating the booking.');
    }
  };

  const handleAcceptOrder = async () => {
    if (!availabilityChanged) return;

    try {
      const res = await fetch(`/api/bookings/accept-order/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Cleaner accepted order after availability update.' }),
      });

      if (!res.ok) throw new Error('Failed to accept order.');

      alert('Order accepted successfully!');
      setAvailabilityChanged(false);
    } catch (err) {
      console.error('Error accepting order:', err.message);
      alert('There was a problem accepting the order.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleService = (service) => {
    setFormData(prev => {
      const updated = prev.services?.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...(prev.services || []), service];
      return { ...prev, services: updated };
    });
  };

  const toggleAvailability = (day, hour) => {
    const key = `${day}-${hour}`;
    setFormData(prev => {
      const updated = { ...prev.availability };
      updated[key] = updated[key] === 'unavailable' ? 'available' : 'unavailable';
      return { ...prev, availability: updated };
    });
    setAvailabilityChanged(true);
  };

  const handlePendingSwitch = () => {
    setFormData(prev => ({
      ...prev,
      allowPending: !prev.allowPending,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    setUploading(true);

    const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
    const data = await res.json();

    if (data.success) {
      setFormData(prev => ({ ...prev, image: data.url }));
    } else {
      alert('Image upload failed.');
    }

    setUploading(false);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/cleaners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Update failed');
      alert('Changes saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving changes.');
    }
  };

  if (loading || !formData) return <p className="p-10 text-center text-teal-700 font-semibold">Loading dashboard...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow-lg rounded-lg mt-6 border border-gray-200">
      <h1 className="text-3xl font-bold text-teal-700 mb-6">Cleaner Dashboard</h1>

      <button
        onClick={() => {
          localStorage.removeItem('cleanerId');
          window.location.href = '/login';
        }}
        className="mb-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
      >
        Logout
      </button>

      <button
        onClick={handleAcceptOrder}
        className={`mb-6 ${availabilityChanged ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white px-6 py-2 rounded shadow`}
        disabled={!availabilityChanged}
      >
        Accept Order
      </button>
      {/* Cleaner Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[{ label: 'Full Name', name: 'realName' }, { label: 'Company Name', name: 'companyName' }, { label: 'Postcode', name: 'postcode' }, { label: 'Email', name: 'email' }, { label: 'Phone Number', name: 'phone' }, { label: 'Hourly Rate (£)', name: 'rates' }].map(({ label, name }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={name === 'rate' ? 'number' : 'text'}
              name={name}
              value={formData[name] || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-teal-300 rounded focus:ring-2 focus:ring-teal-400"
            />
          </div>
        ))}
      </div>

      {/* Profile Picture Upload */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-teal-600 mb-3">Profile Picture</h2>

        {formData.image && (
          <img src={formData.image} alt="Profile" className="w-32 h-32 object-cover rounded-full mb-4" />
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="mb-4"
        />

        {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
      </div>

      {/* Services */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-teal-600 mb-3">Extras Offered:</h2>
        <div className="flex flex-wrap gap-4">
          {allServices.map(service => (
            <label key={service} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.services?.includes(service) || false}
                onChange={() => toggleService(service)}
                className="accent-teal-600"
              />
              {service}
            </label>
          ))}
        </div>
      </div>

      {/* Availability Grid */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-teal-600 mb-2">Availability</h2>
        <div className="overflow-auto border rounded-lg">
          <table className="table-auto w-full text-sm border-collapse">
            <thead>
              <tr className="bg-teal-100">
                <th className="p-2 border text-left">Day / Time</th>
                {hours.map(hour => (
                  <th key={hour} className="p-2 border text-center">{hour}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day} className="even:bg-gray-50">
                  <td className="p-2 border font-medium">{day}</td>
                  {hours.map(hour => {
                    const key = `${day}-${hour}`;
                    const value = formData.availability?.[key] || 'unavailable';
                    const isAvailable = value === 'available';
                    const bg = isAvailable ? 'bg-teal-200' : 'bg-red-200';
                    return (
                      <td
                        key={hour}
                        className={`p-1 border text-center cursor-pointer select-none ${bg}`}
                        onClick={() => toggleAvailability(day, hour)}
                      >
                        {isAvailable ? '✓' : 'X'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Switch */}
      <div className="mt-6 flex items-center gap-3">
        <input
          type="checkbox"
          checked={formData.allowPending}
          onChange={handlePendingSwitch}
          className="accent-teal-600"
        />
        <span className="text-sm font-medium text-gray-700">Pause Account if Fully Booked</span>

      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-teal-600 mb-3">Review Links & Embed</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Reviews URL</label>
            <input
              type="url"
              name="googleReviewUrl"
              value={formData.googleReviewUrl || ''}
              onChange={handleInputChange}
              placeholder="https://g.page/your-business"
              className="w-full p-2 border border-teal-300 rounded focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Page URL</label>
            <input
              type="url"
              name="facebookReviewUrl"
              value={formData.facebookReviewUrl || ''}
              onChange={handleInputChange}
              placeholder="https://facebook.com/yourpage"
              className="w-full p-2 border border-teal-300 rounded focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Embed Widget Code (optional)</label>
          <textarea
            name="embedCode"
            value={formData.embedCode || ''}
            onChange={handleInputChange}
            rows={5}
            placeholder={`Paste widget code from Elfsight, Trustindex etc.`}
            className="w-full p-2 border border-teal-300 rounded focus:ring-2 focus:ring-teal-400"
          />
          <p className="text-xs text-gray-500 mt-1">Only use if you have a trusted review embed code. HTML will be displayed on your public profile.</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <button
          onClick={handleSave}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded shadow"
        >
          Save Changes
        </button>
      </div>

      {/* Booking Requests Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-teal-700 mb-4">Booking Requests</h2>

        {bookings.length === 0 ? (
          <p className="text-gray-500">You have no booking requests.</p>
        ) : (
          <ul className="space-y-4">
            {bookings.map((booking) => (
              <li key={booking._id} className="border p-4 rounded-lg shadow">
                <p><strong>Client ID:</strong> {booking.clientId}</p>
                <p><strong>Day:</strong> {booking.day}</p>
                <p><strong>Time:</strong> {booking.time}:00</p>
                <p><strong>Status:</strong> {booking.status}</p>

                {booking.status === 'pending' && (
                  <div className="flex space-x-4 mt-2">
                    <button
                      onClick={() => handleBookingUpdate(booking._id, 'accepted')}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleBookingUpdate(booking._id, 'rejected')}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
