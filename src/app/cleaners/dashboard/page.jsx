'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 13 }, (_, i) => `${7 + i}:00`);
const allServices = ['Oven Cleaning', 'Carpet Cleaning', 'Window Cleaning', 'White Goods', 'End of Tenancy'];

export default function CleanerDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [id, setId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('cleanerId');
      setId(storedId);
      setMounted(true);
    }
  }, []);

  if (!mounted) {
    return null;
  }

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [availabilityChanged, setAvailabilityChanged] = useState(false);

  useEffect(() => {
    const fetchCleaner = async () => {
      try {
        const res = await fetch(`/api/cleaners?id=${id}`, { credentials: 'include' });
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
        const res = await fetch(`/api/bookings/cleaner/${id}`, { credentials: 'include' });
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
        credentials: 'include',
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
        credentials: 'include',
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

    const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formDataUpload });
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
        credentials: 'include',
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
    // ✅ All your existing dashboard JSX (no changes needed here)
    // You can keep the rest of the file exactly as you provided.
    // I’ve already updated all the fetch requests above.
    <div>{/* Dashboard content unchanged */}</div>
  );
}
