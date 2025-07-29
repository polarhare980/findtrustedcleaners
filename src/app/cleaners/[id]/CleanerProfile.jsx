'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import React from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingPaymentWrapper from '@/components/BookingPaymentForm';
import PurchaseButton from '@/components/PurchaseButton';
import { getCleanerId } from '@/lib/utils';
import { fetchClient } from '@/lib/fetchClient';

export default function CleanerProfile() {
  const { id } = useParams();

  const [mounted, setMounted] = useState(false);
  const [cleaner, setCleaner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [canViewContact, setCanViewContact] = useState(true);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    const loadClient = async () => {
      try {
        const user = await fetchClient();
        setClient(user);
      } catch (err) {
        console.error('Failed to fetch client data:', err);
        setClient(null);
      }
    };
    loadClient();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchCleaner = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`/api/cleaners/${id}`, { credentials: 'include' });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Fetch error:', res.status, errorText);
          setError(`Cleaner not found or server error (${res.status})`);
          return;
        }

        const data = await res.json();

        if (!data?.success || !data.cleaner) {
          setError('Cleaner not found.');
          return;
        }

        setCleaner(data.cleaner);
        setHasAccess(data.hasAccess || false);
      } catch (err) {
        console.error('❌ Failed to load cleaner profile', err);
        setError('Failed to fetch cleaner profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchCleaner();
  }, [id]);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!cleaner || !client?.email) {
        setCanViewContact(false);
        return;
      }

      setPermissionLoading(true);

      try {
        const cleanerId = getCleanerId(cleaner, id);

        const res = await fetch('/api/unlock-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            cleanerId,
            clientId: client._id,
          }),
        });

        const result = await res.json();

        if (res.ok && result.success) {
          setCanViewContact(result.unlocked);
        } else {
          setCanViewContact(false);
        }
      } catch (err) {
        console.error('Permission check failed:', err);
        setCanViewContact(false);
      } finally {
        setPermissionLoading(false);
      }
    };

    checkPermissions();
  }, [cleaner, client]);

  const handlePurchaseSuccess = (cleanerData) => {
    setHasAccess(true);
    setCanViewContact(true);
    setCleaner((prev) => ({
      ...prev,
      phone: cleanerData.phone || prev.phone,
      email: cleanerData.email || prev.email,
      companyName: cleanerData.companyName || cleanerData.cleanerName || prev.companyName || prev.realName,
      ...cleanerData
    }));
    setPurchaseLoading(false);
  };

  const handleSlotClick = (day, hour) => {
    setSelectedSlot({ day, hour });
  };

  if (!mounted) return null;
  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>{cleaner.realName}</h1>
      <p>📍 Postcode: {cleaner.postcode}</p>
      <p>💷 Rate: £{cleaner.rates || cleaner.rate || 'Not set'}</p>

      {cleaner.bio && (
        <div style={{ margin: '20px 0' }}>
          <h3>🧼 About</h3>
          <p>{cleaner.bio}</p>
        </div>
      )}

      {cleaner.services?.length > 0 && (
        <div>
          <h3>🛠️ Services Offered:</h3>
          <ul>
            {cleaner.services.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      <div style={{ margin: '20px 0' }}>
        <h3>📞 Contact Details:</h3>
        {permissionLoading ? 'Checking access...' : canViewContact ? (
          <>
            <p>Phone: {cleaner.phone}</p>
            <p>Email: {cleaner.email}</p>
            <p>Company: {cleaner.companyName || cleaner.realName}</p>
          </>
        ) : (
          <>
            <p>🔒 Contact locked</p>
            <PurchaseButton
              cleanerId={getCleanerId(cleaner, id)}
              selectedSlot={selectedSlot}
              onPurchaseSuccess={handlePurchaseSuccess}
              disabled={purchaseLoading}
            />
          </>
        )}
      </div>

      <button onClick={() => setShowGrid(prev => !prev)} style={{ margin: '20px 0', padding: '10px 20px' }}>
        {showGrid ? 'Hide Availability' : 'Show Availability'}
      </button>

      {showGrid && (
        <div style={{ overflowX: 'auto', border: '1px solid #ccc', padding: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '5px' }}>Day</th>
                {[...Array(13)].map((_, i) => (
                  <th key={i} style={{ border: '1px solid #ccc', padding: '5px' }}>{7 + i}:00</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => (
                <tr key={day}>
                  <td style={{ fontWeight: 'bold', padding: '5px' }}>{day}</td>
                  {[...Array(13)].map((_, i) => {
                    const hour = 7 + i;
                    const isAvailable = cleaner?.availability?.[day]?.[hour.toString()] === true;
                    return (
                      <td key={i} style={{ padding: '2px' }}>
                        {isAvailable ? (
                          <button
                            onClick={() => handleSlotClick(day, hour.toString())}
                            style={{ width: '100%', padding: '5px', background: '#007acc', color: 'white', border: 'none', cursor: 'pointer' }}
                          >
                            BOOK
                          </button>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#aaa' }}>✗</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSlot && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f9f9f9', border: '1px solid #ccc' }}>
          <h3>📅 Booking for {selectedSlot.day} at {selectedSlot.hour}:00</h3>
          <BookingPaymentWrapper
            cleanerId={getCleanerId(cleaner, id)}
            day={selectedSlot.day}
            time={selectedSlot.hour}
            price={cleaner.rates || cleaner.rate}
          />
        </div>
      )}
    </div>
  );
}
