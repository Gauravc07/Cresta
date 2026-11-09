import { useState } from 'react';
import { Link } from 'react-router-dom';
import ModelRange from '../components/ModelRange.jsx';
import { CountUp, CtaBand, DocLink, Ext, PageHero, SectionHead, tabKeys, usePageMeta } from '../components/ui.jsx';
import { useSettings, waLink } from '../lib/data.js';
import { faqLd } from '../lib/seo.js';
import Img from '../components/Img.jsx';

const ADVANTAGES = [
  { img: 'advantage-01', alt: 'A freeform pool set into a lawn beside a modern home', title: 'Monolithic structural integrity',
    text: 'Engineered as a single-piece composite structure. With no vulnerable seams or joints, there is no path for water to seep or leak.',
    chips: [['Zero leakage', 'Seamless by design'], ['No seams', 'No weak points'], ['Built to last', 'Maximum durability']] },
  { img: 'advantage-02', alt: 'A Mediterranean villa with a pool on its terrace', title: 'Accelerated deployment',
    text: 'Transform your landscape in a fraction of the time. Turnkey delivery and installation means far quicker handovers than traditional pool construction.',
    chips: [['Faster install', 'Weeks, not months'], ['Turnkey', 'End-to-end service'], ['Quick handover', 'Swim sooner']] },
  { img: 'advantage-03', alt: 'Light rippling over a tiled pool floor', title: 'Architectural customisation',
    text: 'Bespoke design is never compromised. Tailor the dimensions, profiles and premium interior colour finishes to match your aesthetic.',
    chips: [['Dimensions', 'Tailored to your space'], ['Profiles', 'Edges & steps your way'], ['Finishes', 'Luxury colour options'], ['Bespoke', 'Crafted for you']] },
  { img: 'advantage-04', alt: 'Sunlight sparkling through clear pool water', title: 'Sustainable performance',
    text: 'Designed for the future: zero water wastage, lower energy consumption and significantly reduced maintenance over the life of the pool.',
    chips: [['Zero wastage', 'Smart circulation'], ['Less energy', 'LED & efficient systems'], ['Low upkeep', 'Durable by design']] },
  { img: 'advantage-05', alt: 'A whitewashed villa above a long pool on a sunny day', title: 'Optimised investment',
    text: 'A cost-effective alternative to traditional building methods, with a superior price-to-value ratio and no compromise on the high-end finish.',
    chips: [['Cost-effective', 'Lower lifecycle costs'], ['High value', 'Premium quality'], ['Faster ROI', 'Quick installation'], ['Long life', 'Low maintenance']] },
];

const LAYERS = [
  { tab: 'Gel coat', title: 'Gel coat', text: 'The surface you see and touch. An isophthalic NPG gel coat gives a smooth, glossy interior in your chosen colour and stands up to pool water, chemicals and sunlight.', tags: ['ISO NPG gel coat', 'Interior colour finish'] },
  { tab: 'Vinyl ester + CSM 450', title: 'Vinyl ester barrier', text: 'Directly behind the gel coat, a vinyl ester resin layer reinforced with chopped strand mat. Vinyl ester resists water absorption and osmosis, protecting the structure from the water side.', tags: ['Vinyl ester resin', 'CSM 450 g/m²'] },
  { tab: 'Vinyl ester + WR 650', title: 'Woven reinforcement', text: 'Woven roving adds tensile strength across the shell, while the vinyl ester resin continues the corrosion-resistant barrier.', tags: ['Vinyl ester resin', 'WR 650 g/m²'] },
  { tab: 'Core mat + ISO resin', title: 'Core mat', text: 'A core mat builds thickness and stiffness without unnecessary weight, so the shell holds its shape under the full load of water and backfill.', tags: ['Core mat', 'ISO resin'] },
  { tab: 'Structural laminate', title: 'Structural laminate', text: 'The main structural build: alternating woven roving and chopped strand mats bonded with isophthalic resin for strength in every direction.', tags: ['ISO resin', 'WR 650', 'CSM 450', 'CSM 350'] },
  { tab: 'Protective outer coat', title: 'Protective outer coat', text: 'A high-quality pigmented coat, reinforced with chopped strand mat, seals the back of the shell against ground moisture and the surrounding soil.', tags: ['Pigmented protective coat', 'CSM 350', 'CSM 450'] },
];

const KIT = [
  'Imported high-pressure sand filter, sized for the pool', 'Imported recirculation pump matched to the filter', 'High-density filter media',
  'Underwater lights', 'Turbojet high-flow return nozzle', 'ABS skimmer', 'Pool brush and suction head', 'Telescopic pole and suction hose',
  'Leaf skimmer', '2-in-1 water test kit', 'Suction drain', 'SS304 imported ladder',
];

const STEPS = [
  ['Consultation', 'Site visit, model and size selection, interior colour and equipment plan.'],
  ['Moulding', 'Your shell is laminated layer by layer in our factory at Shive, Pune.'],
  ['Quality check', 'Every shell is inspected before it leaves the factory.'],
  ['Delivery & placement', 'The finished shell is transported and craned into the prepared excavation.'],
  ['Plumbing & finishing', 'Equipment is connected, the shell backfilled and the deck finished.'],
  ['Handover & training', 'We commission the system and train owners or operators on daily running.'],
];

const COMPARE = [
  ['Build time', 'Weeks — the shell arrives finished', 'Typically 8–12 weeks for a standard pool; longer with custom features'],
  ['Structure', 'Single moulded piece with no seams or joints', 'Cast on site, with construction joints to seal'],
  ['Watertightness', 'Seamless shell — no joints for water to seep through', 'Depends on waterproofing and joint treatment'],
  ['Disruption on site', 'Short on-site phase; shell is made in the factory', 'Extended excavation, casting, curing and finishing on site'],
  ['Design freedom', 'Tailored dimensions, profiles, steps and colours', 'Any shape or size — fully bespoke'],
  ['Upkeep', 'Smooth gel-coat surface with reduced lifetime maintenance', 'Periodic re-grouting, re-tiling or re-plastering'],
  ['Cost', 'Economical, with a faster return on investment', 'Higher build cost and longer timeline'],
];

const icon = { className: 'app-icon', viewBox: '0 0 40 40', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true };
const APPLICATIONS = [
  [<svg {...icon}><path d="M5 19L20 7l15 12M9 16v17h22V16M17 33v-9h6v9" /></svg>, 'Private villas', 'A personal retreat that’s ready in weeks, sized to your garden or terrace.'],
  [<svg {...icon}><path d="M7 34V9h16v25M23 16h10v18M4 34h32M11 14h2M17 14h2M11 20h2M17 20h2M11 26h2M17 26h2M27 22h2M27 28h2" /></svg>, 'Boutique resorts', 'Add guest pools without months of construction disrupting operations.'],
  [<svg {...icon}><path d="M20 5c6 8 10 13 10 18a10 10 0 0 1-20 0c0-5 4-10 10-18z" /><path d="M15 24a5 5 0 0 0 5 5" /></svg>, 'Wellness centres', 'Plunge and therapy pools that pair with saunas, steam rooms and jacuzzis.'],
  [<svg {...icon}><path d="M3 25c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2 3-2 6-2M3 31c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2 3-2 6-2" /><circle cx="24" cy="10" r="3" /><path d="M10 20l7-6 5 4" /></svg>, 'Clubs & societies', 'Durable, low-maintenance pools for residential societies and sports clubs.'],
];

export default function FrpPools() {
  const settings = useSettings();
  const [layer, setLayer] = useState(0);
  const branches = settings.branches;

  const faqs = [
    ['How long does installation take?', 'Much less time than a concrete pool. Your shell is moulded in our factory while the site is prepared, then delivered finished and craned into place. Most of the on-site time goes into excavation, plumbing and the surrounding deck. After a site survey we’ll give you a schedule for your project.'],
    ['Can I customise the size, shape or colour?', 'Yes. The standard models above can be tailored in dimensions, edge profiles, steps and interior colour finish. Tell us about your space and we’ll suggest the closest model or a custom option.'],
    ['What comes with the pool?', 'Every pool includes a sand filter and matched pump, filter media, underwater lights, a turbojet return nozzle, ABS skimmer, cleaning kit (brush, suction head, telescopic pole, hose and leaf skimmer), a 2-in-1 test kit, suction drain and an SS304 ladder.'],
    ['Will an FRP pool leak?', 'The shell is a single moulded piece with no seams or joints, which are the most common source of leaks in site-built pools. The vinyl ester layers behind the gel coat also resist water absorption.'],
    ['Do you deliver outside Pune?', `Yes. We work across India, with branches in ${branches}. Share your site location and we’ll plan transport and crane access with you.`],
    ['How much does a readymade pool cost?', <>It depends on the model, size, finishes and site conditions. FRP pools are an economical alternative to concrete. <Link to="/contact?type=frp">Send us your requirements</Link> for a quote.</>],
  ];

  const COST_ANSWER = 'It depends on the model, size, finishes and site conditions. FRP pools are an economical alternative to concrete. Send us your requirements for a quote.';
  usePageMeta('One-Piece FRP Swimming Pools in India, Made in Pune | Cresta',
    'One-piece FRP swimming pools with a six-layer fibreglass laminate and no seams. Sizes from 8×8 ft plunge pools to 10×30 ft, with pump, filter and ladder.',
    {
      crumbs: [['FRP Pools', '/frp-pools']],
      image: '/img/frp/hero.webp',
      jsonLd: () => faqLd(faqs.map(([q, a]) => [q, typeof a === 'string' ? a : COST_ANSWER])),
    });

  return (
    <>
      <PageHero image="/img/frp/hero.webp" alt="A bright blue villa pool with sun loungers on a timber deck" crumb="FRP Pools"
        eyebrow="FRP technology · Made in India" title="One-piece FRP swimming pools."
        sub="Uncompromising luxury, delivered with remarkable speed. A one-piece fibreglass shell, moulded in our factory and installed complete with equipment.">
        <Link className="btn btn-primary" to="/contact?type=frp">Request a Quote</Link>
        <DocLink className="btn btn-ghost" href={settings.brochure_url}>Request Brochure</DocLink>
      </PageHero>

      <section className="section">
        <div className="container">
          <div className="split u-end">
            <div className="stack" data-reveal>
              <p className="eyebrow">The Cresta difference</p>
              <h2 className="h2">Optimise time.<br />Maximise value.</h2>
            </div>
            <p className="lead" data-reveal data-reveal-delay="1">For private villas, boutique resorts and premium wellness centres across India, Cresta engineers prefabricated pools that combine real architectural flexibility with convenience — and skip the long timelines of traditional concrete construction.</p>
          </div>
          <div className="stat-row" data-reveal>
            <div><strong>Weeks</strong><span>not months, from order to swim</span></div>
            <div><strong>0</strong><span>seams or joints in the shell</span></div>
            <div><strong><CountUp to={6} /></strong><span>laminate layers, bonded as one</span></div>
            <div><strong><CountUp to={KIT.length} /></strong><span>equipment items in every package</span></div>
          </div>
        </div>
      </section>

      <section className="section section--paper" id="advantages">
        <div className="container">
          <SectionHead eyebrow="Five pillars of excellence" title="The FRP advantage" />
          <div className="adv-list">
            {ADVANTAGES.map((a, i) => (
              <article className="adv" data-reveal key={a.img}>
                <div className="adv-media"><Img src={`/img/frp/${a.img}.webp`} alt={a.alt} /></div>
                <div>
                  <span className="adv-num">{String(i + 1).padStart(2, '0')}</span>
                  <p className="eyebrow adv-kicker">Advantage {String(i + 1).padStart(2, '0')}</p>
                  <h3 className="h3">{a.title}</h3>
                  <p>{a.text}</p>
                  <div className="adv-chips">{a.chips.map(([t, s]) => <div key={t}><strong>{t}</strong><span>{s}</span></div>)}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dark" id="construction">
        <div className="container">
          <SectionHead eyebrow="Construction" title="Six layers. One shell."
            lead="Every Cresta pool is laminated by hand from international-quality polymers and resins, layer by layer, then cured as a single structure. Select a layer to see what it does." />
          <div className="laminate">
            <div>
              <div className="layer-edge"><span>Water side</span><span>↑</span></div>
              <div className="layer-stack" role="tablist" aria-label="Laminate layers" aria-orientation="vertical">
                {LAYERS.map((l, i) => (
                  <button key={l.tab} className={`layer layer-${i + 1}`} role="tab" id={`lt-${i}`} aria-controls={`lp-${i}`}
                    aria-selected={layer === i} tabIndex={layer === i ? 0 : -1}
                    onClick={() => setLayer(i)} onKeyDown={tabKeys(i, LAYERS.length, setLayer)}>
                    {l.tab} <span className="ln">L{i + 1}</span>
                  </button>
                ))}
              </div>
              <div className="layer-edge"><span>Ground side</span><span>↓</span></div>
            </div>
            <div>
              {LAYERS.map((l, i) => (
                <div className="layer-panel" role="tabpanel" id={`lp-${i}`} aria-labelledby={`lt-${i}`} hidden={layer !== i} key={l.tab}>
                  <span className="lp-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{l.title}</h3>
                  <p>{l.text}</p>
                  <div className="mat-tags">{l.tags.map((t) => <span key={t}>{t}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="models">
        <div className="container">
          <SectionHead split eyebrow="Available models" title="Find your size"
            lead="Standard shells from compact plunge pools to 30-foot family pools. Every model can be customised."
            action={<Link className="btn btn-outline" to="/contact?type=frp">Ask about a custom size</Link>} />
          <ModelRange />
          <p className="scale-note"><i aria-hidden="true" />Plans are drawn to the same scale, so you can compare sizes at a glance — 1 grid square = 2 ft. Shapes are illustrative; final layout follows your approved drawing.</p>
        </div>
      </section>

      <section className="section section--darker" id="included">
        <div className="container">
          <SectionHead eyebrow="What's included" title="A complete pool, ready to fill."
            lead="Every Cresta FRP pool ships with a matched filtration, lighting and cleaning package — no separate shopping list." />
          <ul className="kit-grid" data-reveal>
            {KIT.map((item, i) => (
              <li className="kit-item" key={item}><span className="kit-letter">{String.fromCharCode(65 + i)}</span><p>{item}</p></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <SectionHead eyebrow="From mould to water" title="How your pool comes together" />
          <ol className="process" data-reveal>
            {STEPS.map(([t, d]) => <li className="step" key={t}><h3>{t}</h3><p>{d}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="FRP vs concrete" title="An honest comparison"
            lead={<>The Crystal Pools group builds both, so we'll help you choose what suits your site. Here's how they differ, and our <Link to="/blog/rcc-vs-frp-swimming-pool">full RCC vs FRP guide</Link> goes deeper.</>} />
          <div className="table-wrap" data-reveal>
            <table className="compare">
              <thead><tr><th scope="col">Consideration</th><th scope="col" className="is-cresta">Cresta FRP pool</th><th scope="col">Conventional concrete pool</th></tr></thead>
              <tbody>
                {COMPARE.map(([k, a, b]) => <tr key={k}><th scope="row">{k}</th><td className="is-cresta">{a}</td><td>{b}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section section--mist">
        <div className="container">
          <SectionHead center eyebrow="Applications" title="Made for every setting" />
          <div className="grid grid-4">
            {APPLICATIONS.map(([svg, t, d], i) => (
              <div className="app-card" data-reveal data-reveal-delay={i || undefined} key={t}>{svg}<h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container container--narrow">
          <SectionHead center eyebrow="FAQ" title="Questions about FRP pools" />
          <div className="faq">
            {faqs.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><div className="faq-a"><p>{a}</p></div></details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand eyebrow="Get started" title="Accelerate your vision."
        text="Tell us your site dimensions and we'll recommend a model, finish and equipment package.">
        <Link className="btn btn-primary" to="/contact?type=frp">Request a Quote</Link>
        <DocLink className="btn btn-ghost" href={settings.brochure_url}>Request Brochure</DocLink>
        <Ext className="btn btn-wa" href={waLink(settings.whatsapp, "Hello Cresta, I'm interested in an FRP pool.")}>WhatsApp Us</Ext>
      </CtaBand>
    </>
  );
}
