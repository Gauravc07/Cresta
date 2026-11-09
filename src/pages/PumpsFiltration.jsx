import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { CtaBand, DocLink, Ext, PageHero, SectionHead, tabKeys, usePageMeta } from '../components/ui.jsx';
import { useCatalog, useSettings, waLink } from '../lib/data.js';
import Img from '../components/Img.jsx';

const SERIES = [
  { id: 'mxb-series', tag: 'Residential', name: 'MXB Series', text: 'Reliable performance for residential pools — the everyday workhorse for villas and homes.',
    specs: [['Best for', 'Villa & home pools'], ['Duty', 'Daily residential circulation'], ['Pairs with', 'M / MS Series filters']] },
  { id: 'mrb-series', tag: 'Commercial', name: 'MRB Series', text: 'Heavy-duty flanged pumps for pools that run long hours under heavy bather loads.',
    specs: [['Best for', 'Hotels, clubs, public pools'], ['Connection', 'Flanged'], ['Pairs with', 'F / B Series filters']] },
  { id: 'mtx-series', tag: 'Compact', name: 'MTX Series', text: 'Compact, high-efficiency circulation where plant-room space is tight.',
    specs: [['Best for', 'Plunge pools, spas, small pools'], ['Format', 'Compact footprint'], ['Pairs with', 'MS / M Series filters']] },
];

const FINDER = [
  { tab: 'Residential pool',
    pump: ['mxb-series', 'MXB Series', 'Reliable residential circulation'],
    filter: ['m-series', 'M or MS Series', 'Top-mount or side-mount valve'],
    note: 'Pick the top-mount M Series or side-mount MS Series to suit your plant-room layout and pipe routing.' },
  { tab: 'Commercial pool',
    pump: ['mrb-series', 'MRB Series', 'Heavy-duty flanged pumps'],
    filter: ['f-series', 'F or B Series', 'Vertical or horizontal commercial'],
    note: 'Horizontal B Series filters suit plant rooms with limited headroom; vertical F Series filters handle high-capacity duty. Add automated dosing for heavy bather loads.' },
  { tab: 'Plunge pool or spa',
    pump: ['mtx-series', 'MTX Series', 'Compact, high-efficiency'],
    filter: ['ms-series', 'MS Series', 'Side-mount residential'],
    note: <>Cresta FRP plunge pools ship with a matched pump and filter already included — <Link to="/frp-pools#included" >see the package</Link>.</> },
];

const FILTER_TABLE = [
  ['F Series', 'Vertical, heavy-duty', 'Commercial', 'High-capacity pools with continuous duty'],
  ['B Series', 'Horizontal', 'Commercial', 'Large pools and plant rooms with limited headroom'],
  ['M Series', 'Top-mount valve', 'Residential', 'Premium home and villa pools'],
  ['MS Series', 'Side-mount valve', 'Residential', 'Home pools and compact equipment pads'],
];

const TREATMENT = [
  ['salt-chlorinator', 'Salt Chlorinator', 'Automated, silky-smooth sanitation.', 'salt-chlorinator'],
  ['dosingstar', 'Dosingstar Dosing Pump', 'Precise automated chemical injection.', 'dosingstar'],
  ['tablet-feeder', 'Tablet Feeders', 'Consistent, regulated chlorine dispersion.', 'tablet-feeder'],
  ['hydrosmart', 'Hydrosmart System', 'Centralised water-quality management.', 'hydrosmart'],
];

function Pick({ kind, item: [id, name, sub] }) {
  return (
    <Link className="finder-pick" to={`/products#${id}`}>
      <span className="thumb"><Img src={`/img/products/${id}.svg`} alt="" /></span>
      <span><small>{kind}</small><strong>{name}</strong><span>{sub}</span></span>
    </Link>
  );
}

export default function PumpsFiltration() {
  usePageMeta('Swimming Pool Pumps & Sand Filter Systems in India | Cresta',
    'Cresta pool pumps and sand filters: MXB residential, MRB flanged commercial and MTX compact pumps, plus F, B, M and MS Series sand filters for every pool.',
    { crumbs: [['Pumps & Filtration', '/pumps-filtration']] });
  const settings = useSettings();
  const { data } = useCatalog();
  const [tab, setTab] = useState(0);
  const byId = Object.fromEntries(data.products.map((p) => [p.id, p]));
  const filters = data.products.filter((p) => p.category_id === 'filtration');

  return (
    <>
      <PageHero image="/img/products/hero.webp" alt="A row of filtration vessels connected by blue pipework" crumb="Pumps & Filtration"
        eyebrow="Circulation systems" title="Pumps & filtration, built for constant flow."
        sub="Residential, commercial and compact pumps, each paired with a matched high-pressure sand filter. Correctly sized, so your water stays clear and your plant runs efficiently.">
        <a className="btn btn-primary" href="#finder">Find your system</a>
        <a className="btn btn-ghost" href="#filters">Compare filters</a>
      </PageHero>

      <section className="section">
        <div className="container split">
          <div className="stack" data-reveal>
            <p className="eyebrow">Why it matters</p>
            <h2 className="h2">Clear water starts at the pump pad.</h2>
            <p className="lead">Chemicals can only sanitise water that moves. The pump keeps the whole pool circulating; the filter removes what the chemicals can't. Get both right and everything downstream is easier.</p>
          </div>
          <ul className="check-list" data-reveal data-reveal-delay="1">
            <li><strong>Full turnover</strong> — the pump moves the whole pool volume through the filter on a regular cycle.</li>
            <li><strong>Fine filtration</strong> — high-density sand media traps suspended particles and keeps water bright.</li>
            <li><strong>Even dosing</strong> — steady flow spreads sanitiser evenly, with no stagnant corners.</li>
            <li><strong>Lower running costs</strong> — a pump sized to its filter isn't fighting the system.</li>
          </ul>
        </div>
      </section>

      <section className="section section--dark" id="pumps">
        <div className="container">
          <SectionHead eyebrow="Pool pumps" title="Three series. Every duty."
            lead="From a home plunge pool to a hotel lap pool, choose the family built for your workload." />
          <div className="grid grid-3">
            {SERIES.map((s, i) => {
              const pdf = byId[s.id]?.datasheet_url;
              return (
                <article className="series-card" data-reveal data-reveal-delay={i || undefined} key={s.id}>
                  <div className="series-media"><Img src={byId[s.id]?.image_path ?? `/img/products/${s.id}.svg`} alt={`${s.name} pool pump`} /></div>
                  <div className="series-body">
                    <span className="series-tag">{s.tag}</span>
                    <h3>{s.name}</h3>
                    <p>{s.text}</p>
                    <dl className="spec-list">{s.specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
                    <div className="product-actions">
                      <Ext className="btn btn-light btn-mini" href={waLink(settings.whatsapp, `Hello Cresta, I'm interested in the ${s.name} pumps. Please share details and pricing.`)}>Enquire</Ext>
                      {pdf && <DocLink className="btn btn-ghost btn-mini" href={pdf}>Datasheet</DocLink>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section--darker" id="finder">
        <div className="container">
          <SectionHead eyebrow="System finder" title="Which pump and filter do I need?"
            lead="Start with your pool type. Our engineers confirm the final sizing from your pool volume, turnover target and pipe runs." />
          <div className="tablist" role="tablist" aria-label="Pool type">
            {FINDER.map((f, i) => (
              <button key={f.tab} className="tab" role="tab" id={`ft-${i}`} aria-controls={`fp-${i}`} aria-selected={tab === i}
                tabIndex={tab === i ? 0 : -1} onClick={() => setTab(i)} onKeyDown={tabKeys(i, FINDER.length, setTab)}>{f.tab}</button>
            ))}
          </div>
          {FINDER.map((f, i) => (
            <div className="finder-panel" role="tabpanel" id={`fp-${i}`} aria-labelledby={`ft-${i}`} hidden={tab !== i} key={f.tab}>
              <Pick kind="Pump" item={f.pump} />
              <Pick kind="Filter" item={f.filter} />
              <div className="finder-note"><strong>Good to know</strong>{f.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="filters">
        <div className="container">
          <SectionHead split eyebrow="Sand filtration" title={`${filters.length === 4 ? 'Four' : filters.length} filter series`}
            lead="High-pressure sand filters for residential and commercial pools, with high-density media for fine particle capture."
            action={<Link className="btn btn-outline" to="/products?cat=filtration">View in catalogue</Link>} />
          <div className="product-grid">
            {filters.map((p, i) => <ProductCard key={p.id} product={p} revealDelay={i} />)}
          </div>
          <div className="table-wrap u-mt-40" data-reveal>
            <table className="compare">
              <thead><tr><th scope="col">Series</th><th scope="col">Configuration</th><th scope="col">Segment</th><th scope="col">Best for</th></tr></thead>
              <tbody>{FILTER_TABLE.map(([a, b, c, d]) => <tr key={a}><th scope="row">{a}</th><td>{b}</td><td>{c}</td><td>{d}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <SectionHead split eyebrow="Complete the loop" title="Add treatment & dosing"
            lead="Circulation and filtration do the heavy lifting; treatment keeps the water safe. Automate it for consistent results."
            action={<Link className="btn btn-outline" to="/products?cat=treatment">All treatment products</Link>} />
          <div className="cat-grid u-grid-auto">
            {TREATMENT.map(([id, name, text, img]) => (
              <Link className="cat-tile" to={`/products#${id}`} key={id}>
                <div className="cat-media"><Img src={`/img/products/${img}.svg`} alt="" /></div>
                <h3>{name}</h3><p>{text}</p><span className="link-arrow">View</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand eyebrow="Sizing support" title="Not sure what size you need?"
        text="Send us your pool dimensions and how it's used. We'll recommend a pump, filter and treatment set-up and send a quote.">
        <Link className="btn btn-primary" to="/contact?type=equipment">Get a sizing recommendation</Link>
        <Ext className="btn btn-wa" href={waLink(settings.whatsapp, 'Hello Cresta, I need help sizing a pump and filter.')}>WhatsApp Us</Ext>
      </CtaBand>
    </>
  );
}
