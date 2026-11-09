import { useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { submitEnquiry, useSettings, waLink } from '../lib/data.js';
import { ENQUIRY_TOPICS } from '../data/seed.js';
import { WhatsAppIcon } from './Icons.jsx';

const TOPIC_IDS = ENQUIRY_TOPICS.map(([id]) => id);

export default function EnquiryForm() {
  const settings = useSettings();
  const [params] = useSearchParams();
  const { pathname, search } = useLocation();
  const formRef = useRef(null);
  const [status, setStatus] = useState({ state: 'idle', msg: '' });

  const product = params.get('product') ?? '';
  const typeParam = params.get('type');
  const defaultTopic = TOPIC_IDS.includes(typeParam) ? typeParam : (product ? 'equipment' : '');

  const read = () => {
    const fd = new FormData(formRef.current);
    const v = (k) => String(fd.get(k) ?? '').trim();
    return {
      honeypot: v('website'),
      enquiry: {
        name: v('name'), company: v('company') || null, phone: v('phone'), email: v('email') || null,
        city: v('city') || null, topic: v('topic'), message: v('message'),
        product: product || null, source_page: `${pathname}${search}`.slice(0, 200),
      },
    };
  };

  const compose = (e) => {
    const topic = ENQUIRY_TOPICS.find(([id]) => id === e.topic)?.[1] ?? '';
    return [
      'Hello Cresta, I would like to make an enquiry.', '',
      `Name: ${e.name}`, e.company && `Company: ${e.company}`, `Phone: ${e.phone}`,
      e.email && `Email: ${e.email}`, e.city && `Location: ${e.city}`, `Interested in: ${topic}`, '',
      e.message,
    ].filter((l) => l !== null && l !== false && l !== undefined).join('\n');
  };

  const valid = () => {
    if (formRef.current.checkValidity()) return true;
    formRef.current.reportValidity();
    return false;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!valid() || status.state === 'saving') return;
    const { honeypot, enquiry } = read();
    if (honeypot) { setStatus({ state: 'ok', msg: 'Thank you — we have your enquiry.' }); return; }
    setStatus({ state: 'saving', msg: 'Sending…' });
    try {
      await submitEnquiry(enquiry, honeypot);
      formRef.current.reset();
      setStatus({ state: 'ok', msg: 'Thank you — your enquiry has reached our team. We’ll call you within working hours.', wa: waLink(settings.whatsapp, compose(enquiry)) });
    } catch (err) {
      console.warn('[cresta] enquiry not saved:', err.message);
      setStatus({
        state: 'error',
        msg: err.userMessage || 'We couldn’t send that just now. Please send it on WhatsApp instead — your message is ready.',
        wa: waLink(settings.whatsapp, compose(enquiry)),
      });
    }
  };

  const sendWhatsApp = () => {
    if (!valid()) return;
    window.open(waLink(settings.whatsapp, compose(read().enquiry)), '_blank', 'noopener');
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="f-name">Full name <span className="req">*</span></label>
          <input id="f-name" name="name" type="text" autoComplete="name" required maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="f-company">Company <span className="muted">(optional)</span></label>
          <input id="f-company" name="company" type="text" autoComplete="organization" maxLength={160} />
        </div>
        <div className="field">
          <label htmlFor="f-phone">Phone <span className="req">*</span></label>
          <input id="f-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required pattern="[0-9+\(\)\-\s]{7,30}" maxLength={30} />
        </div>
        <div className="field">
          <label htmlFor="f-email">Email</label>
          <input id="f-email" name="email" type="email" autoComplete="email" maxLength={200} />
        </div>
        <div className="field">
          <label htmlFor="f-city">City / site location</label>
          <input id="f-city" name="city" type="text" autoComplete="address-level2" maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="f-topic">I'm interested in <span className="req">*</span></label>
          <select id="f-topic" name="topic" required defaultValue={defaultTopic} key={defaultTopic}>
            <option value="">Select one…</option>
            {ENQUIRY_TOPICS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="f-message">Message <span className="req">*</span></label>
          <textarea id="f-message" name="message" required maxLength={4000} key={product}
            defaultValue={product ? `I'm interested in: ${product}\n\n` : ''}
            placeholder="Pool size, site details, products you need, or questions…" />
        </div>
        <div className="hp-field" aria-hidden="true">
          <label htmlFor="f-website">Website</label>
          <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={status.state === 'saving'}>
          {status.state === 'saving' ? 'Sending…' : 'Send enquiry'}
        </button>
        <button className="btn btn-wa" type="button" onClick={sendWhatsApp}><WhatsAppIcon />Send via WhatsApp</button>
      </div>
      <p className="form-note">Prefer to talk? Call <a href={`tel:${settings.phone_tel}`}>{settings.phone_display}</a> or email <a href={`mailto:${settings.email}`}>{settings.email}</a>.</p>
      {status.state !== 'idle' && status.state !== 'saving' && (
        <p className={`form-status${status.state === 'error' ? ' is-error' : ''}`} role="status">
          {status.msg}{' '}
          {status.wa && <a href={status.wa} target="_blank" rel="noopener noreferrer">{status.state === 'error' ? 'Open WhatsApp →' : 'Also chat on WhatsApp →'}</a>}
        </p>
      )}
    </form>
  );
}
