import { useState } from 'react';
import { Link } from 'react-router-dom';

const PARTS = [
  { id: 'shell', title: 'One-piece FRP shell', at: [220, 346], text: 'A six-layer fibreglass laminate moulded as a single piece — no seams, no joints, no seepage.', link: ['/frp-pools', 'Explore FRP pools'] },
  { id: 'skimmer', title: 'Skimmer', at: [618, 106], text: 'Draws water off the surface and catches leaves and debris before they sink. An ABS skimmer comes with every FRP pool.', link: ['/products?cat=accessories', 'Fittings & accessories'] },
  { id: 'drain', title: 'Main drain', at: [502, 436], text: 'Pulls water from the deepest point so the whole volume circulates, not just the surface layer.', link: ['/products?cat=accessories', 'Fittings & accessories'] },
  { id: 'pump', title: 'Circulation pump', at: [660, 50], text: 'The heart of the system. MXB pumps for residential pools, flanged MRB pumps for commercial duty, and compact MTX pumps for tight plant rooms.', link: ['/pumps-filtration', 'Compare pump series'] },
  { id: 'filter', title: 'Sand filter', at: [800, -22], text: 'High-pressure sand filters trap fine particles. Top- and side-mount residential models; vertical and horizontal commercial units.', link: ['/pumps-filtration#filters', 'Compare filters'] },
  { id: 'treat', title: 'Chlorination & dosing', at: [951, -10], text: 'Salt chlorinators, tablet feeders and dosing pumps hold sanitiser levels steady without daily manual dosing.', link: ['/products?cat=treatment', 'Water treatment'] },
  { id: 'jets', title: 'Return jets', at: [120, 294], text: 'Turbojet high-flow nozzles send clean, treated water back in and keep the whole pool moving.', link: ['/frp-pools#included', "What's in the box"] },
  { id: 'light', title: 'Underwater lights', at: [530, 262], text: 'Recessed lights for night swimming and ambience — included in every FRP pool package.', link: ['/frp-pools#included', "What's in the box"] },
];

const SUCTION = ['M618 194 V262 H700', 'M540 399 V462 H700 V122', 'M730 82 V22 H832'];
const RETURN = 'M860 22 H890 V492 H34 V262 H60';
const SHELL = 'M66 136 V312 Q66 330 84 330 H330 L490 398 H580 Q594 398 594 384 V136';
const SURFACE = `M66 160 q11 -4 22 0${' t22 0'.repeat(23)}`;

export default function PoolDiagram() {
  const [active, setActive] = useState('pump');

  return (
    <div className="pool-works">
      <figure className="pw-figure" data-reveal>
        <svg className="pw-svg" viewBox="0 -50 1000 570" role="img" aria-labelledby="pw-title pw-desc">
          <title id="pw-title">Cross-section of a Cresta pool and equipment pad</title>
          <desc id="pw-desc">Water leaves the pool through the skimmer and main drain, passes through the pump, sand filter and chlorinator on the equipment pad, and returns through the return jets.</desc>
          <defs>
            <linearGradient id="pw-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#93dce8" /><stop offset="0.55" stopColor="#3db1c8" /><stop offset="1" stopColor="#127c95" />
            </linearGradient>
            <pattern id="pw-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="14" stroke="#d7dce0" strokeWidth="1.2" />
            </pattern>
            <radialGradient id="pw-glow">
              <stop offset="0" stopColor="#fffbe6" stopOpacity="0.9" /><stop offset="1" stopColor="#fffbe6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ground, deck, shell, water */}
          <rect className="soil" x="0" y="150" width="1000" height="370" />
          <rect className="soil-hatch" x="0" y="150" width="1000" height="370" />
          <rect className="deck" x="0" y="136" width="1000" height="16" />
          <rect x="66" y="128" width="528" height="32" fill="#ffffff" />
          <path className="shell-edge" d={SHELL} />
          <path className="shell" d={SHELL} />
          <path className="water" d="M66 160 H594 V384 Q594 398 580 398 H490 L330 330 H84 Q66 330 66 312 Z" />
          <path className="surface" d={SURFACE} />
          <rect className="coping" x="52" y="130" width="26" height="8" rx="2" />
          <rect className="coping" x="582" y="130" width="26" height="8" rx="2" />

          {/* light, ladder, skimmer, drain, jet */}
          <ellipse className="glow" cx="554" cy="300" rx="62" ry="36" />
          <circle className="fixture" cx="589" cy="300" r="8" />
          <path className="steel" d="M34 136 V114 Q34 98 50 98 H70 Q86 98 86 114 V232" />
          <path className="steel-thin" d="M86 178 H104 M86 210 H104" />
          <rect x="600" y="152" width="36" height="42" rx="3" fill="#d6dce1" stroke="#8f9ba6" strokeWidth="2" />
          <rect className="equip" x="588" y="158" width="14" height="14" rx="2" />
          <rect className="equip-2" x="602" y="132" width="32" height="5" rx="2" />
          <rect className="equip" x="520" y="392" width="40" height="7" rx="2" />
          <rect className="equip" x="58" y="255" width="14" height="14" rx="3" />
          <path className="flow" d="M74 262 H160" opacity="0.8" />
          <path className="flow" d="M74 262 Q110 252 150 248" opacity="0.5" />

          {/* pipes with animated flow */}
          {SUCTION.map((d) => <path key={d} className="pipe pipe--suction" d={d} />)}
          <path className="pipe pipe--return" d={RETURN} />
          {[...SUCTION, RETURN].map((d) => <path key={`f${d}`} className="flow" d={d} />)}

          {/* equipment pad: pump, filter, chlorinator */}
          <rect x="664" y="126" width="326" height="10" rx="2" fill="#aab4bd" />
          <rect className="equip-2" x="682" y="118" width="104" height="8" rx="2" />
          <rect className="equip" x="686" y="72" width="34" height="48" rx="6" />
          <rect className="lid" x="683" y="63" width="40" height="11" rx="3" />
          <rect className="equip-2" x="718" y="80" width="22" height="38" />
          <rect className="equip" x="738" y="76" width="48" height="42" rx="10" />
          <path className="equip-line" d="M750 84 V110 M759 84 V110 M768 84 V110 M777 84 V110" />
          <rect className="equip" x="812" y="30" width="66" height="90" rx="30" />
          <rect className="equip-hi" x="812" y="64" width="66" height="4" />
          <rect className="equip-2" x="818" y="116" width="54" height="10" rx="2" />
          <rect className="equip-2" x="830" y="10" width="30" height="22" rx="3" />
          <circle className="fixture" cx="845" cy="0" r="6" />
          <rect className="equip" x="878" y="46" width="24" height="62" rx="8" />
          <rect className="screen" x="882" y="58" width="16" height="3" rx="1" />
          <rect className="equip-2" x="922" y="22" width="58" height="42" rx="3" />
          <rect className="screen" x="930" y="30" width="26" height="12" rx="1" />
          <circle cx="968" cy="36" r="3" fill="#62d2e3" />
          <path className="equip-line" d="M922 54 H902" />
          <text className="pad-label" x="790" y="182" textAnchor="middle">Equipment pad</text>

          {PARTS.map((p, i) => (
            <g
              key={p.id}
              className={`hotspot${active === p.id ? ' is-active' : ''}`}
              tabIndex={0}
              role="button"
              aria-label={`${i + 1}: ${p.title}`}
              aria-pressed={active === p.id}
              onClick={() => setActive(p.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(p.id); } }}
            >
              <circle className="ring" cx={p.at[0]} cy={p.at[1]} r="17" />
              <circle className="dot" cx={p.at[0]} cy={p.at[1]} r="17" />
              <text x={p.at[0]} y={p.at[1]}>{i + 1}</text>
            </g>
          ))}
        </svg>
        <figcaption className="pw-legend">
          <span><i className="lg-suction" />Suction — water out of the pool</span>
          <span><i className="lg-return" />Return — filtered, treated water back in</span>
        </figcaption>
      </figure>

      <ol className="pw-list" data-reveal data-reveal-delay="1">
        {PARTS.map((p, i) => (
          <li className="pw-item" key={p.id}>
            <button className="pw-btn" type="button" aria-expanded={active === p.id} aria-controls={`pw-d-${p.id}`} onClick={() => setActive(p.id)}>
              <span className="pw-num">{i + 1}</span>{p.title}
            </button>
            <div className="pw-detail" id={`pw-d-${p.id}`} hidden={active !== p.id}>
              <p>{p.text}</p>
              <Link className="link-arrow" to={p.link[0]}>{p.link[1]}</Link>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
