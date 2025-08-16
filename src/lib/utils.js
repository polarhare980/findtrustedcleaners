// Safe: no regex .match() calls; never throws on undefined
export function getCleanerId(cleaner, fallback) {
  const candidate =
    (cleaner && (cleaner._id || cleaner.id || cleaner.cleanerId)) ||
    fallback ||
    '';

  // normalize to string
  const str = typeof candidate === 'string' ? candidate : String(candidate || '');

  // Optional: if you previously tried to .match(/^[0-9a-f]{24}$/i), do a safe check:
  // Just return the string; don't .match() on undefined
  return str;
}
