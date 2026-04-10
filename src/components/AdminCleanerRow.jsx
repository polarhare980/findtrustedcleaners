'use client';

import { useState } from 'react';

export default function AdminCleanerRow({ row }) {
  const [slug, setSlug] = useState(row.slug || '');
  const [visible, setVisible] = useState(row.isVisible !== false);
  const [msg, setMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  async function save() {
    setMsg('');
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/cleaners/${row._id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slug, isVisible: visible }),
      });
      const json = await res.json();
      setMsg(json.message || (json.success ? 'Saved' : 'Failed'));
    } catch (error) {
      setMsg(error?.message || 'Failed to save cleaner');
    } finally {
      setIsSaving(false);
    }
  }

  async function removeCleaner() {
    const label = row.companyName || row.realName || 'this cleaner';
    const confirmed = window.confirm(
      `Delete ${label}? This will also remove linked bookings, purchases, reviews, saved favourites, and cleaner login records. This cannot be undone.`
    );

    if (!confirmed) return;

    setMsg('');
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/cleaners/${row._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to delete cleaner');
      }

      setMsg(json.message || 'Cleaner deleted');
      setIsDeleted(true);
    } catch (error) {
      setMsg(error?.message || 'Failed to delete cleaner');
    } finally {
      setIsDeleting(false);
    }
  }

  if (isDeleted) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        <div>
          <div className="font-medium">{row.companyName || row.realName}</div>
          <div className="text-xs">Cleaner deleted successfully.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-white p-3 text-sm">
      <div>
        <div className="font-medium">{row.companyName || row.realName}</div>
        <div className="text-xs text-slate-600">ID: {String(row._id)}</div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="text-xs">Slug:</label>
          <input
            className="rounded border px-2 py-1"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />

          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
            />
            Visible
          </label>

          <button
            className="rounded bg-slate-900 px-3 py-1 text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={save}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          <button
            className="rounded bg-rose-600 px-3 py-1 text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={removeCleaner}
            disabled={isSaving || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete cleaner'}
          </button>
        </div>

        {msg && <div className="mt-1 text-xs">{msg}</div>}
      </div>

      <a className="underline" href={`/cleaners/${row.slug || row._id}`}>
        View
      </a>
    </div>
  );
}
