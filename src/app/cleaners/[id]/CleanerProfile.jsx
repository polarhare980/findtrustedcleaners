'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import React from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingPaymentWrapper from '@/components/BookingPaymentForm';
import PurchaseButton from '@/components/PurchaseButton';
import { getCleanerId } from '@/lib/utils';
import { fetchClient } from '@/lib/fetchClient'; // ✅ Import the shared helper

function isSafeEmbed(code) {
  const hasIframe = code.includes('<iframe') && code.includes('src=');
  const forbidden = ['<script', '<style', 'onerror', 'onload', 'javascript:'];
  const lower = code.toLowerCase();
  return hasIframe && !forbidden.some(frag => lower.includes(frag));
}

// ✅ Fixed Availability Component - removed canViewContact check for buttons
function AvailabilitySection({ availability, onSlotClick, canViewContact, selectedSlot }) {
  const [showGrid, setShowGrid] = useState(false);

  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];
  const hours = Array.from({ length: 13 }, (_, i) => 7 + i);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
      padding: '32px',
      marginBottom: '30px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#115E59'
        }}>
          📅 Availability
        </h3>
        <button
          onClick={() => setShowGrid(prev => !prev)}
          style={{
            background: showGrid 
              ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
              : 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(13, 148, 136, 0.3)'
          }}
        >
          {showGrid ? 'Hide Availability' : 'Show Availability'}
        </button>
      </div>

      {showGrid && (
        <div style={{
          overflowX: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'rgba(13, 148, 136, 0.1)' }}>
                <th style={{
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '12px',
                  fontWeight: 'bold',
                  color: '#115E59'
                }}>Day</th>
                {hours.map(hour => (
                  <th key={hour} style={{
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '8px',
                    fontSize: '14px',
                    color: '#115E59'
                  }}>
                    {hour}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day}>
                  <td style={{
                    fontWeight: 'bold',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#374151'
                  }}>
                    {day}
                  </td>
                  {hours.map(hour => {
                    const isAvailable = availability?.[day]?.[hour.toString()];
                    const isSelected = selectedSlot?.day === day && selectedSlot?.hour === hour.toString();
                    
                    return (
                      <td key={hour} style={{ padding: '4px' }}>
                        {isAvailable ? (
                          <button
                            onClick={() => onSlotClick(day, hour.toString())}
                            style={{
                              width: '100%',
                              padding: '8px 4px',
                              background: isSelected 
                                ? 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)'
                                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all 0.3s ease',
                              boxShadow: isSelected ? '0 4px 12px rgba(13, 148, 136, 0.4)' : 'none'
                            }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                          >
                            {isSelected ? '✓ SELECTED' : 'BOOK'}
                          </button>
                        ) : (
                          <div style={{
                            textAlign: 'center',
                            color: '#9CA3AF',
                            fontSize: '16px',
                            padding: '8px'
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
      )}

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && selectedSlot && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#FEF3C7',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <strong>Selected:</strong> {selectedSlot.day} at {selectedSlot.hour}:00
          <br />
          <strong>Can View Contact:</strong> {canViewContact.toString()}
          <br />
          <strong>Availability Data:</strong> {JSON.stringify(availability?.[selectedSlot.day], null, 2)}
        </div>
      )}
    </div>
  );
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
  const [canViewContact, setCanViewContact] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [client, setClient] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
    }
  }, []);

  // ✅ Load logged-in client (if any)
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

  // ✅ Load cleaner by ID
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

  // ✅ Check permissions when cleaner or client changes
  useEffect(() => {
    const checkPermissions = async () => {
      if (!cleaner || !client?.email) {
        setCanViewContact(false);
        return;
      }

      setPermissionLoading(true);

      try {
        const cleanerId = getCleanerId(cleaner, id);

        console.log('🧪 Checking unlock status...');
        console.log('👤 client._id:', client?._id);
        console.log('🧼 cleanerId:', cleanerId);

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
          console.log('🔐 Permission check result:', result.unlocked);
        } else {
          console.error('❌ Unlock API Error:', result.message);
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
    console.log('✅ Purchase successful, received data:', cleanerData);
    
    // Update access status
    setHasAccess(true);
    setCanViewContact(true);
    
    // Update cleaner data with the contact information
    setCleaner((prev) => ({
      ...prev,
      phone: cleanerData.phone || prev.phone,
      email: cleanerData.email || prev.email,
      // Handle both cleanerName and realName
      companyName: cleanerData.companyName || cleanerData.cleanerName || prev.companyName || prev.realName,
      // Ensure we keep all existing data
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

  // ✅ Handle slot selection for the integrated availability component
  const handleSlotClick = (day, hour) => {
    console.log('🎯 Slot clicked:', { day, hour });
    setSelectedSlot({ day, hour });
  };

  if (!mounted) return null;
  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 p-6 flex items-center justify-center">
        <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
            Error
          </h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2 rounded-full hover:from-teal-700 hover:to-teal-800 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 p-6 relative">
      <div className="max-w-4xl mx-auto">
        {/* Main Profile Card */}
        <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl mb-6 transition-all duration-300 hover:shadow-3xl">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
            <div className="relative group">
              <img 
                 src={cleaner.image?.trim() ? cleaner.image : '/default-avatar.png'} 
                 alt={cleaner.realName || 'Cleaner'} 
                 loading="lazy"
                 className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full border-4 border-white/30 shadow-lg transition-transform duration-300 group-hover:scale-105" 
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-600/20 to-teal-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                {cleaner.realName}
              </h1>

              {cleaner.pending && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded-xl shadow">
                  ⚠️ This profile is currently pending approval for a recent booking and may be unavailable.
                </div>
              )}

              {cleaner.googleReviewRating && cleaner.googleReviewCount && (
                <p className="text-lg font-medium text-teal-800">
                  ⭐ {cleaner.googleReviewRating} from {cleaner.googleReviewCount} reviews
                </p>
              )}

              {cleaner?.isPremium && (
                <div className="inline-block bg-yellow-400 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md mb-4">
                  ✨ Premium Cleaner
                </div>
              )}
           
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-600 font-semibold">📍</span>
                    <div>
                      <span className="font-semibold text-teal-800">Postcode:</span>
                      <div className="text-lg">{cleaner.postcode}</div>
                      {cleaner.additionalPostcodes?.length > 0 && (
                        <div className="text-sm text-yellow-800 mt-1">
                          <span className="font-medium">Also covers:</span> {cleaner.additionalPostcodes.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-600 font-semibold">💰</span>
                    <div>
                      <span className="font-semibold text-teal-800">Hourly Rate:</span>
                      <div className="text-lg font-bold text-teal-700">£{cleaner.rates || cleaner.rate || 'Not set'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Section - WITH PERMISSION CHECK */}
          <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6 relative z-50" style={{isolation: 'isolate'}}>
            {/* Enhanced debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 mb-4 bg-yellow-100 p-2 rounded">
                Debug: cleanerId={getCleanerId(cleaner, id)}, hasAccess={hasAccess.toString()}, canViewContact={canViewContact.toString()}, purchaseLoading={purchaseLoading.toString()}
                <br />
                URL param ID: {id}
                <br />
                Client Email: {client?.email || 'Not loaded'}
                <br />
                Selected Slot: {selectedSlot ? `${selectedSlot.day} at ${selectedSlot.hour}:00` : 'None'}
                <br />
                Permission Loading: {permissionLoading.toString()}
              </div>
            )}
            
            {permissionLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Checking permissions...</p>
              </div>
            ) : canViewContact ? (
              <div className="contact-info">
                <div className="text-center mb-4">
                  <span className="text-2xl">🔓</span>
                  <p className="text-green-600 font-semibold mt-2">Contact details unlocked!</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center md:text-left">
                    <div className="text-teal-600 font-semibold mb-1">📞 Phone</div>
                    <div className="text-gray-800 font-medium">{cleaner.phone || 'Not provided'}</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-teal-600 font-semibold mb-1">📧 Email</div>
                    <div className="text-gray-800 font-medium">{cleaner.email || 'Not provided'}</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-teal-600 font-semibold mb-1">🏢 Company</div>
                    <div className="text-gray-800 font-medium">{cleaner.companyName || cleaner.realName}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="blurred-overlay text-center">
                <div className="mb-4">
                  <span className="text-2xl">🔒</span>
                  <p className="text-gray-600 italic mt-2">Contact details locked — purchase access to unlock</p>
                </div>
                
                {/* Fixed condition to handle both _id and id */}
                {cleaner && getCleanerId(cleaner, id) ? (
                  <div className="relative z-50">
                    {purchaseLoading && (
                      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center z-[60]">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                      </div>
                    )}
                    {/* Purchase button with maximum z-index and isolation */}
                    <div style={{position: 'relative', zIndex: 9999, isolation: 'isolate'}}>
                      {client?.type === 'client' ? (
                        <PurchaseButton
                          cleanerId={getCleanerId(cleaner, id)}
                          selectedSlot={selectedSlot} // ✅ ← Pass the selected day/hour
                          onPurchaseSuccess={handlePurchaseSuccess}
                          onPurchaseStart={handlePurchaseStart}
                          onPurchaseError={handlePurchaseError}
                          disabled={purchaseLoading}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('redirectAfterLogin', `/cleaners/${cleaner._id || id}`);
                              window.location.href = `/login/clients?next=/cleaners/${cleaner._id || id}`;
                            }
                          }}
                          className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2 rounded-full font-semibold shadow hover:from-teal-700 hover:to-teal-800 transition-all duration-300"
                        >
                          Log in to Purchase Access
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600 font-semibold">
                    ⚠️ Unable to load purchase button - cleaner ID missing
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Services Section - MOVED BELOW CONTACT DETAILS */}
          <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6 relative z-10">
            <h2 className="text-2xl font-bold text-teal-800 mb-4 flex items-center gap-2">
              <span>🧹</span> Services Offered
            </h2>
            {Array.isArray(cleaner.services) && cleaner.services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cleaner.services.map((service, i) => (
                  <div key={i} className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/30 flex items-center gap-2">
                    <span className="text-teal-600">✨</span>
                    <span className="text-gray-800">{service}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="italic text-gray-600 text-center py-4">No services listed</p>
            )}
          </div>

          {cleaner.bio && (
            <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6 relative z-10">
              <h2 className="text-2xl font-bold text-teal-800 mb-4 flex items-center gap-2">
                <span>🧾</span> About This Cleaner
              </h2>
              <p className="text-gray-800 whitespace-pre-wrap">{cleaner.bio}</p>
            </div>
          )}

          {/* Gallery Section */}
          {cleaner.photos?.length > 0 && (
            <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6 relative z-10">
              <h2 className="text-2xl font-bold text-teal-800 mb-4 flex items-center gap-2">
                <span>🖼️</span> Cleaner Gallery
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {cleaner.photos.map((photo, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-xl border border-white/30">
                    <img
                      src={photo.url}
                      alt={`Gallery photo ${index + 1}`}
                      className={`w-full h-auto transition-all duration-300 object-cover ${
                        !canViewContact && photo.hasText ? 'blur-sm grayscale brightness-75' : ''
                      }`}
                    />
                    {!canViewContact && photo.hasText && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-sm font-medium">
                        🔒 Unlock to view
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {(cleaner.googleReviewUrl || cleaner.facebookReviewUrl || cleaner.embedCode) && (
            <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6 relative z-10">
              <h2 className="text-2xl font-bold text-teal-800 mb-4 flex items-center gap-2">
                <span>⭐</span> Reviews
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {canViewContact && cleaner.googleReviewUrl && (
                  <a
                    href={cleaner.googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full text-center font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    📱 View Google Reviews
                  </a>
                )}

                {cleaner.facebookReviewUrl && (
                  <a
                    href={cleaner.facebookReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full text-center font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    📘 View Facebook Page
                  </a>
                )}
              </div>

              {cleaner.embedCode && isSafeEmbed(cleaner.embedCode) && (
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30" 
                     dangerouslySetInnerHTML={{ __html: cleaner.embedCode }} />
              )}
            </div>
          )}

          {/* ✅ INTEGRATED AVAILABILITY SECTION */}
          <AvailabilitySection
            availability={cleaner.availability}
            onSlotClick={handleSlotClick}
            canViewContact={canViewContact}
            selectedSlot={selectedSlot}
          />
        </div>

        {/* ✅ FIXED: Booking Section - removed canViewContact check */}
        {selectedSlot && getCleanerId(cleaner, id) && (
          <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
              🎯 Booking for {selectedSlot.day} at {selectedSlot.hour}:00
            </h2>
            <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <BookingPaymentWrapper
                cleanerId={getCleanerId(cleaner, id)}
                day={selectedSlot.day}
                time={selectedSlot.hour}
                price={cleaner.rates || cleaner.rate}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}