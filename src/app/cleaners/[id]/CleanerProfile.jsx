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

  useEffect(() => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999999999999';
    overlay.style.pointerEvents = 'none';
    overlay.style.border = '5px dashed red';
    overlay.style.boxSizing = 'border-box';
    overlay.style.opacity = '0.5';
    overlay.innerText = 'OVERLAY DETECTOR';
    document.body.appendChild(overlay);

    return () => {
      document.body.removeChild(overlay);
    };
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
      ...cleanerData,
    }));
    setPurchaseLoading(false);
  };

  const handlePurchaseStart = () => setPurchaseLoading(true);
  const handlePurchaseError = (error) => {
    console.error('❌ Purchase failed:', error);
    setPurchaseLoading(false);
    setError('Purchase failed. Please try again.');
  };

  const handleSlotClick = (day, hour) => {
    alert(`💥 SLOT CLICKED: ${day} at ${hour}`);
    setSelectedSlot({ day, hour });
  };

  useEffect(() => {
    document.body.style.pointerEvents = 'auto';
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
    <div>
      <h1>{cleaner?.realName}</h1>
      <div style={{ position: 'fixed', top: '100px', zIndex: 999999999, pointerEvents: 'auto' }}>
        {['Monday', 'Tuesday', 'Wednesday'].map((day) => (
          <div key={day}>
            <strong>{day}</strong>
            <div style={{ display: 'flex' }}>
              {[...Array(13)].map((_, i) => {
                const hour = `${7 + i}`;
                return (
                  <div
                    key={hour}
                    onClick={() => handleSlotClick(day, hour)}
                    style={{
                      padding: '10px',
                      margin: '2px',
                      background: '#007acc',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    {hour}:00
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
