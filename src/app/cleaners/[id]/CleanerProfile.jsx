'use client';


import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import React from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingPaymentWrapper from '@/components/BookingPaymentForm';
import PurchaseButton from '@/components/PurchaseButton';

function isSafeEmbed(code) {
  const hasIframe = code.includes('<iframe') && code.includes('src=');
  const forbidden = ['<script', '<style', 'onerror', 'onload', 'javascript:'];
  const lower = code.toLowerCase();
  const containsForbidden = forbidden.some(frag => lower.includes(frag));
  return hasIframe && !containsForbidden;
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

  useEffect(() => {
  const fetchClient = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();

      if (res.ok && data?.user?.type === 'client') {
        setClient(data.user);
      } else {
        // No redirect here. We allow anonymous viewing of profiles.
        setClient(null);
      }
    } catch (err) {
      console.error('Failed to fetch client data:', err);
      setClient(null);
    }
  };

  fetchClient();
}, []);



  useEffect(() => {
    const fetchCleaner = async () => {
      try {
        const res = await fetch(`/api/cleaners/${id}`, { credentials: 'include' });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Fetch error:', res.status, errorText);
          setError(`Cleaner not found or server error (${res.status})`);
          return;
        }

        const data = await res.json();
        console.log('📡 API Response:', data);

        if (!data || !data.success || !data.cleaner) {
          setError('Cleaner not found.');
          return;
        }

        setCleaner(data.cleaner);
        
        // Enhanced debug logging
        console.log('🔍 CLEANER OBJECT:', data.cleaner);
        console.log('🔍 CLEANER ID (_id):', data.cleaner?._id);
        console.log('🔍 CLEANER ID (id):', data.cleaner?.id);
        console.log('🔍 CLEANER KEYS:', Object.keys(data.cleaner || {}));
        console.log('🔍 FULL CLEANER DATA:', JSON.stringify(data.cleaner, null, 2));
        console.log('🎯 Availability data received:', JSON.stringify(data.cleaner.availability, null, 2));
        console.log('🎯 Monday data:', data.cleaner.availability?.Monday);
        console.log('🎯 Available days:', Object.keys(data.cleaner.availability || {}));

        setHasAccess(data.hasAccess || false);
        console.log('🔐 Access status:', data.hasAccess);
      } catch (err) {
        console.error('Failed to load cleaner profile', err);
        setError('Failed to fetch cleaner profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchCleaner();
  }, [id]);

  // Check permissions when cleaner, client, or selectedSlot changes
  useEffect(() => {
  const checkPermissions = async () => {
    if (!cleaner || !client?.email) {
      setCanViewContact(false);
      return;
    }

    setPermissionLoading(true);
    try {
      const cleanerId = getCleanerId();

      const res = await fetch('/api/unlock-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cleanerId,
          clientEmail: client.email,
          day: selectedSlot?.day || null,
          hour: selectedSlot?.hour || null,
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
}, [cleaner, client, selectedSlot]);


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


  // Get the cleaner ID - handle multiple possible field names
  const getCleanerId = () => {
    return cleaner?._id || cleaner?.id || cleaner?.cleanerId || cleaner?.uuid || id;
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
            {cleaner.image && (
              <div className="relative group">
                <img 
                  src={cleaner.image} 
                  alt={cleaner.realName} 
                  className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full border-4 border-white/30 shadow-lg transition-transform duration-300 group-hover:scale-105" 
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-600/20 to-teal-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                {cleaner.realName}
              </h1>

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
                Debug: cleanerId={getCleanerId()}, hasAccess={hasAccess.toString()}, canViewContact={canViewContact.toString()}, purchaseLoading={purchaseLoading.toString()}
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
                {cleaner && getCleanerId() ? (
                  <div className="relative z-50">
                    {purchaseLoading && (
                      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center z-[60]">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                      </div>
                    )}
                    {/* Purchase button with maximum z-index and isolation */}
                    <div style={{position: 'relative', zIndex: 9999, isolation: 'isolate'}}>
                      <PurchaseButton
                        cleanerId={getCleanerId()}
                        day={selectedSlot?.day}
                        hour={selectedSlot?.hour}
                        onPurchaseSuccess={handlePurchaseSuccess}
                        onPurchaseStart={handlePurchaseStart}
                        onPurchaseError={handlePurchaseError}
                        disabled={purchaseLoading}
                      />
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

          {/* Availability Section */}
          <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 relative z-10">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-2">
              <span>📅</span> Availability
            </h2>

            {/* Desktop View */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-[100px_repeat(13,_1fr)] gap-2 text-sm">
                <div></div>
                {[...Array(13)].map((_, hour) => (
                  <div key={hour} className="text-center font-bold text-teal-700 py-2">
                    {7 + hour}:00
                  </div>
                ))}
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                  <React.Fragment key={day}>
                    <div className="font-semibold text-teal-800 py-2 flex items-center">{day}</div>
                    {[...Array(13)].map((_, hourIndex) => {
                      const hourKey = `${7 + hourIndex}`;
                      const isAvailable = cleaner.availability?.[day]?.[hourKey] === true;

                      return (
                        <div key={hourKey} className="h-10 w-full">
                          {isAvailable ? (
                            canViewContact ? (
                              <button
                                onClick={() => setSelectedSlot({ day, hour: hourKey })}
                                className={`w-full h-full rounded-xl font-medium transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg ${
                                  selectedSlot?.day === day && selectedSlot?.hour === hourKey
                                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white'
                                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                                }`}
                              >
                                {selectedSlot?.day === day && selectedSlot?.hour === hourKey ? 'Selected' : 'Book'}
                              </button>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-r from-green-300 to-green-400 text-green-800 rounded-xl flex items-center justify-center font-medium">
                                ✓
                              </div>
                            )
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-red-300 to-red-400 text-red-800 rounded-xl flex items-center justify-center font-medium">
                              ✗
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Mobile/Tablet View */}
            <div className="lg:hidden space-y-6">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <div key={day} className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <h3 className="text-lg font-bold text-teal-800 mb-3 flex items-center gap-2">
                    <span className="text-teal-600">📅</span>
                    {day.substring(0, 3)}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {[...Array(13)].map((_, hourIndex) => {
                      const hour = 7 + hourIndex;
                      const isAvailable = cleaner.availability?.[day]?.[hour] === true;

                      return (
                        <div key={hour} className="w-full">
                          {isAvailable ? (
                            canViewContact ? (
                              <button
                                onClick={() => setSelectedSlot({ day, hour: `${hour}` })}
                                className={`w-full rounded-xl py-2 px-3 font-medium transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg text-sm ${
                                  selectedSlot?.day === day && selectedSlot?.hour === `${hour}`
                                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white'
                                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                                }`}
                              >
                                {selectedSlot?.day === day && selectedSlot?.hour === `${hour}` ? 'Selected' : `${hour}:00`}
                              </button>
                            ) : (
                              <div className="w-full bg-gradient-to-r from-green-300 to-green-400 text-green-800 rounded-xl py-2 px-3 text-center font-medium text-sm">
                                {hour}:00 ✓
                              </div>
                            )
                          ) : (
                            <div className="w-full bg-gradient-to-r from-red-300 to-red-400 text-red-800 rounded-xl py-2 px-3 text-center font-medium text-sm">
                              {hour}:00 ✗
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Section */}
        {canViewContact && selectedSlot && getCleanerId() && (
          <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
              🎯 Booking for {selectedSlot.day} at {selectedSlot.hour}:00
            </h2>
            <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <BookingPaymentWrapper
                cleanerId={getCleanerId()}
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