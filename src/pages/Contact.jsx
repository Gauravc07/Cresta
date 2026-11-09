import EnquiryForm from '../components/EnquiryForm.jsx';
import { ClockIcon, FactoryIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from '../components/Icons.jsx';
import { PageHero, SectionHead, usePageMeta } from '../components/ui.jsx';
import { useSettings } from '../lib/data.js';
import { faqLd, localBusinessLd } from '../lib/seo.js';

const FAQS = [
  ['What should I include in a quote request?', 'Your site location, the space available (or the pool size you want), whether it’s a home or commercial pool, and any photos of the site. For equipment-only orders, send the pool dimensions and your current pump and filter details if you’re replacing them.'],
  ['Do you supply equipment for pools you didn’t build?', 'Yes. Our pumps, filters, treatment systems and accessories suit new builds and replacements alike. We can help size replacements from your existing set-up.'],
  ['How do I become a Cresta dealer?', 'Choose “Dealer / distributor partnership” in the form above and tell us about your business and region. Our team will get back to you with the programme details.'],
  ['Do you offer servicing and spares?', 'Yes. We respond quickly to requests for spares, repairs and servicing, and offer owner and operator training so your pool runs smoothly day to day.'],
];

export default function Contact() {
  const s = useSettings();
  usePageMeta('Contact Cresta: Request a Quote for FRP Pools & Equipment',
    'Contact Cresta for FRP swimming pools, pool pumps, filters and water treatment. Call, WhatsApp or send an enquiry to our team in Dhayari, Pune, Maharashtra.',
    {
      crumbs: [['Contact', '/contact']],
      jsonLd: (base) => [...localBusinessLd(s, base), faqLd(FAQS)],
    });
  const branches = s.branches.split(',').map((b) => b.trim()).filter(Boolean);

  return (
    <>
      <PageHero compact image="/img/site/pool-sunset.webp" alt="A family home with its pool lit up at dusk" crumb="Contact"
        eyebrow="Contact" title="Let's talk about your pool."
        sub="Quotes, sizing, dealer partnerships and service — our team replies within working hours, Monday to Saturday." />

      <section className="section">
        <div className="container contact-layout">
          <div className="form-card">
            <p className="eyebrow">Send an enquiry</p>
            <h2 className="h3 u-mt-12">Tell us what you need</h2>
            <EnquiryForm />
          </div>

          <div className="contact-cards">
            <a className="contact-card" href={`tel:${s.phone_tel}`}>
              <span className="ci"><PhoneIcon /></span>
              <span><small>Call</small><strong>{s.phone_display}</strong><span>Landline {s.landline}</span></span>
            </a>
            <a className="contact-card" href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer">
              <span className="ci"><WhatsAppIcon /></span>
              <span><small>WhatsApp</small><strong>Chat with our team</strong><span>Fastest for quotes and photos</span></span>
            </a>
            <a className="contact-card" href={`mailto:${s.email}`}>
              <span className="ci"><MailIcon /></span>
              <span><small>Email</small><strong>{s.email}</strong><span>Drawings, tenders and documents</span></span>
            </a>
            <div className="contact-card">
              <span className="ci"><PinIcon /></span>
              <span><small>Office</small><address>{s.office_address}</address></span>
            </div>
            <div className="contact-card">
              <span className="ci"><FactoryIcon /></span>
              <span><small>Factory</small><address>{s.factory_address}</address></span>
            </div>
            <div className="contact-card">
              <span className="ci"><ClockIcon /></span>
              <span className="u-flex-1"><small>Working hours</small>
                <span className="u-block">{s.hours_week}</span>
                <span className="u-block">Sunday: {s.hours_sunday}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <SectionHead split eyebrow="Our presence" title="Teams across India"
            lead="Head office in Dhayari, Pune, with branches serving projects across Maharashtra, Goa and Rajasthan."
            action={<ul className="place-list">{branches.map((b) => <li key={b}>{b}</li>)}</ul>} />
          <iframe className="map-frame" title="Map showing the Cresta office in Dhayari, Pune" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            src={`https://www.google.com/maps?q=${encodeURIComponent(s.office_address)}&output=embed`} />
        </div>
      </section>

      <section className="section">
        <div className="container container--narrow">
          <SectionHead center eyebrow="FAQ" title="Before you get in touch" />
          <div className="faq">
            {FAQS.map(([q, a]) => <details key={q}><summary>{q}</summary><div className="faq-a"><p>{a}</p></div></details>)}
          </div>
        </div>
      </section>
    </>
  );
}
