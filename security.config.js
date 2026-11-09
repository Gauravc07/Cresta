/*
 * Security headers: the single source of truth, used by the Vite dev and preview servers and by server.mjs.
 * The browser only ever talks to this site. All database access happens on the server.
 */

/**
 * @param {object} opts
 * @param {boolean} [opts.https]      add HSTS + upgrade-insecure-requests (only when served over HTTPS)
 * @param {boolean} [opts.dev]        relax CSP for Vite's dev server (inline styles + HMR websocket)
 * @param {boolean} [opts.analytics]  allow Google Analytics (only once a Measurement ID is set)
 */
export function securityHeaders({ https = false, dev = false, analytics = false } = {}) {
  const ga = analytics ? ' https://www.googletagmanager.com' : '';
  const gaConnect = analytics ? ' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com' : '';

  const csp = [
    "default-src 'self'",
    `script-src 'self'${dev ? " 'unsafe-inline'" : ''}${ga}`,
    dev ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'",
    `img-src 'self' data: blob:${analytics ? ' https://www.google-analytics.com https://www.googletagmanager.com' : ''}`,
    "font-src 'self'",
    `connect-src 'self'${gaConnect}${dev ? ' ws: wss:' : ''}`,
    'frame-src https://www.google.com https://maps.google.com',
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
    ...(https ? ['upgrade-insecure-requests'] : []),
  ].join('; ');

  return {
    'Content-Security-Policy': csp,
    ...(https ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Origin-Agent-Cluster': '?1',
    'X-Permitted-Cross-Domain-Policies': 'none',
  };
}

/** Cache policy by URL path. Hashed build assets are immutable; HTML always revalidates. */
export function cacheControl(pathname) {
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  if (pathname.startsWith('/fonts/')) return 'public, max-age=31536000, immutable';
  if (/^\/(img|brand)\//.test(pathname)) return 'public, max-age=2592000, stale-while-revalidate=86400';
  if (/\.(html?)$/.test(pathname) || !/\.[a-z0-9]+$/i.test(pathname)) return 'no-cache';
  return 'public, max-age=3600';
}
