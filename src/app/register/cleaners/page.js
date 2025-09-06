'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

export default function CleanerRegister() {
  const router = useRouter();

  const [form, setForm] = useState({
    realName: '',
    companyName: '',
    houseNameNumber: '',
    street: '',
    county: '',
    postcode: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    rates: '',
    // local toggles: { "Mon-9": true } means available
    availability: {},
    services: [],
    businessInsurance: false,
    dbsChecked: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const daysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayMap = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  };
  const fullDays = Object.values(dayMap);
  const hours = Array.from({ length: 13 }, (_, i) => 7 + i); // 7..19

  const serviceCategories = {
    '🏠 Domestic Cleaning': [
      'Regular House Cleaning',
      'Deep Cleaning',
      'Spring Cleaning',
      'End of Tenancy',
      'After-party Cleaning',
      'Holiday Let Cleaning',
    ],
    '🧼 Specialist Cleaning': [
      'Oven Cleaning',
      'Carpet Cleaning',
      'Upholstery Cleaning',
      'Mattress Cleaning',
      'Curtain Cleaning',
      'Mould Removal',
    ],
    '🪟 Exterior Cleaning': [
      'Window Cleaning',
      'Gutter Cleaning',
      'Roof Cleaning',
      'Pressure Washing',
    ],
    '🚗 Vehicle Cleaning': ['Car Valeting', 'Fleet Cleaning'],
    '🏢 Commercial Cleaning': ['Office Cleaning', 'Retail Cleaning', 'Gym Cleaning'],
  };

  // Toggle local UI availability (true = available)
  const toggleAvailability = (shortDay, hour) => {
    const key = `${shortDay}-${hour}`;
    setForm(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [key]: !prev.availability[key],
      },
    }));
  };

  const handleServiceToggle = (service) => {
    setForm(prev => {
      const exists = prev.services.includes(service);
      return {
        ...prev,
        services: exists ? prev.services.filter(s => s !== service) : [...prev.services, service],
      };
    });
    if (errors.services) setErrors(prev => ({ ...prev, services: '' }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.realName.trim()) newErrors.realName = 'Real name is required';
    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!form.houseNameNumber.trim()) newErrors.houseNameNumber = 'House name/number is required';
    if (!form.street.trim()) newErrors.street = 'Street is required';
    if (!form.county.trim()) newErrors.county = 'County is required';
    if (!form.postcode.trim()) newErrors.postcode = 'Postcode is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    if (!form.password) newErrors.password = 'Password is required';
    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (form.services.length === 0) newErrors.services = 'Please select at least one service';

    const parsedRates = parseFloat((form.rates || '').toString().replace(/[^0-9.]/g, '')) || 0;
    if (parsedRates <= 0) newErrors.rates = 'Please enter a valid hourly rate greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Build a dense base availability:
   * Every day/hour initialized as 'unavailable', then any UI toggles overwrite to true.
   */
  const buildDenseBaseAvailability = () => {
    const out = {};
    // initialize all as 'unavailable'
    for (const day of fullDays) {
      out[day] = {};
      for (const h of hours) {
        out[day][String(h)] = 'unavailable';
      }
    }
    // apply toggles (true = available)
    Object.entries(form.availability).forEach(([key, selected]) => {
      if (!selected) return;
      const [shortDay, hourNum] = key.split('-');
      const fullDay = dayMap[shortDay];
      if (!fullDay) return;
      out[fullDay][String(hourNum)] = true;
    });
    return out;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    const parsedRates = parseFloat((form.rates || '').toString().replace(/[^0-9.]/g, '')) || 0;
    const availability = buildDenseBaseAvailability();

    try {
      const payload = {
        realName: form.realName.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        rates: parsedRates,
        services: form.services,
        address: {
          houseNameNumber: form.houseNameNumber.trim(),
          street: form.street.trim(),
          county: form.county.trim(),
          postcode: form.postcode.trim(),
        },
        availability, // dense base availability
        businessInsurance: !!form.businessInsurance,
        dbsChecked: !!form.dbsChecked,
        userType: 'cleaner',
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        router.push('/cleaners/dashboard');
      } else {
        setErrors({ submit: data?.message || 'Registration failed. Please try again.' });
      }
    } catch (err) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register as a Cleaner | Find Trusted Cleaners</title>
        <meta name="description" content="Join Find Trusted Cleaners and connect with local clients. Showcase availability, services, and start growing your cleaning business today." />
        <meta name="keywords" content="cleaner registration, cleaning services, become a cleaner, local cleaners UK, Find Trusted Cleaners" />
        <meta property="og:title" content="Register as a Cleaner - Find Trusted Cleaners" />
        <meta property="og:description" content="Create your cleaner profile, set availability, and list services on Find Trusted Cleaners." />
        <meta property="og:type" content="website" />
      </Head>

      <main className="relative min-h-screen text-[#0D9488] overflow-hidden">
        <img src="/background.jpg" alt="Background" className="absolute inset-0 w-full h-full object-cover -z-10" />

        <header className="flex items-center justify-between px-6 py-4 bg-white/30 shadow text-[#0D9488]">
          <Link href="/"><img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" /></Link>
          <nav className="space-x-6 text-sm font-medium">
            <Link href="/">Home</Link>
            <Link href="/cleaners" className="hover:text-teal-600">Find a Cleaner</Link>
            <Link href="/register/cleaners" className="hover:text-teal-600">List Yourself</Link>
            <Link href="/how-it-works" className="hover:text-teal-600">How It Works</Link>
            <Link href="/login" className="hover:text-teal-600">Login</Link>
            <Link href="/blog" className="hover:text-teal-600">Blog</Link>
          </nav>
        </header>

        <section className="max-w-3xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-[#0D9488] mb-4">Register as a Cleaner</h1>

          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* identity + contact */}
            <div>
              <input name="realName" onChange={handleChange} value={form.realName} placeholder="Real Name" className={`w-full p-2 border rounded text-[#0D9488] bg-white ${errors.realName ? 'border-red-500' : ''}`} required />
              {errors.realName && <p className="text-red-500 text-sm mt-1">{errors.realName}</p>}
            </div>
            <div>
              <input name="companyName" onChange={handleChange} value={form.companyName} placeholder="Company Name" className={`w-full p-2 border rounded text-[#0D9488] bg-white ${errors.companyName ? 'border-red-500' : ''}`} required />
              {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input name="houseNameNumber" onChange={handleChange} value={form.houseNameNumber} placeholder="House Name/Number" className={`w-full p-2 border rounded text-[#0D9488] bg-white ${errors.houseNameNumber ? 'border-red-500' : ''}`} required />
                {errors.houseNameNumber && <p className="text-red-500 text-sm mt-1">{errors.houseNameNumber}</p>}
              </div>
              <div>
                <input name="street" onChange={handleChange} value={form.street} placeholder="Street" className={`w-full p-2 border rounded text-[#0D9488] bg-white ${errors.street ? 'border-red-500' : ''}`} required />
                {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input name="county" onChange={handleChange} value={form.county} placeholder="County" className={`w-full p-2 border rounded text-[#0D9488] bg-white ${errors.county ? 'border-red-500' : ''}`} required />
                {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county}</p>}
              </div>
              <div>
                <input name="postcode" onChange={handleChange} value={form.postcode} placeholder="Postcode" className={`w-full p-2 border rounded text-[#0D9488] bg-white ${errors.postcode ? 'border-red-500' : ''}`} required />
                {errors.postcode && <p className="text-red-500 text-sm mt-1">{errors.postcode}</p>}
              </div>
            </div>
            <div>
              <input name="email" onChange={handleChange} value={form.email} placeholder="Email" type="email" className={`w-full p-2 border rounded text-[#0D9488] bg-white ${errors.email ? 'border-red-500' : ''}`} required />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <input name="phone" onChange={handleChange} value={form.phone} placeholder="Phone" type="tel" className={`w-full p-2 border rounded text-[#0D9488] bg-white ${errors.phone ? 'border-red-500' : ''}`} required />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div>
              <input name="password" onChange={handleChange} value={form.password} placeholder="Password" type="password" className={`w-full p-2 border rounded text-[#0D9488] bg-white ${errors.password ? 'border-red-500' : ''}`} required />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            <div>
              <input name="confirmPassword" onChange={handleChange} value={form.confirmPassword} placeholder="Confirm Password" type="password" className={`w-full p-2 border rounded text-[#0D9488] bg-white ${errors.confirmPassword ? 'border-red-500' : ''}`} required />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* rates */}
            <div>
              <input name="rates" onChange={handleChange} value={form.rates} placeholder="Hourly Rate (e.g. £22)" className={`w-full p-2 border rounded text-[#0D9488] bg-white ${errors.rates ? 'border-red-500' : ''}`} required />
              {errors.rates && <p className="text-red-500 text-sm mt-1">{errors.rates}</p>}
            </div>

            {/* services */}
            <div className={`p-4 bg-white rounded border shadow-sm ${errors.services ? 'border-red-500' : ''}`}>
              <h2 className="text-lg font-semibold mb-2 text-gray-600">Services You Offer</h2>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                {Object.entries(serviceCategories).map(([category, services]) => (
                  <div key={category} className="mb-4">
                    <h3 className="text-md font-semibold mb-2">{category}</h3>
                    <div className="grid grid-cols-2 gap-2 text-gray-600">
                      {services.map(service => (
                        <label key={service} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.services.includes(service)}
                            onChange={() => handleServiceToggle(service)}
                            className="accent-teal-700"
                          />
                          {service}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {errors.services && <p className="text-red-500 text-sm mt-2">{errors.services}</p>}

              <div className="mt-4 pt-4 border-t space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="businessInsurance"
                    checked={form.businessInsurance}
                    onChange={handleChange}
                    className="accent-teal-700"
                  />
                  <span>I have business insurance</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="dbsChecked"
                    checked={form.dbsChecked}
                    onChange={handleChange}
                    className="accent-teal-700"
                  />
                  <span>I have a valid DBS check</span>
                </label>
              </div>
            </div>

            {/* availability grid */}
            <div>
              <h2 className="text-lg font-semibold mt-4 mb-2">Set Your Availability</h2>
              <div className="overflow-auto">
                <div className="grid grid-cols-[auto_repeat(13,minmax(40px,1fr))] gap-px bg-gray-300 text-sm">
                  <div className="bg-white p-1 text-center font-semibold">Day/Hour</div>
                  {hours.map(hour => (
                    <div key={hour} className="bg-white p-1 text-center font-semibold">
                      {hour}:00
                    </div>
                  ))}
                  {daysShort.map(shortDay => (
                    <React.Fragment key={shortDay}>
                      <div className="bg-white p-1 text-center font-medium">{shortDay}</div>
                      {hours.map(hour => {
                        const key = `${shortDay}-${hour}`;
                        const active = !!form.availability[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleAvailability(shortDay, hour)}
                            className={`p-1 text-center ${active ? 'bg-green-500' : 'bg-red-300'} text-white`}
                            title={active ? 'Available' : 'Unavailable'}
                          >
                            {active ? '✓' : '×'}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Default is <em>unavailable</em>. Toggle any slot to mark it as available.
              </p>
            </div>

            <label className="flex items-center space-x-2 text-sm mt-4">
              <input type="checkbox" required className="accent-teal-700" />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="underline text-teal-700">Terms & Conditions</Link> and{' '}
                <Link href="/privacy-policy" className="underline text-teal-700">Privacy Policy</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-4 w-full py-3 rounded shadow text-white font-medium ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0D9488] hover:bg-teal-700'
              }`}
            >
              {isSubmitting ? 'Registering...' : 'Register Cleaner'}
            </button>
          </form>
        </section>

        <footer className="bg-[#0D9488] text-white border-t py-6 px-6 text-center text-sm">
          <nav className="flex flex-wrap justify-center gap-4 mb-2">
            <Link href="/about">About Us</Link>
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/cookie-policy">Cookie Policy</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQs</Link>
            <Link href="/sitemap">Site Map</Link>
          </nav>

          <p className="mb-2">&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>

          <p className="text-xs">
            FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
            <Link href="/privacy-policy" className="underline">Privacy Policy</Link> and{' '}
            <Link href="/cookie-policy" className="underline">Cookie Policy</Link> for details on how we protect your data.
            You may <Link href="/contact" className="underline">contact us</Link> at any time to manage your personal information.
          </p>
        </footer>
      </main>
    </>
  );
}
