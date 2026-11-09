import { createContext, useContext, useEffect, useState } from 'react';
import * as seed from '../data/seed.js';

/*
 * Content hooks.
 *  - On the server, pages read the content passed to the renderer and record which keys they used.
 *  - In the browser, those same keys arrive in the page itself, so hydration matches exactly.
 *  - Other keys load from /api/content after first paint. The bundled seed content is shown until
 *    then, and stays in place if the server cannot be reached.
 */
export const ContentContext = createContext(null);

let store = {};
if (typeof document !== 'undefined') {
  try { store = JSON.parse(document.getElementById('cresta-data')?.textContent || '{}'); } catch { store = {}; }
}

let bundle;
function loadBundle() {
  bundle ??= fetch('/api/content')
    .then((r) => (r.ok ? r.json() : {}))
    .then((all) => { store = { ...all, ...store }; })
    .catch((err) => { console.warn('[cresta] using bundled content:', err.message); });
  return bundle;
}

function useLive(key, fallback, loader = loadBundle) {
  const server = useContext(ContentContext);
  const [, rerender] = useState(0);
  useEffect(() => {
    if (server || store[key] !== undefined) return undefined;
    let alive = true;
    loader().then(() => { if (alive) rerender((n) => n + 1); });
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (server) {
    server.used.add(key);
    // A detail page has no fallback: the server already knows the item does not exist, so it is null.
    return server.data[key] ?? (fallback === undefined ? null : fallback);
  }
  return store[key] !== undefined ? store[key] : fallback;
}

export function useSettings() {
  return { ...seed.SETTINGS, ...useLive('settings', seed.SETTINGS) };
}
export function useCatalog() {
  return { data: useLive('catalog', { categories: seed.CATEGORIES, products: seed.PRODUCTS }) };
}
export function useFrpRange() {
  return { data: useLive('frp', { collections: seed.FRP_COLLECTIONS, models: seed.FRP_MODELS }) };
}
export function useDownloads() {
  return { data: useLive('downloads', seed.DOWNLOADS) };
}
export const useBanners = () => useLive('banners', seed.DEFAULT_BANNERS);
export const useTestimonials = () => useLive('testimonials', []);
export const useProjects = () => useLive('projects', []);
export const useBlogs = () => useLive('blogs', []);
export const useNavCounts = () => useLive('nav', { projects: 0, blogs: 0 });

/** One article or project. Returns undefined while loading and null when it does not exist. */
function useDetail(kind, slug) {
  const key = `${kind}:${slug}`;
  return useLive(key, undefined, () => fetch(`/api/content/${kind}/${encodeURIComponent(slug)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((row) => { store[key] = row; })
    .catch(() => { store[key] = null; }));
}
export const useBlogPost = (slug) => useDetail('blog', slug);
export const useProject = (slug) => useDetail('project', slug);

/** Save a website enquiry. Throws with `userMessage` when the server gives a reason worth showing. */
export async function submitEnquiry(enquiry, honeypot = '') {
  const res = await fetch('/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...enquiry, website: honeypot }),
  });
  if (res.ok) return;
  const body = await res.json().catch(() => ({}));
  const err = new Error(body.error || `HTTP ${res.status}`);
  if (res.status === 400 || res.status === 429) err.userMessage = body.error;
  throw err;
}

export const waLink = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
