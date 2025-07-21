// src/lib/fetchClient.js
export async function fetchClient() {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  const data = await res.json();
  return data?.user || null;
}
