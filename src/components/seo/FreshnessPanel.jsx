import Link from 'next/link';

export default function FreshnessPanel({ cleaners = [], title = 'Fresh local marketplace signals' }) {
  const visible = Array.isArray(cleaners) ? cleaners.slice(0, 6) : [];
  const premiumCount = visible.filter((cleaner) => cleaner?.isPremium).length;
  const insuredCount = visible.filter((cleaner) => cleaner?.businessInsurance).length;
  const reviewedCount = visible.filter((cleaner) => Number(cleaner?.googleReviewCount) > 0).length;
  return (
    <section className="site-section py-8">
      <div className="rounded-[32px] border border-teal-100 bg-teal-50/70 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Live marketplace</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">{title}</h2>
        <p className="mt-4 max-w-3xl text-slate-700">As cleaners update their profiles, pricing, services and availability, the marketplace gains fresh local signals instead of relying on static directory pages.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3"><Stat label="Visible profiles sampled" value={visible.length} /><Stat label="Premium profiles sampled" value={premiumCount} /><Stat label="Profiles with trust signals" value={insuredCount + reviewedCount} /></div>
        {visible.length ? <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{visible.map((cleaner) => <Link key={cleaner._id} href={`/cleaners/${cleaner._id}`} className="rounded-2xl border border-white bg-white/90 p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200"><strong className="block text-slate-900">{cleaner.companyName || cleaner.realName || 'Local cleaner'}</strong><span className="mt-1 block text-slate-600">{cleaner.address?.town || cleaner.address?.county || 'Local profile'} · {cleaner.rates ? `from £${cleaner.rates}/hr` : 'profile pricing'}</span></Link>)}</div> : null}
      </div>
    </section>
  );
}
function Stat({ label, value }) { return <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-sm"><div className="text-3xl font-black text-slate-900">{value}</div><p className="mt-1 text-sm font-semibold text-slate-600">{label}</p></div>; }
