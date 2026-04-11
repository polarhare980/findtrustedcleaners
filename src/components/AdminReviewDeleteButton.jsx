'use client';

import { useState } from 'react';

export default function AdminReviewDeleteButton({ id }) {
  const [busy, setBusy] = useState(false);

  async function removeReview() {
    if (!window.confirm('Delete this review?')) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to delete review');
      }

      window.location.reload();
    } catch (error) {
      window.alert(error?.message || 'Failed to delete review');
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="rounded bg-rose-600 px-2 py-1 text-white disabled:cursor-not-allowed disabled:opacity-60"
      onClick={removeReview}
      disabled={busy}
    >
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  );
}
