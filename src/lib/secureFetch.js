export async function secureFetch(url, options = {}) {
  return fetch(url, {
    credentials: 'include',
    ...options,
  });
}
