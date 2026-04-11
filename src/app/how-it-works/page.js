import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';

export const metadata = {
  title: 'How it works | Find Trusted Cleaners',
  description: 'See how Find Trusted Cleaners works for clients and cleaners, with free browsing, free basic listings, and optional premium upgrades for extra visibility.',
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_38%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />
      <PageHero
        eyebrow="How it works"
        title="Free to use. Built to make booking cleaners simpler."
        description="Clients can browse and request cleaners for free. Cleaners can join and create a basic profile for free, then choose a premium upgrade if they want stronger visibility and a more powerful profile."
        actions={<>
          <Link href="/cleaners" className="ftc-button-primary">Find a cleaner</Link>
          <Link href="/register/cleaners" className="ftc-button-secondary">List your business</Link>
        </>}
      />

      <section className="site-section -mt-10 pb-10">
        <div className="rounded-[30px] border border-white/70 bg-white/86 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Free for clients', 'Browse cleaner profiles, compare services, and send requests without paying to use the platform.'],
              ['Free basic listing for cleaners', 'Create a public profile, show your services, and appear on the marketplace at no cost.'],
              ['Optional premium upgrade', 'Upgrade only if you want stronger visibility, richer profile features, and more chances to stand out.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section pb-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <FlowCard
            title="For clients"
            intro="The client side is simple by design. You can explore the marketplace, compare options, and send a booking request without hitting a paywall."
            items={[
              'Browse cleaner profiles for free.',
              'Check services, service pricing, profile details, and live availability before you enquire.',
              'Choose a cleaner that fits your area, budget, and timing.',
              'Send a booking request directly through the platform.',
              'Payment only moves forward once the cleaner approves the request.',
            ]}
          />
          <FlowCard
            title="For cleaners"
            intro="Cleaners can join without upfront cost, get listed on the marketplace, and decide later whether the premium upgrade is worth it for their business."
            items={[
              'Register your business and create a basic public profile for free.',
              'Add services, set pricing, and keep your availability up to date.',
              'Appear in marketplace searches so local clients can find you.',
              'Manage requests from your dashboard and approve jobs before payment completes.',
              'Upgrade to premium if you want extra profile strength and stronger marketplace presence.',
            ]}
          />
        </div>
      </section>

      <section className="site-section py-8">
        <div className="surface-muted p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Why the model works</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">A fairer marketplace on both sides</h2>
              <p className="mt-4 text-slate-600">Clients do not have to pay to browse. Cleaners do not have to pay just to join. The platform stays open and useful at the basic level, while premium gives ambitious cleaners a clear upgrade path if they want more visibility and a stronger sales presence.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {['No paywall for clients', 'No forced fee to join', 'Premium is optional', 'Designed for trust and clarity'].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-section pb-12">
        <div className="rounded-[32px] border border-white/70 bg-white/88 p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Built for growth</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Start free. Upgrade when you want more.</h2>
          <p className="mx-auto mt-4 max-w-3xl text-slate-600">That keeps the marketplace more accessible for everyone, while giving serious cleaners a simple way to invest in better visibility when they are ready to win more work.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register/cleaners" className="ftc-button-primary">Create cleaner profile</Link>
            <Link href="/cleaners" className="ftc-button-secondary">Browse cleaners</Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}

function FlowCard({ title, intro, items }) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="border-b border-teal-100 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_34%),linear-gradient(135deg,#f7fffe_0%,#ecfdfa_48%,#ffffff_100%)] p-6 sm:p-7">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-3 max-w-2xl text-slate-600">{intro}</p>
      </div>
      <div className="p-6 sm:p-7">
        <ol className="space-y-4">
          {items.map((item, index) => (
            <li key={item} className="flex gap-4">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">{index + 1}</span>
              <span className="text-slate-600">{item}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
