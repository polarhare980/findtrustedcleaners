import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

function Section({ title, children }) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/86 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700 sm:text-[15px]">{children}</div>
    </section>
  );
}

export default function LegalPage({ eyebrow, title, intro, updatedAt, sections }) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_40%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_32%),linear-gradient(135deg,#f8fffe_0%,#eefcf9_48%,#ffffff_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.12),rgba(13,148,136,0.05),rgba(255,255,255,0.12))]" />
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="relative rounded-[32px] border border-white/70 bg-white/84 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">{intro}</p>
            <div className="mt-6 inline-flex items-center rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
              Last updated: {updatedAt}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5">
          {sections.map((section) => (
            <Section key={section.title} title={section.title}>
              {section.content}
            </Section>
          ))}

          <section className="rounded-[28px] border border-teal-100 bg-[linear-gradient(135deg,rgba(240,253,250,0.95),rgba(255,255,255,0.98))] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Related pages</h2>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href="/terms" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-800">Terms &amp; Conditions</Link>
              <Link href="/privacy-policy" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-800">Privacy Policy</Link>
              <Link href="/cookie-policy" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-800">Cookie Policy</Link>
              <Link href="/contact" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-800">Contact</Link>
            </div>
          </section>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
