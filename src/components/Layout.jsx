import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useNavCounts, useSettings, waLink } from '../lib/data.js';
import { CloseIcon, WhatsAppIcon } from './Icons.jsx';
import Img from './Img.jsx';
import { DocLink } from './ui.jsx';

const NAV = [
  ['/frp-pools', 'Pools'],
  ['/pumps-filtration', 'Pumps & Filtration'],
  ['/products', 'Equipment'],
  ['/about', 'About'],
];

const MENU = [
  ['/', 'Home', '/img/site/hero-home.webp'],
  ['/frp-pools', 'FRP Pools', '/img/frp/hero.webp'],
  ['/pumps-filtration', 'Pumps & Filtration', '/img/site/plant-room.webp'],
  ['/products', 'Equipment', '/img/products/hero.webp'],
  ['/projects', 'Projects', '/img/site/construction.webp'],
  ['/blog', 'Blog', '/img/site/water.webp'],
  ['/about', 'About Cresta', '/img/site/about-hero.webp'],
  ['/contact', 'Contact', '/img/site/pool-sunset.webp'],
];

const CATEGORIES = [
  ['Sand filters', '/products?cat=filtration'], ['Pool pumps', '/products?cat=pumps'],
  ['Water treatment', '/products?cat=treatment'], ['Cleaning & maintenance', '/products?cat=cleaning'],
  ['Ladders & fittings', '/products?cat=accessories'], ['Tile adhesive & grout', '/products?cat=finishes'],
  ['Jacuzzi, sauna & steam', '/products?cat=wellness'], ['Datasheets', '/products#downloads'],
];

function Brand(props) {
  return (
    <Link className="brand" to="/" aria-label="Cresta — home" {...props}>
      <img className="brand-emblem" src="/brand/cresta-emblem.webp" alt="" width="247" height="240" />
      <img className="brand-word" src="/brand/cresta-wordmark.webp" alt="Cresta" width="434" height="90" />
    </Link>
  );
}

function Menu({ open, onClose, settings }) {
  const { pathname } = useLocation();
  const counts = useNavCounts();
  // Sections with nothing published yet stay out of the menu.
  const items = MENU.filter(([to]) => (to !== '/projects' || counts.projects) && (to !== '/blog' || counts.blogs));
  const current = Math.max(0, items.findIndex(([to]) => to === pathname));
  const [preview, setPreview] = useState(current);
  const closeRef = useRef(null);

  useEffect(() => { if (open) { setPreview(current); closeRef.current?.focus(); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`menu${open ? ' is-open' : ''}`} id="site-menu" role="dialog" aria-modal="true" aria-label="Site menu"
      inert={!open} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="menu-head">
        <Brand tabIndex={-1} />
        <button ref={closeRef} className="menu-close" type="button" onClick={onClose}>Close <CloseIcon /></button>
      </div>
      <div className="menu-body">
        <nav aria-label="Menu">
          <ol className="menu-list">
            {items.map(([to, label], i) => (
              <li key={to}>
                <NavLink className="menu-link" to={to} end onMouseEnter={() => setPreview(i)} onFocus={() => setPreview(i)}>
                  <span>{String(i + 1).padStart(2, '0')}</span>{label}
                </NavLink>
              </li>
            ))}
          </ol>
          <div className="menu-sub">
            {CATEGORIES.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}
          </div>
        </nav>
        <div className="menu-side">
          <div className="menu-preview" aria-hidden="true">
            {open && items.map(([to, , img], i) => (
              <Img key={to} src={img} alt="" sizes="(max-width: 1200px) 40vw, 600px" className={i === preview ? 'is-active' : ''} />
            ))}
            <span className="frame" />
          </div>
          <div className="menu-contact">
            <a href={`tel:${settings.phone_tel}`}>{settings.phone_display}</a>
            <a href={`mailto:${settings.email}`}>{settings.email}</a>
            <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>
            <span>{settings.hours_week}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ settings }) {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef(null);
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setMenu(false), [pathname, search, hash]);
  useEffect(() => { document.body.classList.toggle('no-scroll', menu); }, [menu]);

  const close = () => { setMenu(false); toggleRef.current?.focus(); };

  return (
    <>
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="header-inner">
          <Brand />
          <nav className="main-nav" aria-label="Primary">
            <ul className="nav-list">
              {NAV.map(([to, label]) => <li key={to}><NavLink className="nav-link" to={to}>{label}</NavLink></li>)}
            </ul>
          </nav>
          <div className="header-actions">
            <Link className="header-cta" to="/contact">Enquire</Link>
            <button ref={toggleRef} className="menu-toggle" type="button" aria-expanded={menu} aria-controls="site-menu" onClick={() => setMenu(true)}>
              <span className="menu-label">Menu</span><span className="menu-lines" aria-hidden="true" />
              <span className="sr-only">Open site menu</span>
            </button>
          </div>
        </div>
      </header>
      <Menu open={menu} onClose={close} settings={settings} />
    </>
  );
}

function Footer({ settings }) {
  const counts = useNavCounts();
  const social = [['Facebook', settings.facebook_url], ['Instagram', settings.instagram_url], ['LinkedIn', settings.linkedin_url], ['YouTube', settings.youtube_url]].filter(([, url]) => url);
  return (
    <>
      <footer className="site-footer">
        <div className="container footer-top">
          <div className="footer-brand">
            <img src="/brand/cresta-emblem.webp" alt="Cresta" width="247" height="240" loading="lazy" decoding="async" />
            <p>One-piece FRP swimming pools, and the pumps, filtration and water-treatment systems behind them. A Crystal Pools company, made in India.</p>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            <Link to="/">Home</Link>
            <Link to="/frp-pools">FRP Pools</Link>
            <Link to="/pumps-filtration">Pumps &amp; Filtration</Link>
            <Link to="/products">Equipment</Link>
            {counts.projects > 0 && <Link to="/projects">Projects</Link>}
            {counts.blogs > 0 && <Link to="/blog">Blog</Link>}
            <Link to="/about">About</Link>
            <Link to="/contact">Enquire</Link>
          </nav>
          <div className="footer-meta">
            <a href={`tel:${settings.phone_tel}`}>{settings.phone_display}</a>
            <a href={`mailto:${settings.email}`}>{settings.email}</a>
            <span>{settings.hours_week}</span>
          </div>
          <div className="footer-docs">
            <DocLink href={settings.brochure_url}>FRP brochure</DocLink>
            <Link to="/products#downloads">Datasheets</Link>
            <Link to="/contact?type=dealer">Become a dealer</Link>
            {social.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer">{label}</a>)}
          </div>
        </div>
        <div className="footer-bottom-wrap">
          <div className="container footer-bottom">
            <p>© {new Date().getFullYear()} Cresta. A Crystal Pools company. All rights reserved.</p>
            <a href="#main">Back to top ↑</a>
          </div>
        </div>
      </footer>
      <a className="wa-float" href={waLink(settings.whatsapp, "Hello Cresta, I'd like to know more about your pools and equipment.")} target="_blank" rel="noopener noreferrer" aria-label="Chat with Cresta on WhatsApp">
        <WhatsAppIcon /><span>Chat with us</span>
      </a>
    </>
  );
}

/** Scroll to top (or to #hash) on navigation, and fade sections in as they scroll into view. */
function usePageEffects() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined; }
    let tries = 0;
    let t;
    const go = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) el.scrollIntoView();
      else if (tries++ < 20) t = setTimeout(go, 50);
    };
    go();
    return () => clearTimeout(t);
  }, [pathname, hash]);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]:not(.is-in), .panel:not(.is-in)'));
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
}

export default function Layout() {
  const settings = useSettings();
  usePageEffects();
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header settings={settings} />
      <main id="main"><Outlet /></main>
      <Footer settings={settings} />
    </>
  );
}
