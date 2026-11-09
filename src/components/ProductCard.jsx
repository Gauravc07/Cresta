import { useSettings, waLink } from '../lib/data.js';
import Img from './Img.jsx';
import { DocLink } from './ui.jsx';

export default function ProductCard({ product, highlight, revealDelay }) {
  const { whatsapp } = useSettings();
  const p = product;
  return (
    <article
      className={`product-card${highlight ? ' is-highlight' : ''}`}
      id={p.id}
      {...(revealDelay !== undefined ? { 'data-reveal': true, 'data-reveal-delay': revealDelay || undefined } : {})}
    >
      <div className={`product-media${p.is_photo ? ' is-photo' : ''}`}>
        {p.image_path && <Img src={p.image_path} alt={p.name} />}
      </div>
      <div className="product-body">
        {p.label && <p className="product-cat">{p.label}</p>}
        <h3 className="product-name">{p.name}</h3>
        {p.description && <p className="product-desc">{p.description}</p>}
        <div className="product-actions">
          <a className="btn btn-primary btn-mini" target="_blank" rel="noopener noreferrer"
            href={waLink(whatsapp, `Hello Cresta, I'm interested in the ${p.name}. Please share details and pricing.`)}>Enquire</a>
          {p.datasheet_url && <DocLink className="btn btn-outline btn-mini" href={p.datasheet_url}>Datasheet</DocLink>}
        </div>
      </div>
    </article>
  );
}
