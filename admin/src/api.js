let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

/** Calls /api/admin/<path>. Throws an Error whose message is safe to show to the user. */
export async function api(path, { method = 'GET', body, raw, contentType } = {}) {
  const headers = { 'X-Requested-With': 'cresta-admin' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (raw) headers['Content-Type'] = contentType;
  let res;
  try {
    res = await fetch(`/api/admin${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/login' && path !== '/me') onUnauthorized();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}

/** Shrinks a photo in the browser (longest side 2000 px, WebP) before uploading, so pages stay fast. */
export async function uploadImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Choose a JPG, PNG or WebP image.');
  let blob = file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const webp = await new Promise((resolve) => { canvas.toBlob(resolve, 'image/webp', 0.84); });
    if (webp && webp.type === 'image/webp') blob = webp;
  } catch { /* Upload the original if the browser cannot convert it. */ }
  if (blob.size > 6 * 1024 * 1024) throw new Error('That image is larger than 6 MB after compression. Choose a smaller one.');
  const { url } = await api(`/media?name=${encodeURIComponent(file.name)}`, { method: 'POST', raw: blob, contentType: blob.type });
  return url;
}

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');
export const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
