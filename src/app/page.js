'use client';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Head from "next/head";
import Link from "next/link";
<!-- Trigger redeploy -->

// ✅ Embed sanitisation
function isSafeEmbed(code) {
  const hasIframe = code.includes('<iframe') && code.includes('src=');
  const forbidden = ['<script', '<style', 'onerror', 'onload', 'javascript:'];
  const lower = code.toLowerCase();
  const containsForbidden = forbidden.some(frag => lower.includes(frag));
  return hasIframe && !containsForbidden;
}

export default function HomePage() {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCleaners = async () => {
      try {
        const res = await fetch("/api/cleaners");
        const contentType = res.headers.get("content-type");

        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response from server");
        }

        const data = await res.json();
        setCleaners(data.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch cleaners:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCleaners();
  }, []);

  const handleBookingRequest = (cleanerId) => {
    const clientId = localStorage.getItem('clientId');

    if (!clientId) {
      router.push(`/login/clients?next=/cleaners/${cleanerId}/checkout`);
    } else {
      router.push(`/cleaners/${cleanerId}/checkout`);
    }
  };

  return (
    <>
      <Head>
        <title>Find Trusted Cleaners | Trusted Local Cleaning Services UK</title>
        <meta
          name="description"
          content="Browse and book trusted, verified cleaners in your area. Rated professionals for your home cleaning needs."
        />
      </Head>

      <main className="relative min-h-screen overflow-hidden text-gray-700">
        <img
          src="/background.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-40 -z-10"
        />

        <header className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-teal-600 bg-opacity-90 shadow text-white space-y-2 sm:space-y-0">
          <Link href="/">
            <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
          </Link>
          <nav className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm font-medium">
            <Link href="/cleaners" className="active-tap">Find a Cleaner</Link>
            <Link href="/register" className="active-tap">List Yourself</Link>
            <Link href="/how-it-works" className="active-tap">How It Works</Link>
            <Link href="/login" className="active-tap">Login</Link>
            <Link href="/blog" className="active-tap">Blog</Link>
          </nav>
        </header>

        <section className="text-center py-10 bg-white/40 backdrop-blur rounded-xl mx-4 my-6">
          <h1 className="text-4xl font-bold text-[#0D9488]">Find Trusted Cleaners</h1>
          <p className="text-base text-gray-700 mt-2">
            Real Cleaners. Real Reviews. Book Local.
          </p>
        </section>

        <section className="flex flex-col sm:flex-row justify-center gap-6 px-6 py-8">
          <Link
            href="/cleaners"
            className="bg-[#0D9488] text-white px-6 py-4 rounded shadow hover:bg-teal-700 text-center w-full sm:w-auto active-tap"
          >
            Find a Cleaner
          </Link>
          <Link
            href="/register"
            className="bg-white text-[#0D9488] border border-[#0D9488] px-6 py-4 rounded shadow hover:bg-gray-100 text-center w-full sm:w-auto active-tap"
          >
            List Yourself
          </Link>
        </section>

        <section className="px-6 py-10">
          <h2 className="text-2xl font-semibold mb-4 text-center text-white drop-shadow">
            Featured Cleaners
          </h2>

          {loading ? (
            <p className="text-center text-white">Loading featured cleaners...</p>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4 px-2">
              {cleaners.map((cleaner, i) => (
                <div
                  key={i}
                  className="min-w-[250px] border rounded shadow p-4 bg-white bg-opacity-90 flex-shrink-0"
                >
                  <img
                    src={cleaner.image || "/profile-placeholder.png"}
                    alt={cleaner.realName}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <p className="font-bold">{cleaner.realName}</p>
                  <p>⭐ {cleaner.rating || "Not rated yet"}</p>
                  <p>💷 {cleaner.rate ? `£${cleaner.rate}/hr` : "Rate not set"}</p>

                  {(cleaner.googleReviewUrl || cleaner.facebookReviewUrl) && (
                    <div className="mt-2 flex flex-col gap-1 text-sm">
                      {cleaner.googleReviewUrl && (
                        <a
                          href={cleaner.googleReviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline active-tap"
                        >
                          Google Reviews
                        </a>
                      )}
                      {cleaner.facebookReviewUrl && (
                        <a
                          href={cleaner.facebookReviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline active-tap"
                        >
                          Facebook Reviews
                        </a>
                      )}
                    </div>
                  )}

                  {cleaner.embedCode && isSafeEmbed(cleaner.embedCode) && (
                    <div
                      className="mt-2"
                      dangerouslySetInnerHTML={{ __html: cleaner.embedCode }}
                    />
                  )}

                  <div className="mt-2 space-y-1">
                    <Link
                      href={`/cleaners/${cleaner._id}`}
                      className="block w-full text-center bg-blue-600 text-white py-1 rounded hover:bg-blue-700 active-tap"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => handleBookingRequest(cleaner._id)}
                      className="w-full bg-green-500 text-white py-1 rounded hover:bg-green-600 active-tap"
                    >
                      Request Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-10 bg-white/40 backdrop-blur-md rounded-xl mx-4 my-6">
          <div>
            <h3 className="text-xl font-semibold mb-2 text-[#0D9488]">For Cleaners</h3>
            <ul className="list-disc list-inside text-gray-700 text-base">
              <li>Get new clients without paying for leads</li>
              <li>Showcase your availability clearly</li>
              <li>Collect reviews and boost trust</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-[#0D9488]">For Clients</h3>
            <ul className="list-disc list-inside text-gray-700 text-base">
              <li>See cleaner availability before booking</li>
              <li>Read verified reviews</li>
              <li>Simple booking with no subscriptions</li>
            </ul>
          </div>
        </section>

        <footer className="bg-teal-600 border-t py-6 px-6 text-center text-sm text-white">
          <nav className="flex flex-wrap justify-center gap-4 mb-2">
            <Link href="/about" className="active-tap">About Us</Link>
            <Link href="/terms" className="active-tap">Terms & Conditions</Link>
            <Link href="/privacy-policy" className="active-tap">Privacy Policy</Link>
            <Link href="/cookie-policy" className="active-tap">Cookie Policy</Link>
            <Link href="/contact" className="active-tap">Contact</Link>
            <Link href="/faq" className="active-tap">FAQs</Link>
            <Link href="/sitemap" className="active-tap">Site Map</Link>
          </nav>
          <Link
            href="#"
            onClick={() => {
              localStorage.removeItem('cookie_consent');
              window.location.reload();
            }}
            className="underline active-tap"
          >
            Cookie Settings
          </Link>

          <p className="mb-2">&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>

          <p className="text-xs">
            FindTrustedCleaners is committed to GDPR compliance. Read our{" "}
            <Link href="/privacy-policy" className="underline active-tap">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/cookie-policy" className="underline active-tap">
              Cookie Policy
            </Link>{" "}
            for details on how we protect your data. You may{" "}
            <Link href="/contact" className="underline active-tap">
              contact us
            </Link>{" "}
            at any time to manage your personal information.
          </p>
        </footer>
      </main>

      {/* Tap feedback styling */}
      <style jsx global>{`
        .active-tap:active {
          transform: scale(0.98);
        }
      `}</style>
    </>
  );
}
