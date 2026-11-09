/*
 * Builds everything that goes in <head> for a page. The server uses it to write real HTML,
 * and the browser uses it to update the tags when someone moves between pages.
 */
const DEFAULT_IMAGE = '/brand/og-image.jpg';

function postalAddress(raw = '') {
  const postal = raw.match(/\b\d{6}\b/)?.[0];
  return {
    '@type': 'PostalAddress',
    streetAddress: raw.replace(/,?\s*(Maharashtra)?\s*\d{6}\s*$/, '').trim(),
    addressRegion: /Maharashtra/.test(raw) ? 'Maharashtra' : undefined,
    postalCode: postal,
    addressCountry: 'IN',
  };
}

export function organizationLd(settings, base) {
  const sameAs = [settings.facebook_url, settings.instagram_url, settings.linkedin_url, settings.youtube_url].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${base}/#organization`,
    name: 'Cresta',
    url: `${base}/`,
    logo: `${base}/brand/icon-512.png`,
    image: `${base}${DEFAULT_IMAGE}`,
    description: settings.site_description,
    telephone: settings.phone_tel,
    email: settings.email,
    address: postalAddress(settings.office_address),
    parentOrganization: { '@type': 'Organization', name: 'Crystal Swimming Pools (I) Pvt. Ltd.' },
    areaServed: 'IN',
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** One LocalBusiness entry for each place Cresta publishes a full address for. */
export function localBusinessLd(settings, base) {
  const place = (name, id, address) => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${base}/contact#${id}`,
    name,
    url: `${base}/contact`,
    image: `${base}${DEFAULT_IMAGE}`,
    telephone: settings.phone_tel,
    email: settings.email,
    address: postalAddress(address),
    parentOrganization: { '@id': `${base}/#organization` },
  });
  return [
    { ...place('Cresta Pools, Pune office', 'office', settings.office_address), openingHours: 'Mo-Sa 10:00-18:00' },
    place('Cresta FRP pool factory, Shive', 'factory', settings.factory_address),
  ];
}

export function faqLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

export function buildHead(meta, { base, path, settings }) {
  const m = meta ?? {};
  const abs = (u) => (/^https?:\/\//.test(u) ? u : `${base}${u}`);
  const canonical = `${base}${path === '/' ? '/' : path.replace(/\/+$/, '')}`;
  const title = m.title || settings.site_title;
  const description = m.description || settings.site_description;
  const image = abs(m.image || DEFAULT_IMAGE);

  const jsonLd = [organizationLd(settings, base)];
  if (m.crumbs?.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [['Home', '/'], ...m.crumbs].map(([name, to], i) => ({
        '@type': 'ListItem', position: i + 1, name, item: abs(to),
      })),
    });
  }
  if (typeof m.jsonLd === 'function') jsonLd.push(...[m.jsonLd(base, abs)].flat().filter(Boolean));

  return {
    title,
    description,
    canonical,
    image,
    robots: m.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
    ogType: m.type || 'website',
    jsonLd,
  };
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** JSON that is safe inside a <script> data block. */
export const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

export function headToHtml(h, settings) {
  const tags = [
    `<title>${esc(h.title)}</title>`,
    `<meta name="description" content="${esc(h.description)}">`,
    `<meta name="robots" content="${esc(h.robots)}">`,
    `<link rel="canonical" href="${esc(h.canonical)}">`,
    `<meta property="og:type" content="${esc(h.ogType)}">`,
    '<meta property="og:site_name" content="Cresta">',
    '<meta property="og:locale" content="en_IN">',
    `<meta property="og:title" content="${esc(h.title)}">`,
    `<meta property="og:description" content="${esc(h.description)}">`,
    `<meta property="og:url" content="${esc(h.canonical)}">`,
    `<meta property="og:image" content="${esc(h.image)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(h.title)}">`,
    `<meta name="twitter:description" content="${esc(h.description)}">`,
    `<meta name="twitter:image" content="${esc(h.image)}">`,
  ];
  if (settings.gsc_token) tags.push(`<meta name="google-site-verification" content="${esc(settings.gsc_token)}">`);
  h.jsonLd.forEach((ld) => tags.push(`<script type="application/ld+json" data-seo>${safeJson(ld)}</script>`));
  if (settings.ga_id) tags.push(`<script src="/ga.js" data-ga="${esc(settings.ga_id)}" defer></script>`);
  return tags.join('\n  ');
}

/** Browser side: update the existing tags after moving to another page. */
export function applyHead(h) {
  document.title = h.title;
  const setMeta = (attr, key, value) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.append(el); }
    el.setAttribute('content', value);
  };
  setMeta('name', 'description', h.description);
  setMeta('name', 'robots', h.robots);
  setMeta('property', 'og:type', h.ogType);
  setMeta('property', 'og:title', h.title);
  setMeta('property', 'og:description', h.description);
  setMeta('property', 'og:url', h.canonical);
  setMeta('property', 'og:image', h.image);
  setMeta('name', 'twitter:title', h.title);
  setMeta('name', 'twitter:description', h.description);
  setMeta('name', 'twitter:image', h.image);
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.append(link); }
  link.href = h.canonical;
  document.head.querySelectorAll('script[data-seo]').forEach((el) => el.remove());
  h.jsonLd.forEach((ld) => {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.dataset.seo = '';
    s.textContent = JSON.stringify(ld);
    document.head.append(s);
  });
}
