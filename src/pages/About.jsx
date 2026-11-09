import { Link } from 'react-router-dom';
import { CtaBand, Ext, PageHero, SectionHead, usePageMeta } from '../components/ui.jsx';
import { useSettings } from '../lib/data.js';
import Img from '../components/Img.jsx';

const VALUES = [
  ['Commitment', 'A relentless pursuit of perfection, so every project is delivered to the highest standard.'],
  ['Excellence', 'Uncompromising quality in design, engineering and execution, with craftsmanship you can see.'],
  ['Efficiency', 'Optimised processes and smart engineering that make the most of every resource without cutting corners.'],
];

const TIMELINE = [
  ['1993', 'The foundation', 'Nilesh Shukla founds Crystal Pools with a vision to redefine aquatic architecture.'],
  ['2005', 'Pioneering technology', 'Advanced filtration and structural technologies introduced to the Indian market.'],
  ['2010', 'Expanding reach', 'Milestone projects completed across several states, establishing a national footprint.'],
  ['2015', 'Global standards', 'Full adherence to international manufacturing standards under Make in India.'],
  ['2024', 'Expanding horizons', 'Sarthak Shukla leads the next phase of expansion and sustainable innovation.'],
  ['Today', 'Introducing Cresta', "The group's FRP pools and pool equipment come together under the Cresta brand."],
];

const w = { viewBox: '0 0 32 32', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, 'aria-hidden': true };
const WHY = [
  [<svg {...w}><rect x="4" y="4" width="10" height="10" rx="1" /><rect x="18" y="4" width="10" height="10" rx="1" /><rect x="4" y="18" width="10" height="10" rx="1" /><rect x="18" y="18" width="10" height="10" rx="1" /></svg>, 'Integrated solutions', 'Concept to completion under one roof, for maximum convenience and reliability.'],
  [<svg {...w}><path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7l11-4z" /><path d="M11 16l3.5 3.5L21 13" /></svg>, 'Quality focus', 'Rigorous checks at every stage, from material selection to execution.'],
  [<svg {...w}><path d="M4 18l6 6 6-6M10 24V12a8 8 0 0 1 16 0v14" /></svg>, 'Long-term support', 'The close of a sale is just the start of a long-lasting partnership.'],
  [<svg {...w}><circle cx="16" cy="16" r="12" /><path d="M12 11h8M12 15h8M14 11c4 0 4 8 0 8l6 5" /></svg>, 'Cost competitive', 'Streamlined workflows make the best use of resources, so you get better value.'],
  [<svg {...w}><path d="M3 12l13-6 13 6-13 6-13-6z" /><path d="M8 15v7c4 3 12 3 16 0v-7M29 12v8" /></svg>, 'Training options', 'Hands-on owner and operator training for smooth day-to-day running.'],
  [<svg {...w}><path d="M18 3L7 18h8l-2 11 12-16h-8l1-10z" /></svg>, 'Rapid response', 'Quick, professional response for spares, repairs and servicing.'],
];

const LEADERS = [['NS', 'Nilesh D. Shukla', 'Founder-Director'], ['DS', 'Deepali N. Shukla', 'Director'], ['SS', 'Sarthak Shukla', 'CEO']];

export default function About() {
  usePageMeta('About Cresta: FRP Pool Maker, A Crystal Pools Company',
    'Cresta is the FRP pool and equipment brand of Crystal Pools, with 30+ years of experience, 2,000+ pools across India and its own factory at Shive near Pune.',
    { crumbs: [['About', '/about']] });
  const settings = useSettings();
  const branches = settings.branches.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <>
      <PageHero image="/img/site/about-hero.webp" alt="An indoor pool behind floor-to-ceiling glass, opening onto a garden" crumb="About"
        eyebrow="About Cresta" title="A new name, three decades deep."
        sub="Cresta is the manufacturing and equipment brand of Crystal Pools, bringing one-piece FRP pools, pumps and water systems together under one name." />

      <section className="section">
        <div className="container split">
          <div className="media-frame media-frame--tall" data-reveal>
            <Img src="/img/site/construction.webp" alt="Aerial view of a club pool and lawns surrounded by trees" />
          </div>
          <div className="stack prose" data-reveal data-reveal-delay="1">
            <p className="eyebrow">Our story</p>
            <h2 className="h2">Built on more than 2,000 pools.</h2>
            <p className="lead">Crystal Swimming Pools (I) Pvt. Ltd. — Crystal Pools — has designed and built more than 2,000 swimming pools across India, from private villas to hotels and competition venues.</p>
            <p>That experience taught us what lasts, and that's what Cresta is built on. The group's fibreglass pool manufacturing and its equipment range now carry a dedicated brand, with their own factory, product line and dealer programme.</p>
            <p>The Cresta mark — four interlocking rings around a guiding star — stands for water in constant circulation, held to a single standard.</p>
            <div className="btn-row u-mt-28">
              <Link className="btn btn-primary" to="/frp-pools">Our FRP pools</Link>
              <Link className="btn btn-outline" to="/contact">Talk to our team</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <SectionHead eyebrow="Our cornerstones" title="The principles behind every product" />
          <div className="grid grid-3">
            {VALUES.map(([t, d], i) => (
              <div className="value-card" data-reveal data-reveal-delay={i || undefined} key={t}>
                <span className="vn">{String(i + 1).padStart(2, '0')}</span><h3>{t}</h3><p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dark" id="manufacturing">
        <div className="container split split--reverse">
          <div className="media-frame" data-reveal>
            <Img src="/img/frp/readymade.webp" alt="Aerial view of a rectangular pool with lane markings" />
            <div className="media-badge"><strong>Shive, Pune</strong><span>Our FRP manufacturing facility, Tal. Khed, Dist. Pune</span></div>
          </div>
          <div className="stack" data-reveal data-reveal-delay="1">
            <p className="eyebrow">Manufacturing</p>
            <h2 className="h2">Made in India, to international standards.</h2>
            <p className="lead">Our fibreglass pools are made with processes that set them apart from local fabrication — from mould and pattern through to quality checks and owner training.</p>
            <ul className="check-list">
              <li><strong>100% one-piece shell</strong> — moulded as a single structure.</li>
              <li><strong>100% skilled craftsmanship</strong> — hand-laminated by trained teams.</li>
              <li><strong>100% anti-corrosive materials</strong> — vinyl ester and isophthalic resins.</li>
              <li><strong>100% quality-controlled</strong> — high-grade materials and documented procedures.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="split u-start">
            <div className="stack u-sticky">
              <p className="eyebrow">Our journey</p>
              <h2 className="h2">A legacy built on precision.</h2>
              <p className="lead">From a single vision in Pune to a national footprint — and now, a brand of our own.</p>
            </div>
            <ol className="timeline">
              {TIMELINE.map(([y, t, d]) => (
                <li className="tl-item" data-reveal key={y}><span className="tl-year">{y}</span><div className="tl-body"><h3>{t}</h3><p>{d}</p></div></li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section section--darker">
        <div className="container">
          <SectionHead eyebrow="Why Cresta" title="More than a supplier." lead="Premium aquatic engineering combined with dependable, long-term support." />
          <div className="why-grid">
            {WHY.map(([svg, t, d], i) => (
              <div className="why-item" data-reveal data-reveal-delay={i % 3 || undefined} key={t}>{svg}<h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Leadership" title="The people behind the brand" />
          <div className="grid grid-3">
            {LEADERS.map(([ini, name, role], i) => (
              <div className="leader" data-reveal data-reveal-delay={i || undefined} key={name}>
                <span className="avatar" aria-hidden="true">{ini}</span><div><h3>{name}</h3><p>{role}</p></div>
              </div>
            ))}
          </div>
          <div className="split u-start u-mt-xl">
            <div className="stack">
              <p className="eyebrow">Presence</p>
              <h2 className="h3">Across India</h2>
              <p className="muted">Branches and project teams in {branches.length} regions, with our office and factory in Pune.</p>
            </div>
            <div className="stack">
              <ul className="place-list">{branches.map((b) => <li key={b}>{b}</li>)}</ul>
              <Link className="link-arrow" to="/contact">Find your nearest team</Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBand eyebrow="Work with us" title="Let's make something that lasts."
        text="Whether you're a homeowner, architect, hotelier or pool builder, we'd like to hear about your project.">
        <Link className="btn btn-primary" to="/contact">Contact Cresta</Link>
        <Link className="btn btn-ghost" to="/contact?type=dealer">Become a dealer</Link>
      </CtaBand>
    </>
  );
}
