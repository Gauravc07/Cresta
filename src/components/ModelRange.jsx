import { useMemo, useState } from 'react';
import { useFrpRange, useSettings, waLink } from '../lib/data.js';

// Every plan uses the same scale (px per foot) so sizes compare at a glance.
const S = 6;
const VW = 220; const VH = 84;
const AX = 14; const AY = 14; const AW = 194; const AH = 62;
const r1 = (v) => Math.round(v * 10) / 10;
const toM = (ft) => (ft * 0.3048).toFixed(2);

function Plan({ collection, w, l, label }) {
  let body;
  let dims;
  if (l == null) {
    const r = (w * S) / 2; const cx = AX + AW / 2; const cy = AY + AH / 2 + 2; const y = r1(cy - r - 5);
    body = (
      <>
        <circle className="p-water" cx={cx} cy={cy} r={r} />
        <circle className="p-step" cx={cx} cy={cy} r={r1(r - S * 1.1)} />
      </>
    );
    dims = (
      <>
        <path className="p-dim" d={`M${r1(cx - r)} ${y}H${r1(cx + r)}M${r1(cx - r)} ${y - 2}v4M${r1(cx + r)} ${y - 2}v4`} />
        <text className="p-label" x={cx} y={y - 3} textAnchor="middle">{`${w}′ Ø`}</text>
      </>
    );
  } else {
    const pw = l * S; const ph = w * S;
    const x = r1(AX + (AW - pw) / 2); const y = r1(AY + (AH - ph) / 2 + 2); const cy = y + ph / 2;
    const extra = [];
    if (collection === 'classic') {
      [1, 2, 3].forEach((i) => { const r = r1(i * S * 1.1); extra.push(<path key={i} className="p-step" d={`M${x} ${r1(y + r)}A${r} ${r} 0 0 0 ${r1(x + r)} ${y}`} />); });
    } else if (collection === 'linear') {
      [1, 2, 3].forEach((i) => { const sx = r1(x + i * S * 0.9); extra.push(<path key={i} className="p-step" d={`M${sx} ${y}V${y + ph}`} />); });
    } else if (collection === 'family') {
      const zone = r1(Math.min(pw * 0.3, 7 * S));
      extra.push(<rect key="z" className="p-shallow" x={x} y={y} width={zone} height={ph} rx="1.5" />);
      extra.push(<path key="d" className="p-div" d={`M${r1(x + zone)} ${y}V${y + ph}`} />);
    } else if (collection === 'signature') {
      [0.55, 0.75, 0.95].forEach((f) => { const r = r1((ph / 2) * f * 0.85); extra.push(<path key={f} className="p-step" d={`M${x} ${r1(cy - r)}A${r} ${r} 0 0 1 ${x} ${r1(cy + r)}`} />); });
    } else if (collection === 'plunge') {
      extra.push(<path key="b" className="p-step" d={`M${x} ${r1(y + ph - S * 1.4)}H${x + pw}`} />);
    }
    const ty = r1(y - 5); const lx = r1(x - 5);
    body = <><rect className="p-water" x={x} y={y} width={pw} height={ph} rx="1.5" />{extra}</>;
    dims = (
      <>
        <path className="p-dim" d={`M${x} ${ty}H${x + pw}M${x} ${ty - 2}v4M${x + pw} ${ty - 2}v4`} />
        <text className="p-label" x={r1(x + pw / 2)} y={ty - 3} textAnchor="middle">{`${l}′`}</text>
        <path className="p-dim" d={`M${lx} ${y}V${y + ph}M${lx - 2} ${y}h4M${lx - 2} ${y + ph}h4`} />
        <text className="p-label" x={lx - 3} y={r1(cy + 2.5)} textAnchor="end">{`${w}′`}</text>
      </>
    );
  }
  return (
    <svg className="plan" viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={`Plan view of the ${label}`}>
      <rect width={VW} height={VH} fill="url(#bp-grid)" />
      {body}{dims}
    </svg>
  );
}

export default function ModelRange() {
  const { data } = useFrpRange();
  const { whatsapp } = useSettings();
  const [filter, setFilter] = useState('all');
  const byId = useMemo(() => Object.fromEntries(data.collections.map((c) => [c.id, c])), [data.collections]);
  const shown = data.models.filter((m) => filter === 'all' || m.collection_id === filter);

  return (
    <>
      <svg className="u-abs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="bp-water" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#36b6cc" /><stop offset="1" stopColor="#0e6f87" />
          </linearGradient>
          <pattern id="bp-grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M12 0H0V12" fill="none" stroke="rgba(98,210,227,.14)" strokeWidth=".6" />
          </pattern>
        </defs>
      </svg>

      <div className="filter-row" role="group" aria-label="Filter models by collection">
        {[{ id: 'all', name: 'All models' }, ...data.collections].map((c) => (
          <button key={c.id} className="chip" type="button" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
            {c.name}
            <span className="count">{c.id === 'all' ? data.models.length : data.models.filter((m) => m.collection_id === c.id).length}</span>
          </button>
        ))}
      </div>

      <div className="model-grid" aria-live="polite">
        {shown.map((m) => {
          const c = byId[m.collection_id] ?? { name: m.collection_id, blurb: '' };
          const round = m.length_ft == null;
          const size = round ? `${m.width_ft}′ diameter` : `${m.width_ft}′ × ${m.length_ft}′`;
          const metric = round ? `${toM(m.width_ft)} m Ø` : `${toM(m.width_ft)} × ${toM(m.length_ft)} m`;
          const area = round ? Math.PI * (m.width_ft / 2) ** 2 : m.width_ft * m.length_ft;
          return (
            <article className="model-card" key={m.id}>
              <div className="model-plan"><Plan collection={m.collection_id} w={m.width_ft} l={m.length_ft} label={`${c.name} ${size} pool`} /></div>
              <div className="model-body">
                <p className="product-cat">{c.name}</p>
                <h3>{size}</h3>
                <p className="model-dims">{metric} · {c.blurb}</p>
                <div className="model-meta"><span>Water surface</span><b>{Math.round(area)} sq ft · {(area * 0.092903).toFixed(1)} m²</b></div>
                <a className="btn btn-outline btn-mini" href={waLink(whatsapp, `Hello Cresta, I'm interested in the ${c.name} ${size} FRP pool. Please share pricing and details.`)} target="_blank" rel="noopener noreferrer">
                  Enquire about this model
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
