const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function businessRequest(path, { token, organizationId, method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (organizationId) headers['x-organization-id'] = organizationId;
  const response = await fetch(API_BASE_URL + path, {
    method, headers, signal, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 204) return undefined;
  let payload;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message || payload?.message || `Business request failed (${response.status}).`);
  }
  return payload?.data ?? payload;
}
