import { useEffect, useState } from 'react';
import { api } from '../api.js';

const GROUPS = [
  ['Contact details', [
    ['phone_display', 'Phone (as shown)'], ['phone_tel', 'Phone (for call links)', 'Digits with country code, for example +919552526371.'],
    ['landline', 'Landline'], ['whatsapp', 'WhatsApp number', 'With country code, for example 919552526371.'], ['email', 'Email'],
    ['office_address', 'Office address', '', 'area'], ['factory_address', 'Factory address', '', 'area'],
    ['hours_week', 'Working hours'], ['hours_sunday', 'Sunday hours'], ['branches', 'Regions served', 'Separate with commas.'],
  ]],
  ['SEO', [
    ['site_title', 'Site title', 'Used as the homepage title. Aim for 50 to 60 characters.', 'text', [50, 60]],
    ['site_description', 'Site description', 'Used as the homepage description. Aim for 150 to 160 characters.', 'area', [150, 160]],
    ['site_url', 'Website address', 'The live address, for example https://www.example.com. Used for the sitemap, canonical links and social sharing.'],
  ]],
  ['Google', [
    ['ga_id', 'Google Analytics Measurement ID', 'Looks like G-XXXXXXXXXX. Analytics starts as soon as this is saved.'],
    ['gsc_token', 'Search Console verification code', 'In Search Console choose the HTML tag method and paste only the content value.'],
  ]],
  ['Social links', [['facebook_url', 'Facebook'], ['instagram_url', 'Instagram'], ['linkedin_url', 'LinkedIn'], ['youtube_url', 'YouTube']]],
];

export default function Settings() {
  const [values, setValues] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/settings').then((d) => setValues(d.settings)).catch((e) => setMsg({ type: 'error', text: e.message })); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg({ type: '', text: '' });
    try {
      const keys = GROUPS.flatMap(([, fields]) => fields.map(([k]) => k));
      await api('/settings', { method: 'PUT', body: Object.fromEntries(keys.map((k) => [k, values[k] ?? ''])) });
      setMsg({ type: 'ok', text: 'Saved. The website is updated.' });
    } catch (err) { setMsg({ type: 'error', text: err.message }); } finally { setBusy(false); }
  };

  if (!values) return msg.text ? <p className="error" role="alert">{msg.text}</p> : <p>Loading…</p>;

  return (
    <form className="editor" onSubmit={submit}>
      <h1>Settings</h1>
      {GROUPS.map(([title, fields]) => (
        <section key={title}>
          <h2>{title}</h2>
          {fields.map(([key, label, hint, kind, range]) => (
            <label key={key}>{label}
              {kind === 'area'
                ? <textarea rows={2} value={values[key] ?? ''} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                : <input value={values[key] ?? ''} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />}
              {range && <small className={`counter ${(values[key] ?? '').length < range[0] || (values[key] ?? '').length > range[1] ? 'warn' : 'good'}`}>{(values[key] ?? '').length} characters</small>}
              {hint && <small>{hint}</small>}
            </label>
          ))}
        </section>
      ))}
      {msg.text && <p className={msg.type === 'error' ? 'error' : 'ok'} role="status">{msg.text}</p>}
      <div className="row save-row"><button className="btn primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></div>
    </form>
  );
}
