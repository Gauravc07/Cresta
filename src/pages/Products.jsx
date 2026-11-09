import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { SearchIcon } from '../components/Icons.jsx';
import { CtaBand, DownloadItem, PageHero, SectionHead, usePageMeta } from '../components/ui.jsx';
import { useCatalog, useDownloads } from '../lib/data.js';
import Img from '../components/Img.jsx';

const SHORT = { accessories: 'Ladders & Fittings', finishes: 'Adhesive & Grout', cleaning: 'Cleaning' };

const SERVICES = [
  ['turnkey-projects', 'turnkey', 'Swimming pools', 'Turnkey projects'],
  ['waterfall-fountain', 'water-features', 'Waterfall & fountain', 'Water features'],
  ['pool-tiles', 'pool-tiles', 'Pool tiles', 'Glass mosaic'],
  ['renovation', 'renovation', 'Renovation', 'Repairs & upgrades'],
];

export default function Products() {
  usePageMeta('Swimming Pool Equipment, Filters & Chlorinators | Cresta',
    'Browse Cresta pool equipment: sand filters, pool pumps, salt chlorinators, dosing pumps, cleaning tools, ladders and tile adhesives for homes, hotels and clubs.',
    { crumbs: [['Products', '/products']], image: '/img/site/commercial.webp' });
  const { data } = useCatalog();
  const { data: downloads } = useDownloads();
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(null);
  const toolbarRef = useRef(null);

  const ids = data.categories.map((c) => c.id);
  const cat = ids.includes(params.get('cat')) ? params.get('cat') : 'all';

  // Deep links: /products#mxb-series highlights that card (and clears filters).
  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1));
    if (!id || !data.products.some((p) => p.id === id)) return undefined;
    setQuery('');
    if (params.get('cat')) setParams({}, { replace: true });
    setHighlight(id);
    const t1 = setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80);
    const t2 = setTimeout(() => setHighlight(null), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [hash, data.products]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = query.trim().toLowerCase();
  const sections = useMemo(() => data.categories.map((c) => ({
    ...c,
    items: data.products.filter((p) => p.category_id === c.id
      && (cat === 'all' || cat === c.id)
      && (!q || `${p.name} ${p.label ?? ''} ${p.description ?? ''} ${c.name}`.toLowerCase().includes(q))),
  })).filter((s) => s.items.length), [data, cat, q]);
  const total = sections.reduce((n, s) => n + s.items.length, 0);

  const choose = (id) => {
    setParams(id === 'all' ? {} : { cat: id }, { replace: true });
    const top = toolbarRef.current.getBoundingClientRect().top + window.scrollY - (document.querySelector('.site-header')?.offsetHeight ?? 0);
    if (window.scrollY > top + 4) window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <>
      <PageHero compact image="/img/site/commercial.webp"
        alt="A competition pool with lane ropes and starting blocks" crumb="Products"
        eyebrow="Equipment catalogue" title="Swimming pool equipment."
        sub="High-performance pool infrastructure for hotels, resorts, sports clubs and homes — sourced from world-class vendors and backed by our engineers." />

      <div className="catalog-toolbar" ref={toolbarRef}>
        <div className="container toolbar-inner">
          <div className="chip-row" role="group" aria-label="Filter by category">
            {[{ id: 'all', name: 'All' }, ...data.categories].map((c) => (
              <button key={c.id} className="chip" type="button" aria-pressed={cat === c.id} onClick={() => choose(c.id)}>
                {SHORT[c.id] ?? c.name}
                <span className="count">{c.id === 'all' ? data.products.length : data.products.filter((p) => p.category_id === c.id).length}</span>
              </button>
            ))}
          </div>
          <label className="search-field">
            <span className="sr-only">Search products</span>
            <SearchIcon />
            <input type="search" placeholder="Search products…" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
      </div>

      <section className="section section--tight">
        <div className="container">
          <p className="catalog-meta" aria-live="polite">{total} product{total === 1 ? '' : 's'}</p>
          {sections.map((s) => (
            <section className="cat-section" id={s.id} key={s.id} aria-labelledby={`h-${s.id}`}>
              <header className="cat-head"><h2 id={`h-${s.id}`}>{s.name}</h2><p>{s.blurb}</p></header>
              <div className="product-grid">
                {s.items.map((p) => <ProductCard key={p.id} product={p} highlight={highlight === p.id} />)}
              </div>
            </section>
          ))}
          {!total && (
            <div className="catalog-empty">
              <p><strong>No products match your search.</strong></p>
              <p className="u-mt-8">Try another term, or <Link to="/contact">ask our team</Link> — we supply more than we list here.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section section--mist" id="downloads">
        <div className="container">
          <SectionHead eyebrow="Downloads" title="Datasheets & brochures"
            lead="Technical specifications for consultants, contractors and pool owners. Choose a document and our team will send it to you." />
          <div className="dl-grid">
            {[downloads.slice(0, Math.ceil(downloads.length / 2)), downloads.slice(Math.ceil(downloads.length / 2))].map((col, i) => (
              <div className="dl-list" key={i}>
                {col.map((d) => <DownloadItem key={d.id} href={d.url} title={d.title} subtitle={d.subtitle} />)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead split eyebrow="Beyond equipment" title="Need the full build?"
            lead="Our parent company, Crystal Pools, designs and builds complete pools, water features and finishes across India."
            action={<Link className="btn btn-outline" to="/contact?type=commercial">Discuss a full build</Link>} />
          <div className="grid grid-4">
            {SERVICES.map(([slug, img, kicker, title]) => (
              <Link className="pro-card pro-card--image u-minh-320" to={`/contact?type=other&product=${encodeURIComponent(title)}`} key={slug}>
                <Img src={`/img/site/${img}.webp`} alt="" />
                <p className="eyebrow">{kicker}</p><h3 className="u-fs-16">{title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand eyebrow="Trade & project pricing" title="Equip your facility with confidence."
        text="Send us your equipment list or pool details for a consolidated quote — dealers and contractors welcome.">
        <Link className="btn btn-primary" to="/contact?type=equipment">Request the full catalogue</Link>
        <Link className="btn btn-ghost" to="/contact?type=dealer">Become a dealer</Link>
      </CtaBand>
    </>
  );
}
