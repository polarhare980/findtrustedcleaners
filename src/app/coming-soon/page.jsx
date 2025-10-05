// src/app/coming-soon/page.jsx
export const dynamic = 'force-static';

export default function ComingSoonPage({ searchParams }) {
  const feature = decodeURIComponent(searchParams?.feature || 'This feature');

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
      <div className="max-w-5xl mx-auto px-4 py-14">
        {/* Hero */}
        <section className="bg-white/70 backdrop-blur-md border border-white/40 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          <div
            className="mx-auto w-20 h-20 rounded-2xl grid place-items-center mb-6"
            style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
          >
            <span className="text-4xl text-white">🧼</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-teal-700 to-teal-900 bg-clip-text text-transparent">
            {feature} — Coming Soon
          </h1>

          <p className="mt-4 text-gray-700 leading-relaxed max-w-2xl mx-auto">
            Built for real cleaners, not paperwork. Export your bookings, earnings and availability in a few clicks.
            Perfect for taxes, clients, and a tidy inbox. Your data, your way. 🧽
          </p>

          {/* Mop-mentum meter */}
          <div className="mt-8">
            <p className="text-sm text-gray-600 mb-2">Mop-mentum meter</p>
            <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 h-full rounded-full animate-[sweep_2.5s_ease-in-out_infinite]"
                   style={{ width: '68%', background: 'linear-gradient(90deg,#0D9488,#14B8A6)' }} />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              We’re polishing edges and testing CSV/JSON formats with real cleaner data.
            </p>
          </div>

          {/* Primary CTAs */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <a
              href="/cleaners/dashboard"
              className="px-5 py-3 rounded-xl text-white font-semibold shadow transition-all
                         bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
            >
              ← Back to Dashboard
            </a>
            <a
              href="/contact"
              className="px-5 py-3 rounded-xl font-semibold border border-teal-300 text-teal-800 bg-white/70 hover:bg-white"
            >
              Need an export now?
            </a>
          </div>
        </section>

        {/* What you’ll get */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <Badge>📦</Badge>
            <Title>One-click CSV & JSON</Title>
            <Body>Bookings, availability (including overrides), earnings, and gallery meta. Ready for spreadsheets or your accountant.</Body>
            <Checklist items={[
              'Bookings & statuses (approved/pending/declined)',
              'Availability + week overrides',
              'Earnings & fees summary',
              'Customer details (privacy-safe)',
            ]}/>
          </Card>

          <Card>
            <Badge>🛡️</Badge>
            <Title>Privacy & GDPR Ready</Title>
            <Body>Your data belongs to you. We only export what you can already see, in a portable format. No surprises, no hidden columns.</Body>
            <Checklist items={[
              'Download only on your account',
              'Human-readable fields',
              'Timestamped exports',
              'Easy to delete from your device',
            ]}/>
          </Card>
        </section>

        {/* Roadmap */}
        <section className="mt-12 bg-white/70 backdrop-blur-md border border-white/40 rounded-3xl shadow-xl p-6">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-teal-700 to-teal-900 bg-clip-text text-transparent mb-4">
            Rollout plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RoadmapStep
              icon="🧹"
              title="Phase 1 — Bookings CSV"
              desc="Export job history, client initials, status, timestamps."
              status="In testing"
            />
            <RoadmapStep
              icon="🗓️"
              title="Phase 2 — Availability + Overrides"
              desc="Week patterns and date-specific changes for real diaries."
              status="Building"
            />
            <RoadmapStep
              icon="💷"
              title="Phase 3 — Earnings & Invoices"
              desc="Payout summaries and invoice-friendly fields."
              status="Queued"
            />
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Bonus: Gallery export (filenames + alt text) for portfolio backups.
          </p>
        </section>

        {/* Notify form */}
        <section className="mt-12">
          <div className="bg-gradient-to-r from-amber-50 to-white border border-amber-200 rounded-3xl p-6 md:p-8 shadow">
            <h3 className="text-lg md:text-xl font-semibold text-amber-900">
              Want first dibs when it goes live?
            </h3>
            <p className="text-amber-800/90 mt-1">
              Pop your email in and we’ll message you the second exports are ready.
            </p>

            <form
              action="/contact"
              method="GET"
              className="mt-4 flex flex-col sm:flex-row gap-3"
              onSubmit={(e) => {
                // purely decorative progressive enhancement
              }}
            >
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="flex-1 px-4 py-3 rounded-xl border border-amber-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl text-white font-semibold shadow transition-all
                           bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                Notify me
              </button>
            </form>
          </div>
        </section>

        {/* FAQ for cleaners */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Faq
            q="Will this help with taxes?"
            a="Yes. You’ll get a clean CSV with dates, totals and fees to hand to your accountant or upload to a spreadsheet."
          />
          <Faq
            q="Can I export only a date range?"
            a="That’s on the list. Initial release is ‘everything’, followed by filters: date range, statuses, and per-client."
          />
          <Faq
            q="Does it include personal phone/email fields?"
            a="We export what you’re allowed to see in your account. Private details are kept safe—privacy first."
          />
          <Faq
            q="What formats do you support?"
            a="CSV for spreadsheets and JSON for developers/automations. PDFs for invoices are planned."
          />
        </section>

        {/* Footer */}
        <p className="mt-10 text-center text-xs text-gray-500">
          Built for cleaners who’d rather be cleaning than copy-pasting spreadsheets.
        </p>
      </div>

      {/* Tiny CSS keyframes for the progress sweep */}
      <style>{`
        @keyframes sweep {
          0% { width: 8%; transform: translateX(0%); opacity: .9; }
          50% { width: 72%; transform: translateX(14%); opacity: 1; }
          100% { width: 8%; transform: translateX(100%); opacity: .9; }
        }
      `}</style>
    </main>
  );
}

/* ---------- Little UI helpers (inline for single-file drop-in) ---------- */

function Card({ children }) {
  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-3xl shadow-xl p-6">
      {children}
    </div>
  );
}
function Badge({ children }) {
  return (
    <span className="inline-block mb-3 text-xs font-semibold text-white px-3 py-1 rounded-full"
          style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
      {children}
    </span>
  );
}
function Title({ children }) {
  return (
    <h3 className="text-lg md:text-xl font-bold text-teal-900">{children}</h3>
  );
}
function Body({ children }) {
  return (
    <p className="mt-2 text-gray-700 leading-relaxed">{children}</p>
  );
}
function Checklist({ items = [] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-2 text-gray-800">
          <span className="mt-0.5">✅</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
function RoadmapStep({ icon, title, desc, status }) {
  return (
    <div className="p-4 rounded-2xl border border-gray-200 bg-white/70">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center text-xl"
             style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: 'white' }}>
          {icon}
        </div>
        <div>
          <p className="font-semibold text-teal-900">{title}</p>
          <p className="text-xs text-gray-500">{status}</p>
        </div>
      </div>
      <p className="mt-3 text-gray-700">{desc}</p>
    </div>
  );
}
function Faq({ q, a }) {
  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-3xl shadow-xl p-6">
      <p className="font-semibold text-teal-900">{q}</p>
      <p className="mt-1 text-gray-700">{a}</p>
    </div>
  );
}
