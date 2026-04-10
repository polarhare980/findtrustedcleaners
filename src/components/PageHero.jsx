export default function PageHero({ eyebrow, title, description, actions }) {
  return (
    <section className="mx-auto max-w-4xl px-4 pb-10 pt-12 text-center sm:px-6 lg:px-8 lg:pt-16">
      {eyebrow ? (
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">{eyebrow}</p>
      ) : null}
      <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      {description ? (
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">{description}</p>
      ) : null}
      {actions ? <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div> : null}
    </section>
  );
}
