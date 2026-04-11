"use client";

import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";

export default function SitemapPage() {
  return (
    <>
      <PublicHeader />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Sitemap
        </h1>

        <div className="grid md:grid-cols-3 gap-10">

          {/* Main Pages */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-teal-600">
              Main Pages
            </h2>

            <ul className="space-y-3 text-gray-700">
              <li>
                <Link href="/" className="hover:text-teal-600">
                  Home
                </Link>
              </li>

              <li>
                <Link href="/search" className="hover:text-teal-600">
                  Find Cleaners
                </Link>
              </li>

              <li>
                <Link href="/about" className="hover:text-teal-600">
                  About Us
                </Link>
              </li>

              <li>
                <Link href="/contact" className="hover:text-teal-600">
                  Contact
                </Link>
              </li>

              <li>
                <Link href="/faq" className="hover:text-teal-600">
                  FAQ
                </Link>
              </li>

              <li>
                <Link href="/blog" className="hover:text-teal-600">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-teal-600">
              Accounts
            </h2>

            <ul className="space-y-3 text-gray-700">
              <li>
                <Link href="/login" className="hover:text-teal-600">
                  Login
                </Link>
              </li>

              <li>
                <Link href="/register/cleaners" className="hover:text-teal-600">
                  Register as Cleaner
                </Link>
              </li>

              <li>
                <Link href="/register/clients" className="hover:text-teal-600">
                  Register as Client
                </Link>
              </li>

              <li>
                <Link href="/dashboard/client" className="hover:text-teal-600">
                  Client Dashboard
                </Link>
              </li>

              <li>
                <Link href="/cleaners/dashboard" className="hover:text-teal-600">
                  Cleaner Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-teal-600">
              Legal
            </h2>

            <ul className="space-y-3 text-gray-700">
              <li>
                <Link href="/privacy-policy" className="hover:text-teal-600">
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link href="/terms" className="hover:text-teal-600">
                  Terms & Conditions
                </Link>
              </li>

              <li>
                <Link href="/sitemap" className="hover:text-teal-600">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer spacing */}
        <div className="mt-16 text-sm text-gray-500">
          FindTrustedCleaners.com — Trusted Local Cleaners Marketplace
        </div>

      </div>
    </>
  );
}