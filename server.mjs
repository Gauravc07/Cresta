/*
 * Cresta production server.
 *
 *   npm run build && npm start
 *
 * - Renders each page to HTML on the server (real text, unique titles, real 404 status)
 * - Serves the JSON API (content, enquiries, admin) and the admin app at /admin
 * - Generates /sitemap.xml and /robots.txt from live content
 * - Strict security headers (see security.config.js); HTTPS when TLS_CERT and TLS_KEY are set
 * - Brotli/gzip, ETag/304, long-lived caching for hashed assets, nightly backups
 *
 * Env: PORT (default 8080, or 8443 with TLS), HOST (default 127.0.0.1), HTTP_PORT (redirect port with TLS),
 *      TLS_CERT, TLS_KEY, SITE_URL (public address, can also be set in Admin > Settings),
 *      TRUST_PROXY=1 (only behind your own reverse proxy), BACKUP_DIR (default ./backups, "off" disables).
 * From .env it reads only SUPABASE_DB_URL and the settings above; SUPABASE_SECRET_KEY is never loaded.
 */
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import zlib from 'node:zlib';
import { cacheControl, securityHeaders } from './security.config.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, 'dist');
const SSR_ENTRY = path.join(HERE, 'dist-ssr', 'entry-server.js');

const ENV_ALLOW = new Set(['SUPABASE_DB_URL', 'SITE_URL', 'PORT', 'HOST', 'HTTP_PORT', 'TLS_CERT', 'TLS_KEY', 'TRUST_PROXY', 'BACKUP_DIR']);
if (existsSync(path.join(HERE, '.env'))) {
  for (const line of readFileSync(path.join(HERE, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && ENV_ALLOW.has(m[1]) && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const TEMPLATE_PATH = path.join(ROOT, 'index.html');
const ADMIN_INDEX = path.join(ROOT, 'admin', 'index.html');
if (!existsSync(TEMPLATE_PATH) || !existsSync(SSR_ENTRY)) {
  console.error('Build not found. Run `npm run build` first.');
  process.exit(1);
}

// Imported after .env is read, because these modules use SUPABASE_DB_URL.
const { handleApi, serveMedia } = await import('./server/api.mjs');
const content = await import('./server/content.mjs');
const { writeBackup } = await import('./server/backup.mjs');
const { getPool } = await import('./server/db.mjs');
const ssr = await import(pathToFileURL(SSR_ENTRY).href);

const TEMPLATE = readFileSync(TEMPLATE_PATH, 'utf8');
const tls = process.env.TLS_CERT && process.env.TLS_KEY
  ? { cert: readFileSync(process.env.TLS_CERT), key: readFileSync(process.env.TLS_KEY) }
  : null;
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || (tls ? 8443 : 8080));
const BEHIND_HTTPS = !!tls || (!!process.env.TRUST_PROXY && /^https:/.test(process.env.SITE_URL || ''));

const pageHeaders = () => securityHeaders({ https: BEHIND_HTTPS, analytics: !!content.publicContent().settings.ga_id });

/** The public address comes from configuration, never from the Host header, which a client controls. */
function siteBase() {
  const configured = content.publicContent().settings.site_url || process.env.SITE_URL;
  return (configured || `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`).replace(/\/+$/, '');
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
};

function send(res, status, body, extra = {}) {
  res.writeHead(status, { ...pageHeaders(), 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...extra });
  res.end(body);
}
const redirect = (res, to) => send(res, 301, `Moved to ${to}`, { Location: to, 'Cache-Control': 'public, max-age=3600' });

/** Map a URL path to a file inside dist/, refusing anything that escapes the root or touches dotfiles. */
function resolvePath(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); } catch { return null; }
  if (decoded.includes('\0') || decoded.split(/[/\\]/).some((seg) => seg.startsWith('.') && seg !== '')) return null;
  const file = path.join(ROOT, path.normalize(decoded));
  return file.startsWith(ROOT + path.sep) || file === ROOT ? file : null;
}

async function serveFile(req, res, file, info, pathname, extra = {}) {
  const ext = path.extname(file).toLowerCase();
  const accept = String(req.headers['accept-encoding'] || '');
  let encoding = null;
  let body = file;
  for (const [enc, suffix] of [['br', '.br'], ['gzip', '.gz']]) {
    if (accept.includes(enc) && existsSync(file + suffix)) { encoding = enc; body = file + suffix; break; }
  }
  const bodyInfo = body === file ? info : await stat(body);
  const etag = `W/"${bodyInfo.size.toString(16)}-${Math.floor(bodyInfo.mtimeMs).toString(16)}${encoding ? `-${encoding}` : ''}"`;
  const headers = {
    ...pageHeaders(),
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': cacheControl(pathname),
    ETag: etag,
    'Last-Modified': info.mtime.toUTCString(),
    Vary: 'Accept-Encoding',
    ...extra,
  };
  if (encoding) headers['Content-Encoding'] = encoding;
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
  headers['Content-Length'] = bodyInfo.size;
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  createReadStream(body).on('error', () => res.destroy()).pipe(res);
  return undefined;
}

// ---------- server-rendered pages ----------
const brotli = promisify(zlib.brotliCompress);
const gzip = promisify(zlib.gzip);
const pageCache = new Map();
const PAGE_CACHE_MAX = 300;

async function renderPage(url) {
  const data = content.renderData();
  const settings = data.settings;
  const out = ssr.render(url, data);
  const pathname = url.split('?')[0];
  const head = ssr.buildHead(out.meta, { base: siteBase(), path: pathname, settings });
  // Function replacers, so a "$" in content is never read as a replacement pattern.
  const html = TEMPLATE
    .replace(/<!--head:start-->[\s\S]*?<!--head:end-->/, () => ssr.headToHtml(head, settings))
    .replace('<div id="root"></div>', () => `<div id="root">${out.html}</div>\n  <script type="application/json" id="cresta-data">${ssr.safeJson(out.embedded)}</script>`);
  const raw = Buffer.from(html);
  const [br, gz] = await Promise.all([
    brotli(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }),
    gzip(raw, { level: 6 }),
  ]);
  return { raw, br, gz, status: out.status, etag: `W/"${createHash('sha1').update(raw).digest('base64url')}"` };
}

async function servePage(req, res, url) {
  const pathname = url.pathname;
  // Query strings only filter what is already on the page, so one canonical address is cached per path.
  const key = `${content.contentVersion()}|${pathname}${url.search}`;
  let page = pageCache.get(key);
  if (!page) {
    page = await renderPage(pathname + url.search);
    if (!url.search && page.status === 200) {
      if (pageCache.size >= PAGE_CACHE_MAX) pageCache.clear();
      pageCache.set(key, page);
    }
  }
  const accept = String(req.headers['accept-encoding'] || '');
  const [body, encoding] = accept.includes('br') ? [page.br, 'br'] : accept.includes('gzip') ? [page.gz, 'gzip'] : [page.raw, null];
  const headers = {
    ...pageHeaders(),
    'Content-Type': TYPES['.html'],
    'Cache-Control': 'no-cache',
    ETag: page.etag,
    Vary: 'Accept-Encoding',
    ...(encoding ? { 'Content-Encoding': encoding } : {}),
  };
  if (page.status === 200 && req.headers['if-none-match'] === page.etag) { res.writeHead(304, headers); return res.end(); }
  headers['Content-Length'] = body.length;
  res.writeHead(page.status, headers);
  return res.end(req.method === 'HEAD' ? undefined : body);
}

// ---------- sitemap and robots ----------
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function sitemapXml() {
  const base = siteBase();
  const { projects } = content.publicContent();
  const posts = content.allPosts();
  const urls = [
    ['/', 1], ['/frp-pools', 0.9], ['/pumps-filtration', 0.9], ['/products', 0.9], ['/about', 0.6], ['/contact', 0.7],
    ...(posts.length ? [['/blog', 0.7]] : []),
    ...posts.map((p) => [`/blog/${p.slug}`, 0.6, p.updated_at]),
    ...(projects.length ? [['/projects', 0.7]] : []),
    ...projects.map((p) => [`/projects/${p.slug}`, 0.6, p.updated_at]),
  ];
  const body = urls.map(([loc, priority, modified]) => `  <url><loc>${xmlEsc(base + loc)}</loc>${modified ? `<lastmod>${xmlEsc(modified)}</lastmod>` : ''}<priority>${priority}</priority></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body.join('\n')}\n</urlset>\n`;
}

const robotsTxt = () => `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${siteBase()}/sitemap.xml\n`;

// ---------- routing ----------
const LEGACY_HTML = { '/index.html': '/', '/about.html': '/about', '/contact.html': '/contact', '/products.html': '/products', '/frp-pools.html': '/frp-pools', '/pumps-filtration.html': '/pumps-filtration' };

async function handler(req, res) {
  if ((req.url || '').length > 2048) return send(res, 414, 'URI Too Long');
  let url;
  try { url = new URL(req.url || '/', 'http://internal'); } catch { return send(res, 400, 'Bad Request'); }
  const pathname = url.pathname;

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    for (const [k, v] of Object.entries(pageHeaders())) res.setHeader(k, v);
    return handleApi(req, res, url);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });

  if (pathname === '/robots.txt') return send(res, 200, robotsTxt(), { 'Cache-Control': 'public, max-age=3600' });
  if (pathname === '/sitemap.xml') return send(res, 200, sitemapXml(), { 'Content-Type': TYPES['.xml'], 'Cache-Control': 'public, max-age=3600' });
  if (pathname.startsWith('/media/') && await serveMedia(req, res, pageHeaders(), pathname)) return undefined;

  const moved = LEGACY_HTML[pathname] ?? content.findRedirect(pathname);
  if (moved) return redirect(res, moved + url.search);
  if (pathname.length > 1 && pathname.endsWith('/') && !pathname.startsWith('/admin')) return redirect(res, pathname.replace(/\/+$/, '') + url.search);

  const file = resolvePath(pathname);
  if (!file) return send(res, 400, 'Bad Request');

  // The admin app: never indexed or cached. Its files are built under /admin/.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const noindex = { 'X-Robots-Tag': 'noindex, nofollow' };
    const info = await stat(file).catch(() => null);
    if (info?.isFile()) return serveFile(req, res, file, info, pathname, noindex);
    if (path.extname(pathname)) return send(res, 404, 'Not Found', noindex);
    return serveFile(req, res, ADMIN_INDEX, await stat(ADMIN_INDEX), '/index.html', { ...noindex, 'Cache-Control': 'no-store' });
  }

  const info = await stat(file).catch(() => null);
  if (info?.isFile()) return serveFile(req, res, file, info, pathname);
  if (path.extname(pathname)) return send(res, 404, 'Not Found');
  return servePage(req, res, url);
}

function harden(server) {
  server.headersTimeout = 10_000;
  server.requestTimeout = 60_000; // long enough for an image upload on a slow connection
  server.keepAliveTimeout = 5_000;
  server.on('clientError', (err, socket) => {
    if (err.code === 'ECONNRESET' || !socket.writable) { socket.destroy(); return; }
    // 408 on a reused keep-alive socket is retried automatically by browsers; a 400 would not be.
    const status = {
      ERR_HTTP_REQUEST_TIMEOUT: '408 Request Timeout',
      HPE_HEADER_OVERFLOW: '431 Request Header Fields Too Large',
    }[err.code] ?? '400 Bad Request';
    if (process.env.DEBUG_CLIENT_ERRORS) console.warn('clientError', err.code);
    socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  });
  return server;
}

const wrap = (req, res) => handler(req, res).catch((err) => {
  console.error(err);
  if (!res.headersSent) send(res, 500, 'Internal Server Error');
  else res.destroy();
});

// One bad request or dropped connection must not take the whole site down.
process.on('uncaughtException', (err) => console.error('[uncaught]', err));
process.on('unhandledRejection', (err) => console.error('[unhandled]', err));

await content.refresh();
if (!getPool()) console.warn('SUPABASE_DB_URL is not set: serving bundled content; enquiries and admin are unavailable.');

// ---------- nightly backups ----------
const backupDir = process.env.BACKUP_DIR || path.join(HERE, 'backups');
if (getPool() && backupDir !== 'off') {
  const DAY = 24 * 60 * 60_000;
  const run = () => writeBackup(backupDir)
    .then((file) => console.log(`Backup written: ${path.basename(file)}`))
    .catch((err) => console.error('[backup] failed:', err.message));
  const latest = await readdir(backupDir).then((f) => f.filter((n) => n.endsWith('.json')).sort().pop()).catch(() => null);
  const age = latest ? Date.now() - (await stat(path.join(backupDir, latest))).mtimeMs : Infinity;
  setTimeout(() => { run(); setInterval(run, DAY).unref(); }, Math.max(60_000, DAY - age)).unref();
}

if (tls) {
  harden(https.createServer({ ...tls, minVersion: 'TLSv1.2' }, wrap)).listen(PORT, HOST, () => {
    console.log(`Cresta (HTTPS) → https://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}  admin: /admin`);
  });
  const HTTP_PORT = Number(process.env.HTTP_PORT || 8080);
  harden(http.createServer((req, res) => {
    const host = String(req.headers.host || HOST).replace(/:\d+$/, '');
    res.writeHead(308, { Location: `https://${host}${PORT === 443 ? '' : `:${PORT}`}${req.url}` });
    res.end();
  })).listen(HTTP_PORT, HOST);
} else {
  harden(http.createServer(wrap)).listen(PORT, HOST, () => {
    console.log(`Cresta → http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}  admin: /admin  (set TLS_CERT/TLS_KEY for HTTPS)`);
  });
}
