export default function PageHero({ eyebrow, title, description, actions }) {
  return (
    <section className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_32%),linear-gradient(135deg,#f8fffe_0%,#eefcf9_48%,#ffffff_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.12),rgba(13,148,136,0.05),rgba(255,255,255,0.12))]" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="relative max-w-4xl rounded-[32px] border border-white/70 bg-white/82 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-10">
          {eyebrow ? <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">{eyebrow}</p> : null}
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
          {description ? <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{description}</p> : null}
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
