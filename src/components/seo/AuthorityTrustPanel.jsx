import { TRUST_SIGNALS } from '@/lib/seo/regionalSeoData';

export default function AuthorityTrustPanel({ title = 'Built for trust, not just traffic', intro }) {
  return (
    <section className="site-section py-8">
      <div className="rounded-[32px] border border-teal-100 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Authority and trust</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">{title}</h2>
        <p className="mt-4 max-w-3xl text-slate-600">{intro || 'FindTrustedCleaners.com is being built as a transparent local marketplace: clear cleaner profiles, visible services, availability-led browsing and cleaner-first profile controls.'}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_SIGNALS.map((signal) => <div key={signal} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{signal}</div>)}
        </div>
      </div>
    </section>
  );
}
