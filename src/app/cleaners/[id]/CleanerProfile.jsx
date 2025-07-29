'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import React from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingPaymentWrapper from '@/components/BookingPaymentForm';
import PurchaseButton from '@/components/PurchaseButton';
import { getCleanerId } from '@/lib/utils';
import { fetchClient } from '@/lib/fetchClient';

function isSafeEmbed(code) {
  const hasIframe = code.includes('<iframe') && code.includes('src=');
  const forbidden = ['<script', '<style', 'onerror', 'onload', 'javascript:'];
  const lower = code.toLowerCase();
  return hasIframe && !forbidden.some(frag => lower.includes(frag));
}

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
    }
  }, []);

  // Load logged-in client
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

  // Load cleaner by ID
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

  // Check permissions
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

  const handlePurchaseStart = () => {
    setPurchaseLoading(true);
  };

  const handlePurchaseError = (error) => {
    console.error('❌ Purchase failed:', error);
    setPurchaseLoading(false);
    setError('Purchase failed. Please try again.');
  };

  const handleSlotClick = (day, hour) => {
    console.log('🎯 SLOT CLICKED:', { day, hour });
    setSelectedSlot({ day, hour });
  };

  // TEMP override
  useEffect(() => {
    setCanViewContact(true);
  }, []);

  if (!mounted) return null;
  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'red' }}>Error</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Basic Profile Info */}
      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
        <h1>{cleaner.realName}</h1>
        <p>Postcode: {cleaner.postcode}</p>
        <p>Rate: £{cleaner.rates || cleaner.rate || 'Not set'}</p>
        
        {cleaner.pending && (
          <div style={{ background: '#fff3cd', padding: '10px', border: '1px solid #ffeaa7' }}>
            ⚠️ This profile is pending approval
          </div>
        )}
      </div>

      {/* Contact Details */}
      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
        <h2>Contact Details</h2>
        {permissionLoading ? (
          <p>Loading permissions...</p>
        ) : canViewContact ? (
          <div>
            <p>🔓 Contact details unlocked!</p>
            <p>Phone: {cleaner.phone || 'Not provided'}</p>
            <p>Email: {cleaner.email || 'Not provided'}</p>
            <p>Company: {cleaner.companyName || cleaner.realName}</p>
          </div>
        ) : (
          <div>
            <p>🔒 Contact details locked</p>
            {cleaner && getCleanerId(cleaner, id) ? (
              client?.type === 'client' ? (
                <PurchaseButton
                  cleanerId={getCleanerId(cleaner, id)}
                  selectedSlot={selectedSlot}
                  onPurchaseSuccess={handlePurchaseSuccess}
                  onPurchaseStart={handlePurchaseStart}
                  onPurchaseError={handlePurchaseError}
                  disabled={purchaseLoading}
                />
              ) : (
                <button onClick={() => window.location.href = `/login/clients?next=/cleaners/${cleaner._id || id}`}>
                  Log in to Purchase Access
                </button>
              )
            ) : (
              <p style={{ color: 'red' }}>Unable to load purchase button</p>
            )}
          </div>
        )}
      </div>

      {/* Services */}
      {cleaner.services && cleaner.services.length > 0 && (
        <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
          <h2>Services</h2>
          <ul>
            {cleaner.services.map((service, i) => (
              <li key={i}>{service}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Bio */}
      {cleaner.bio && (
        <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
          <h2>About</h2>
          <p>{cleaner.bio}</p>
        </div>
      )}

      {/* SIMPLE AVAILABILITY GRID */}
      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
        <h2>Availability</h2>
        
        {/* Desktop Grid */}
        <div style={{ display: 'block' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '5px' }}>Day</th>
                {[...Array(13)].map((_, hour) => (
                  <th key={hour} style={{ border: '1px solid #ccc', padding: '5px' }}>
                    {7 + hour}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <tr key={day}>
                  <td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>{day}</td>
                  {[...Array(13)].map((_, hourIndex) => {
                    const hour = 7 + hourIndex;
                    const hourKey = `${hour}`;
                    const isAvailable = true; // Force available for testing
                    const isSelected = selectedSlot?.day === day && selectedSlot?.hour === hourKey;

                    return (
                      <td key={hourKey} style={{ border: '1px solid #ccc', padding: '2px' }}>
                        {isAvailable ? (
                          canViewContact ? (
                            <button
                              type="button"
                              onClick={() => handleSlotClick(day, hourKey)}
                              style={{
                                width: '100%',
                                height: '30px',
                                backgroundColor: isSelected ? '#007acc' : '#28a745',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              {isSelected ? '✓' : 'Book'}
                            </button>
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '30px',
                              backgroundColor: '#90EE90',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px'
                            }}>
                              ✓
                            </div>
                          )
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '30px',
                            backgroundColor: '#ff6b6b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                          }}>
                            ✗
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Slot Display */}
        {selectedSlot && (
          <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
            <strong>Selected:</strong> {selectedSlot.day} at {selectedSlot.hour}:00
          </div>
        )}
      </div>

      {/* Booking Section */}
      {canViewContact && selectedSlot && getCleanerId(cleaner, id) && (
        <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
          <h2>Booking for {selectedSlot.day} at {selectedSlot.hour}:00</h2>
          <BookingPaymentWrapper
            cleanerId={getCleanerId(cleaner, id)}
            day={selectedSlot.day}
            time={selectedSlot.hour}
            price={cleaner.rates || cleaner.rate}
          />
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ background: '#ffffcc', padding: '10px', fontSize: '12px' }}>
          <strong>Debug:</strong><br />
          cleanerId: {getCleanerId(cleaner, id)}<br />
          canViewContact: {canViewContact.toString()}<br />
          selectedSlot: {selectedSlot ? `${selectedSlot.day} at ${selectedSlot.hour}:00` : 'None'}<br />
          client: {client?.email || 'Not loaded'}
        </div>
      )}
    </div>
  );
}