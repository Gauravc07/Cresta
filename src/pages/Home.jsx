import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PoolDiagram from '../components/PoolDiagram.jsx';
import { CountUp, DocLink, Ext, Seal, usePageMeta } from '../components/ui.jsx';
import { useBanners, useDownloads, useSettings, useTestimonials, waLink } from '../lib/data.js';
import Img from '../components/Img.jsx';

const SECTIONS = [
  ['top', 'Introduction'], ['shape', 'FRP pools'], ['flow', 'Pumps & filtration'], ['purity', 'Water treatment'],
  ['range', 'Product range'], ['how', 'How your pool works'], ['words', 'Our promises'], ['documents', 'Downloads'], ['contact', 'Contact'],
];

const RANGE = [
  ['/products?cat=filtration', '/img/products/hero.webp', 'Filtration', 'High-pressure sand filters, residential to commercial.'],
  ['/products?cat=pumps', '/img/site/plant-room.webp', 'Pumps', 'MXB, MRB and MTX circulation series.'],
  ['/products?cat=treatment', '/img/site/water-features.webp', 'Treatment', 'Salt chlorination, dosing and control.'],
  ['/products?cat=finishes', '/img/site/pool-tiles.webp', 'Finishes', 'Tile adhesive, grout and waterproofing.'],
  ['/products?cat=wellness', '/img/wellness/steam.webp', 'Wellness', 'Jacuzzis, saunas and steam rooms.'],
];

const WORDS = [
  ['One shell. No seams. Nowhere for water to go.', 'The Cresta FRP pool'],
  ['Weeks, not months — the pool arrives finished.', 'Factory-moulded at Shive, Pune'],
  ['Every pump is matched to its filter, before it leaves us.', 'Cresta circulation systems'],
  ['Clear water is engineered, not added from a bucket.', 'Cresta water treatment'],
];

const SECTORS = [
  ['Private villas', 'A personal pool, ready in weeks and sized to your garden or terrace.'],
  ['Resorts & hotels', 'Guest pools and high-capacity plant rooms that run all day, every day.'],
  ['Clubs & societies', 'Durable, low-maintenance pools for residential societies and sports clubs.'],
  ['Wellness centres', 'Plunge pools, jacuzzis, saunas and steam rooms, designed together.'],
  ['Architects & consultants', 'Datasheets, drawings and sizing support for your specifications.'],
  ['Dealers & builders', 'Stock Cresta pools and equipment with engineering backup on every job.'],
];

function Dots() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="dots" aria-label="Page sections">
      {SECTIONS.map(([id, label]) => (
        <a key={id} href={`#${id}`} aria-label={label} title={label} aria-current={active === id ? 'true' : undefined} />
      ))}
    </nav>
  );
}

/** Homepage hero. Shows the active banners from the admin, and rotates when there is more than one. */
function HomeHero() {
  const banners = useBanners();
  const [i, setI] = useState(0);
  const many = banners.length > 1;
  useEffect(() => {
    if (!many || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % banners.length), 7000);
    return () => clearInterval(t);
  }, [many, banners.length]);
  const b = banners[Math.min(i, banners.length - 1)];
  const external = /^https:/.test(b.cta_url ?? '');

  return (
    <section className="hero" id="top">
      <div className={`hero-media${many ? ' hero-media--slides' : ''}`}>
        {banners.map((s, n) => (
          <Img key={s.id} src={s.image_path} alt={n === i ? (s.image_alt ?? '') : ''} priority={n === 0} sizes="100vw" className={n === i ? 'is-active' : undefined} />
        ))}
      </div>
      <span className="frame" aria-hidden="true" />
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">
            {b.eyebrow && <span className="eyebrow">{b.eyebrow}</span>}
            <span className="display-xl">{b.title}</span>
          </h1>
          {b.subtitle && <p className="hero-sub">{b.subtitle}</p>}
          <div className="hero-actions">
            {b.cta_label && b.cta_url && (external
              ? <Ext className="btn btn-primary" href={b.cta_url}>{b.cta_label}</Ext>
              : <Link className="btn btn-primary" to={b.cta_url}>{b.cta_label}</Link>)}
            <a className="link-arrow" href="#shape">Discover</a>
          </div>
          {many && (
            <div className="hero-dots" role="group" aria-label="Choose a banner">
              {banners.map((s, n) => <button key={s.id} type="button" aria-label={`Show banner ${n + 1}`} aria-pressed={n === i} onClick={() => setI(n)} />)}
            </div>
          )}
        </div>
      </div>
      <Seal text="Crystal Pools group · Since 1993 · Made in India · " />
      <span className="scroll-cue" aria-hidden="true" />
    </section>
  );
}

function Testimonials() {
  const items = useTestimonials();
  if (!items.length) return null;
  return (
    <section className="section section--paper" aria-labelledby="reviews-title">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Client reviews</p>
          <h2 className="h2" id="reviews-title">What our clients say.</h2>
        </div>
        <div className="reviews">
          {items.map((t) => (
            <figure className="review" key={t.id}>
              <p className="review-stars" role="img" aria-label={`Rated ${t.rating} out of 5`}>{'★'.repeat(t.rating)}<span aria-hidden="true">{'★'.repeat(5 - t.rating)}</span></p>
              <blockquote>{t.review}</blockquote>
              <figcaption>
                {t.photo_path && <Img src={t.photo_path} alt="" sizes="48px" />}
                {t.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Words() {
  const [i, setI] = useState(0);
  const go = (d) => setI((n) => (n + d + WORDS.length) % WORDS.length);
  const [quote, by] = WORDS[i];
  return (
    <div className="words">
      <p className="eyebrow u-center">Our promises</p>
      <blockquote className="words-quote" aria-live="polite"><span key={i}>“{quote}”</span></blockquote>
      <p className="words-by">{by}</p>
      <div className="words-nav">
        <button type="button" onClick={() => go(-1)}>Prev<span className="arrow is-back" aria-hidden="true" /></button>
        <span className="words-count">{String(i + 1).padStart(2, '0')} / {String(WORDS.length).padStart(2, '0')}</span>
        <button type="button" onClick={() => go(1)}>Next<span className="arrow" aria-hidden="true" /></button>
      </div>
    </div>
  );
}

export default function Home() {
  const settings = useSettings();
  usePageMeta(settings.site_title, settings.site_description, {
    jsonLd: (base) => ({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Cresta',
      url: `${base}/`,
      publisher: { '@id': `${base}/#organization` },
    }),
  });
  const { data: downloads } = useDownloads();
  const branches = settings.branches.split(',').map((s) => s.trim()).filter(Boolean);
  const featured = downloads.filter((d) => d.featured);

  return (
    <>
      <Dots />

      {/* 01 — Hero */}
      <HomeHero />

      {/* 02 — Intro */}
      <section className="section">
        <div className="container">
          <h2 className="statement u-maxw-980" data-reveal>Pools, pumps and the water between them — made by one team, held to one standard.</h2>
          <div className="intro u-mt-section" data-reveal>
            <div>
              <p>Cresta is the manufacturing and equipment brand of Crystal Pools, a Pune company that has designed and built more than two thousand swimming pools across India since 1993.</p>
              <p>That experience is moulded into every Cresta FRP pool: a single fibreglass shell, laminated by hand in six layers at our factory in Shive and delivered to site finished.</p>
            </div>
            <div>
              <p>Around the shell sits everything a pool needs to run: pumps sized for the job, high-pressure sand filters, salt chlorinators and dosing systems, cleaning tools, ladders and finishes.</p>
              <p>One source, one standard, and engineers who stay with you after handover — whether you are building a villa pool or equipping a hotel plant room.</p>
            </div>
            <span className="vlabel" aria-hidden="true">Our craft</span>
          </div>
          <div className="hero-stats" data-reveal>
            <div className="hero-stat"><strong><CountUp to={2000} />+</strong><span>Pools built by the group</span></div>
            <div className="hero-stat"><strong><CountUp to={30} />+</strong><span>Years of pool engineering</span></div>
            <div className="hero-stat"><strong><CountUp to={6} /></strong><span>Laminate layers, one shell</span></div>
            <div className="hero-stat"><strong><CountUp to={branches.length} /></strong><span>Regions served</span></div>
          </div>
        </div>
      </section>

      {/* 03 — Shape (FRP pools) */}
      <section className="panel" id="shape">
        <Img src="/img/frp/hero.webp" alt="A bright blue villa pool with sun loungers on a timber deck" sizes="100vw" />
        <span className="frame" aria-hidden="true" />
        <div className="container">
          <div className="panel-body">
            <p className="panel-index">01 — FRP pools</p>
            <h2 className="panel-title">Shape</h2>
            <p>Factory-moulded, one-piece fibreglass pools. No seams, no joints, no months of site work — just a finished shell, craned into place and ready to fill.</p>
            <Link className="arrow-link" to="/frp-pools" aria-label="Explore FRP pools"><span className="arrow" /></Link>
          </div>
        </div>
      </section>

      {/* 04 — Flow (pumps & filtration) */}
      <section className="panel panel--right" id="flow">
        <Img src="/img/site/indoor-lanes.webp" alt="An indoor lap pool with lane ropes beneath a steel-framed roof" sizes="100vw" />
        <span className="frame" aria-hidden="true" />
        <div className="container">
          <div className="panel-body">
            <p className="panel-index">02 — Pumps &amp; filtration</p>
            <h2 className="panel-title">Flow</h2>
            <p>Residential, commercial and compact pumps, each paired with a matched high-pressure sand filter — so the whole pool turns over, every cycle.</p>
            <Link className="arrow-link" to="/pumps-filtration" aria-label="Explore pumps and filtration"><span className="arrow" /></Link>
          </div>
        </div>
      </section>

      {/* 05 — Purity (water treatment) */}
      <section className="section--stone" id="purity">
        <div className="container feature">
          <span className="frame frame--dark" aria-hidden="true" />
          <div className="feature-body" data-reveal>
            <p className="eyebrow">03 — Water treatment</p>
            <h2 className="display-1">Purity</h2>
            <p>Salt chlorinators, dosing pumps, tablet feeders and smart controllers that keep water balanced automatically — consistent, safe and gentle on skin.</p>
            <Link className="arrow-link" to="/products?cat=treatment" aria-label="See water treatment"><span className="arrow" /></Link>
          </div>
          <div className="feature-media" data-reveal data-reveal-delay="1">
            <Img src="/img/site/water.webp" alt="Sunlight rippling across clear blue pool water" />
            <Seal text="Clear · Balanced · Safe · Automatic · " serif />
          </div>
        </div>
      </section>

      {/* 06 — Colour blocks */}
      <section aria-label="Why Cresta">
        <div className="blocks">
          <div className="block-media"><Img src="/img/frp/advantage-01.webp" alt="A freeform pool set into a lawn beside a modern home" sizes="(max-width: 860px) 100vw, 50vw" /></div>
          <div className="block block--azure">
            <Seal text="One piece · Six layers · Zero seams · " serif />
            <p className="statement">A pool that is made, not built.</p>
            <p>Each shell is laminated in our factory from gel coat, vinyl ester and structural resins, cured as a single structure, and inspected before it ever leaves the floor.</p>
            <Link className="link-arrow" to="/frp-pools#construction">The six layers</Link>
          </div>
        </div>
        <div className="blocks">
          <div className="block block--sand">
            <p className="statement">Two thousand pools of experience, in every product.</p>
            <p>Cresta carries the lessons of the Crystal Pools group’s projects — from private villas to hotels and competition venues — into the equipment we make and supply.</p>
            <Link className="link-arrow" to="/about">Our story</Link>
          </div>
          <div className="block-media"><Img src="/img/site/indoor.webp" alt="An indoor pool under a glass roof, framed by mosaic columns" sizes="(max-width: 860px) 100vw, 50vw" /></div>
        </div>
      </section>

      {/* 07 — Range (portrait cards) */}
      <section className="section section--dark" id="range">
        <div className="container">
          <div className="section-head section-head--split">
            <div>
              <p className="eyebrow">The range</p>
              <h2 className="h2">Everything behind a perfect pool.</h2>
            </div>
            <Link className="link-arrow" to="/products">Full catalogue</Link>
          </div>
          <div className="portraits">
            {RANGE.map(([to, img, title, text], i) => (
              <Link className="portrait" to={to} key={title} data-reveal data-reveal-delay={i % 3 || undefined}>
                <Img src={img} alt="" sizes="(max-width: 520px) 100vw, (max-width: 960px) 50vw, 33vw" />
                <span className="frame" aria-hidden="true" />
                <div className="portrait-body"><h3>{title}</h3><p>{text}</p><span className="arrow" aria-hidden="true" /></div>
              </Link>
            ))}
            <Link className="portrait portrait--brand" to="/contact" data-reveal data-reveal-delay="2">
              <img className="brand-mark" src="/brand/cresta-emblem.webp" alt="" width="247" height="240" loading="lazy" decoding="async" />
              <span className="frame" aria-hidden="true" />
              <div className="portrait-body"><h3>Enquire</h3><p>Tell us about your pool — we reply within working hours.</p><span className="arrow" aria-hidden="true" /></div>
            </Link>
          </div>
        </div>
      </section>

      {/* 08 — How it works */}
      <section className="section section--paper" id="how">
        <div className="container">
          <div className="section-head section-head--split">
            <div>
              <p className="eyebrow">Understand your equipment</p>
              <h2 className="h2">How your pool works.</h2>
              <p className="lead">Every Cresta system follows the same loop: draw water out, filter it, sanitise it and send it back. Tap a number to see each part.</p>
            </div>
            <Link className="link-arrow" to="/pumps-filtration">Size a system</Link>
          </div>
          <PoolDiagram />
        </div>
      </section>

      {/* 09 — Promises */}
      <section className="section" id="words">
        <div className="container"><Words /></div>
      </section>

      <Testimonials />

      {/* 10 — Sectors */}
      <section className="section section--paper" aria-labelledby="sectors-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Who we work with</p>
            <h2 className="h2" id="sectors-title">Built for every setting.</h2>
          </div>
          <div className="sectors" data-reveal>
            {SECTORS.map(([t, d], i) => (
              <div className="sector" key={t}><span className="num">{String(i + 1).padStart(2, '0')}</span><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* 11 — Documents */}
      <section className="section" id="documents">
        <div className="container">
          <h2 className="doc-title">Datasheets &amp;<br />brochures</h2>
          <div className="doc-list">
            {featured.map((d) => (
              <DocLink className="doc-row" key={d.id} href={d.url}>
                <span><strong>{d.title}</strong><span>{d.subtitle}</span></span>
                <em>{d.url?.startsWith('/') ? 'Request →' : 'PDF ↓'}</em>
              </DocLink>
            ))}
          </div>
          <Link className="doc-more" to="/products#downloads">See all <span className="arrow" aria-hidden="true" /></Link>
        </div>
      </section>

      {/* 12 — Contact */}
      <section className="section section--dark" id="contact">
        <div className="container contact-band">
          <div>
            <p className="eyebrow">Start your project</p>
            <h2 className="display-1 u-mt-20">Contact us.</h2>
            <div className="contact-ctas">
              <Link className="btn btn-primary" to="/contact">Request a quote</Link>
              <Ext className="btn btn-ghost" href={waLink(settings.whatsapp, "Hello Cresta, I'm planning a pool.")}>WhatsApp an engineer</Ext>
            </div>
          </div>
          <div className="contact-lines">
            <div><small>Call</small><a href={`tel:${settings.phone_tel}`}>{settings.phone_display}</a></div>
            <div><small>Email</small><a href={`mailto:${settings.email}`}>{settings.email}</a></div>
            <div><small>Office</small><address>{settings.office_address}</address></div>
            <div><small>Regions</small><address>{branches.join(' · ')}</address></div>
          </div>
        </div>
      </section>
    </>
  );
}
