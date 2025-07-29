'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingPaymentWrapper from '@/components/BookingPaymentForm';
import PurchaseButton from '@/components/PurchaseButton';
import { getCleanerId } from '@/lib/utils';
import { fetchClient } from '@/lib/fetchClient';

export default function CleanerProfile() {
  const { id } = useParams();
  const router = useRouter();

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
  const [selectedImage, setSelectedImage] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

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

  const handleImageClick = (index) => {
    setSelectedImage(index);
    setShowGallery(true);
  };

  const handleGalleryClose = () => {
    setShowGallery(false);
  };

  const mockGallery = [
    '/api/placeholder/400/300',
    '/api/placeholder/400/301',
    '/api/placeholder/400/302',
    '/api/placeholder/400/303'
  ];

  if (!mounted) return null;
  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.2) 0%, rgba(15, 118, 110, 0.1) 100%)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        color: '#DC2626',
        fontSize: '18px'
      }}>
        {error}
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.2) 0%, rgba(15, 118, 110, 0.1) 100%)',
      paddingBottom: '40px'
    }}>
      {/* Navigation Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '16px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
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
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 24px rgba(13, 148, 136, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(13, 148, 136, 0.3)';
            }}
          >
            ← Back to Search
          </button>
          
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.3)';
            }}
          >
            🏠 Home
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Profile Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          animation: 'fadeIn 0.8s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
            {/* Profile Photo */}
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '3px solid rgba(13, 148, 136, 0.3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            onClick={() => handleImageClick(0)}>
              <img
                src={cleaner.profilePhoto || '/api/placeholder/150/150'}
                alt={`${cleaner.realName} profile`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '16px'
              }}>
                {cleaner.realName}
              </h1>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{
                  background: 'rgba(13, 148, 136, 0.1)',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  fontSize: '16px',
                  color: '#0F766E'
                }}>
                  📍 {cleaner.postcode}
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  fontSize: '16px',
                  color: '#059669'
                }}>
                  💷 £{cleaner.rates || cleaner.rate || 'Contact for rates'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        {cleaner.bio && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#115E59',
              marginBottom: '16px'
            }}>
              🧼 About
            </h3>
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
              {cleaner.bio}
            </p>
          </div>
        )}

        {/* Services Section */}
        {cleaner.services?.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#115E59',
              marginBottom: '20px'
            }}>
              🛠️ Services Offered
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {cleaner.services.map((service, i) => (
                <div key={i} style={{
                  background: 'rgba(255, 255, 255, 0.4)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  color: '#374151',
                  border: '1px solid rgba(13, 148, 136, 0.2)'
                }}>
                  ✓ {service}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#115E59'
            }}>
              📸 Work Gallery
            </h3>
            {!canViewContact && (
              <div style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '50px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                🔒 Premium Feature
              </div>
            )}
          </div>
          
          {canViewContact ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {mockGallery.map((img, index) => (
                <div key={index} style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                onClick={() => handleImageClick(index)}>
                  <img
                    src={img}
                    alt={`Work example ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6B7280',
              background: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '12px',
              border: '2px dashed rgba(107, 114, 128, 0.3)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <p style={{ fontSize: '16px', marginBottom: '20px' }}>
                Unlock gallery to see work examples and before/after photos
              </p>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#115E59',
            marginBottom: '20px'
          }}>
            📞 Contact Details
          </h3>
          
          {permissionLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
              Checking access...
            </div>
          ) : canViewContact ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.4)',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>📱</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#374151' }}>Phone</div>
                  <div style={{ color: '#6B7280' }}>{cleaner.phone}</div>
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.4)',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>✉️</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#374151' }}>Email</div>
                  <div style={{ color: '#6B7280' }}>{cleaner.email}</div>
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.4)',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>🏢</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#374151' }}>Company</div>
                  <div style={{ color: '#6B7280' }}>{cleaner.companyName || cleaner.realName}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '12px',
                padding: '40px',
                marginBottom: '20px',
                border: '2px dashed rgba(107, 114, 128, 0.3)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <p style={{ color: '#6B7280', marginBottom: '20px' }}>
                  Contact details are locked. Purchase access to view phone, email, and company information.
                </p>
              </div>
              <PurchaseButton
                cleanerId={getCleanerId(cleaner, id)}
                selectedSlot={selectedSlot}
                onPurchaseSuccess={handlePurchaseSuccess}
                disabled={purchaseLoading}
              />
            </div>
          )}
        </div>

        {/* Availability Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
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
                    {[...Array(13)].map((_, i) => (
                      <th key={i} style={{
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '8px',
                        fontSize: '14px',
                        color: '#115E59'
                      }}>
                        {7 + i}:00
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => (
                    <tr key={day}>
                      <td style={{
                        fontWeight: 'bold',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: '#374151'
                      }}>
                        {day}
                      </td>
                      {[...Array(13)].map((_, i) => {
                        const hour = 7 + i;
                        const isAvailable = cleaner?.availability?.[day]?.[hour.toString()] === true;
                        return (
                          <td key={i} style={{ padding: '4px' }}>
                            {isAvailable ? (
                              <button
                                onClick={() => handleSlotClick(day, hour.toString())}
                                style={{
                                  width: '100%',
                                  padding: '8px 4px',
                                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                              >
                                BOOK
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
        </div>

        {/* Booking Section */}
        {selectedSlot && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            animation: 'slideUp 0.5s ease-out'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#115E59',
              marginBottom: '20px'
            }}>
              📅 Booking for {selectedSlot.day} at {selectedSlot.hour}:00
            </h3>
            <BookingPaymentWrapper
              cleanerId={getCleanerId(cleaner, id)}
              day={selectedSlot.day}
              time={selectedSlot.hour}
              price={cleaner.rates || cleaner.rate}
            />
          </div>
        )}

        {/* Gallery Modal */}
        {showGallery && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={handleGalleryClose}>
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
              <img
                src={mockGallery[selectedImage]}
                alt={`Gallery image ${selectedImage + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: '12px',
                  objectFit: 'contain'
                }}
              />
              <button
                onClick={handleGalleryClose}
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '0',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}