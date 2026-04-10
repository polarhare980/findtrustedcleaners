export default function PageHero({ eyebrow, title, description, actions }) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-teal-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <div className="max-w-3xl">
          {eyebrow ? <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p> : null}
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
          {description ? <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p> : null}
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
