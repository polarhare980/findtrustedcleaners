import Link from 'next/link';

export default function AccountShell({ title, description, children, backHref, backLabel = 'Back' }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
          </div>
          {backHref ? <Link href={backHref} className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800">{backLabel}</Link> : null}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
