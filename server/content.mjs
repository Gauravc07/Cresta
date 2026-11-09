/*
 * Public content, loaded from the `cresta` schema and held in memory so pages render without
 * waiting on the database. If the database is unreachable the bundled seed content (or the
 * last good copy) is served instead. Admin writes call refresh() so edits appear immediately.
 */
import {
  CATEGORIES, DEFAULT_BANNERS, DOWNLOADS, FRP_COLLECTIONS, FRP_MODELS, PRODUCTS, SETTINGS,
} from '../src/data/seed.js';
import { getPool, query } from './db.mjs';

const TTL_MS = 5 * 60_000;

const fallback = () => ({
  public: {
    settings: SETTINGS,
    catalog: { categories: CATEGORIES, products: PRODUCTS },
    frp: { collections: FRP_COLLECTIONS, models: FRP_MODELS },
    downloads: DOWNLOADS,
    banners: DEFAULT_BANNERS,
    testimonials: [],
    projects: [],
    blogs: [],
    nav: { projects: 0, blogs: 0 },
  },
  posts: {},
  redirects: new Map(),
});

let state = fallback();
let version = 1;
let signature = '';
let loadedAt = 0;
let loading = null;

async function load() {
  const rows = async (sql) => (await query(sql)).rows;
  const [settings, categories, products, collections, models, downloads, banners, testimonials, projects, blogs, redirects] = await Promise.all([
    rows('select key, value from cresta.settings'),
    rows('select * from cresta.categories order by sort'),
    rows('select * from cresta.products where is_published order by sort'),
    rows('select * from cresta.frp_collections order by sort'),
    rows('select * from cresta.frp_models where is_published order by sort'),
    rows('select * from cresta.downloads where is_published order by sort'),
    rows('select id, eyebrow, title, subtitle, image_path, image_alt, cta_label, cta_url from cresta.banners where is_active order by sort, created_at'),
    rows('select id, name, photo_path, review, rating from cresta.testimonials where is_published order by sort, created_at desc'),
    rows('select id, name, slug, location, description, images, updated_at from cresta.projects where is_published order by sort, created_at desc'),
    rows(`select id, title, slug, category, excerpt, image_path, image_alt, content, meta_title, meta_description, published_at, updated_at
          from cresta.blogs where status = 'published' and published_at <= now() order by published_at desc`),
    rows('select from_path, to_path from cresta.redirects'),
  ]);

  const clean = (v) => JSON.parse(JSON.stringify(v)); // Dates become ISO strings, as the browser will see them
  const blogRows = clean(blogs);
  const next = {
    public: {
      settings: { ...SETTINGS, ...Object.fromEntries(settings.map((r) => [r.key, r.value])) },
      catalog: clean({ categories, products }),
      frp: clean({
        collections,
        models: models.map((m) => ({ ...m, width_ft: Number(m.width_ft), length_ft: m.length_ft == null ? null : Number(m.length_ft) })),
      }),
      downloads: clean(downloads),
      banners: banners.length ? clean(banners) : DEFAULT_BANNERS,
      testimonials: clean(testimonials),
      projects: clean(projects),
      blogs: blogRows.map(({ content, ...rest }) => rest),
      nav: { projects: projects.length, blogs: blogs.length },
    },
    posts: Object.fromEntries(blogRows.map((b) => [b.slug, b])),
    redirects: new Map(redirects.map((r) => [r.from_path, r.to_path])),
  };

  const sig = JSON.stringify([next.public, next.posts, redirects]);
  if (sig !== signature) { signature = sig; version += 1; }
  state = next;
  loadedAt = Date.now();
}

/** Reload from the database. Concurrent calls share one load; failures keep the last good copy. */
export function refresh() {
  if (!getPool()) return Promise.resolve();
  // A write made during a running load must not be missed, so queue one more load after it.
  const run = () => load()
    .catch((err) => { console.error('[content] using last good copy:', err.message); loadedAt = Date.now(); });
  loading = (loading ?? Promise.resolve()).then(run).finally(() => {});
  return loading;
}

function touch() { if (Date.now() - loadedAt > TTL_MS) { loadedAt = Date.now(); refresh(); } }

export const contentVersion = () => version;
export function publicContent() { touch(); return state.public; }
export function findPost(slug) { touch(); return state.posts[slug] ?? null; }
export function findProject(slug) { touch(); return state.public.projects.find((p) => p.slug === slug) ?? null; }
export const findRedirect = (path) => state.redirects.get(path) ?? null;
export const allPosts = () => Object.values(state.posts);

/** Everything the page renderer can read: public keys plus lazily resolved `blog:` and `project:` keys. */
export function renderData() {
  return new Proxy(publicContent(), {
    get(target, key) {
      if (typeof key === 'string' && key.startsWith('blog:')) return findPost(key.slice(5));
      if (typeof key === 'string' && key.startsWith('project:')) return findProject(key.slice(8));
      return target[key];
    },
  });
}
