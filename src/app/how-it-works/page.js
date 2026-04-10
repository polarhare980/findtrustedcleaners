import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';

export const metadata = {
  title: 'How it works | Find Trusted Cleaners',
  description: 'See how clients and cleaners use Find Trusted Cleaners.',
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />
      <PageHero
        eyebrow="How it works"
        title="A clearer way to connect cleaners and clients"
        description="FindTrustedCleaners is built to make browsing, requesting, and managing bookings simpler for both sides."
        actions={<>
          <Link href="/cleaners" className="ftc-button-primary">Find a cleaner</Link>
          <Link href="/register/cleaners" className="ftc-button-secondary">List your business</Link>
        </>}
      />

      <section className="site-section py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <FlowCard
            title="For clients"
            items={[
              'Browse local cleaner profiles for free.',
              'See availability, ratings, and service information upfront.',
              'Request a time slot with your chosen cleaner.',
              'Payment only moves forward once the cleaner approves the request.',
              'Requested slots are marked to help prevent double booking.',
            ]}
          />
          <FlowCard
            title="For cleaners"
            items={[
              'Register your cleaning business and build your public profile.',
              'Set your working hours using the availability grid.',
              'Keep your contact details protected until a booking is confirmed.',
              'Accept or decline requests from your dashboard.',
              'Update availability as bookings come in so the calendar stays clear.',
            ]}
          />
        </div>
      </section>

      <section className="site-section pb-12">
        <div className="surface-card p-8 text-center sm:p-10">
          <h2 className="text-3xl font-bold text-slate-900">Why people prefer this model</h2>
          <p className="mx-auto mt-4 max-w-3xl text-slate-600">Instead of relying on endless quote requests, the platform focuses on clearer profiles, visible availability, and a cleaner approval step before payment. That makes the experience easier to understand on first glance.</p>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}

function FlowCard({ title, items }) {
  return (
    <div className="surface-card p-8">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <ol className="mt-6 space-y-4">
        {items.map((item, index) => (
          <li key={item} className="flex gap-4">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">{index + 1}</span>
            <span className="text-slate-600">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
