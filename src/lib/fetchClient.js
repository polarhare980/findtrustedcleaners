// src/lib/fetchClient.js
import { secureFetch } from '@/lib/secureFetch';

export async function fetchClient() {
  const res = await fetch('/api/auth/me');
  const data = await res.json();
  return data?.user || null;
}
