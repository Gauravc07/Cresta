import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../lib/data.js';
import { applyHead, buildHead } from '../lib/seo.js';
import { DownloadIcon, ArrowIcon } from './Icons.jsx';
import Img from './Img.jsx';

/** Filled in during server rendering: the page's head details and HTTP status. */
export const SeoContext = createContext(null);

/**
 * Declares a page's title, description and structured data.
 * opts: crumbs [[name, path]], image, type, noindex, jsonLd (base, abs) => object or array
 * On the server this goes into the HTML; in the browser it updates the tags on navigation.
 */
export function usePageMeta(title, description, opts = {}) {
  const seo = useContext(SeoContext);
  const settings = useSettings();
  const { pathname } = useLocation();
  const meta = { title, description, ...opts };
  if (seo) seo.meta = meta;
  useEffect(() => {
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    const base = canonical ? new URL(canonical).origin : window.location.origin;
    applyHead(buildHead(meta, { base, path: pathname, settings }));
  }, [title, description, pathname, opts.noindex]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function PageHero({ image, alt, crumb, eyebrow, title, sub, compact, children, seal = true }) {
  return (
    <section className={`page-hero${compact ? ' page-hero--compact' : ''}`}>
      <div className="hero-media">
        <Img src={image} alt={alt} priority sizes="100vw" />
      </div>
      <span className="frame" aria-hidden="true" />
      <div className="container">
        <div className="hero-content">
          <ol className="crumbs" aria-label="Breadcrumb">
            <li><Link to="/">Home</Link></li>
            <li aria-current="page">{crumb}</li>
          </ol>
          <h1 className="display-1">{title}</h1>
          {sub && <p className="hero-sub">{sub}</p>}
          {children && <div className="hero-actions">{children}</div>}
        </div>
      </div>
      {seal && <Seal text={`${crumb} · Cresta · Made in India · `} />}
    </section>
  );
}

/** Slowly rotating circular label with the Cresta emblem in the middle. */
export function Seal({ text = 'Cresta · Pools · Pumps · Water systems · ', serif, className = '' }) {
  const id = useId();
  return (
    <div className={`seal${serif ? ' seal--serif' : ''} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <defs><path id={id} d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" /></defs>
        <text><textPath href={`#${id}`} textLength="498">{text}</textPath></text>
      </svg>
      <img src="/brand/cresta-emblem.webp" alt="" width="247" height="240" loading="lazy" decoding="async" />
    </div>
  );
}

export function SectionHead({ eyebrow, title, lead, center, split, action, titleClass = 'h2' }) {
  const body = (
    <>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className={titleClass}>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
    </>
  );
  if (split) {
    return (
      <div className="section-head section-head--split">
        <div>{body}</div>
        {action}
      </div>
    );
  }
  return <div className={`section-head${center ? ' section-head--center' : ''}`}>{body}</div>;
}

export function CtaBand({ eyebrow, title, text, children }) {
  return (
    <section className="cta-band">
      <span className="frame" aria-hidden="true" />
      <img className="watermark" src="/brand/cresta-emblem.webp" alt="" loading="lazy" decoding="async" />
      <div className="container">
        <div className="cta-inner" data-reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="h2">{title}</h2>
          <p>{text}</p>
          <div className="btn-row">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Number that counts up when it scrolls into view. */
export function CountUp({ to }) {
  const ref = useRef(null);
  const [value, setValue] = useState(to);
  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || !to || reduce || !('IntersectionObserver' in window)) return undefined;
    setValue(0);
    let raf;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / 1400);
        setValue(Math.round(to * (1 - (1 - t) ** 3)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{value.toLocaleString('en-IN')}</span>;
}

export function DownloadItem({ href, title, subtitle, badge = 'PDF', internal = href?.startsWith('/') }) {
  const content = (
    <>
      <span className="dl-icon">{badge}</span>
      <span><strong>{title}</strong><span>{subtitle}</span></span>
      {internal ? <ArrowIcon className="dl-arrow" /> : <DownloadIcon className="dl-arrow" />}
    </>
  );
  return internal
    ? <Link className="dl-item" to={href}>{content}</Link>
    : <a className="dl-item" href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
}

/** Link to a document: internal paths (e.g. the request form) stay in the site, anything else opens in a new tab. */
export function DocLink({ href, className, children, ...rest }) {
  if (href?.startsWith('/')) return <Link to={href} className={className} {...rest}>{children}</Link>;
  return <Ext href={href} className={className} {...rest}>{children}</Ext>;
}

/** External link that opens in a new tab. */
export function Ext({ href, className, children, ...rest }) {
  return <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
}

/** Keyboard support for role="tab" lists (arrows, Home, End). */
export function tabKeys(index, count, select) {
  return (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let next = null;
    if (step) next = (index + step + count) % count;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    if (next === null) return;
    e.preventDefault();
    select(next);
    e.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus();
  };
}
