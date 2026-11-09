import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Markdown } from '../../../src/lib/markdown.jsx';
import { api, fmtDate, slugify, uploadImage } from '../api.js';
import { RESOURCES } from '../resources.js';

function Cell({ row, column: [key, , kind] }) {
  const v = row[key];
  switch (kind) {
    case 'badge': return <span className={`badge ${v}`}>{v}</span>;
    case 'bool': return v ? 'Yes' : 'No';
    case 'date': return v ? fmtDate(v) : '—';
    case 'count': return v?.length ?? 0;
    case 'stars': return `${v} / 5`;
    case 'clip': return <span className="clip">{v}</span>;
    case 'thumb': return v ? <img className="thumb" src={v} alt="" /> : '—';
    default: return v ?? '—';
  }
}

export function ResourceList({ name }) {
  const def = RESOURCES[name];
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const load = () => api(`/r/${name}`).then((d) => setRows(d.rows)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (row) => {
    const label = row.title ?? row.name;
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    try { await api(`/r/${name}/${encodeURIComponent(row.id)}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <>
      <div className="head-row">
        <h1>{def.title}</h1>
        <Link className="btn primary" to={`/${name}/new`}>Add {def.singular}</Link>
      </div>
      {def.intro && <p className="muted">{def.intro}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {rows && !rows.length && <p className="muted">Nothing here yet.</p>}
      {rows && rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr>{def.columns.map(([key, label]) => <th key={key}>{label}</th>)}<th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {def.columns.map((c) => <td key={c[0]}><Cell row={r} column={c} /></td>)}
                  <td className="row-actions">
                    <Link to={`/${name}/${encodeURIComponent(r.id)}`}>Edit</Link>
                    <button className="link danger" type="button" onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ImageField({ field, value, alt, onChange, onAlt }) {
  const [msg, setMsg] = useState('');
  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMsg('Uploading…');
    try { onChange(await uploadImage(file)); setMsg(''); } catch (err) { setMsg(err.message); }
  };
  return (
    <fieldset className="image-field">
      <legend>{field.label}{field.required ? ' *' : ''}</legend>
      {value && <img src={value} alt="" />}
      <div className="row">
        <label className="btn">Upload image<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /></label>
        {value && <button className="link danger" type="button" onClick={() => onChange('')}>Remove</button>}
        {msg && <span role="status">{msg}</span>}
      </div>
      {field.hint && <small>{field.hint}</small>}
      {field.altField && (
        <label>Image description (for Google and screen readers)
          <input value={alt ?? ''} maxLength={200} onChange={(e) => onAlt(e.target.value)} placeholder="For example: one-piece FRP pool at a villa in Pune" />
        </label>
      )}
    </fieldset>
  );
}

function GalleryField({ field, value = [], onChange }) {
  const [msg, setMsg] = useState('');
  const upload = async (e) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    let next = value;
    try {
      for (const [i, f] of files.entries()) {
        setMsg(`Uploading ${i + 1} of ${files.length}…`);
        next = [...next, { src: await uploadImage(f), alt: '' }];
        onChange(next);
      }
      setMsg('');
    } catch (err) { setMsg(err.message); }
  };
  const update = (i, patch) => onChange(value.map((img, n) => (n === i ? { ...img, ...patch } : img)));
  const move = (i, d) => {
    const copy = [...value];
    const [item] = copy.splice(i, 1);
    copy.splice(i + d, 0, item);
    onChange(copy);
  };
  return (
    <fieldset className="image-field">
      <legend>{field.label}</legend>
      <div className="gallery-edit">
        {value.map((img, i) => (
          <div key={img.src}>
            <img src={img.src} alt="" />
            <label>Description<input value={img.alt ?? ''} maxLength={200} onChange={(e) => update(i, { alt: e.target.value })} /></label>
            <div className="row">
              <button className="link" type="button" disabled={i === 0} onClick={() => move(i, -1)}>← Earlier</button>
              <button className="link" type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)}>Later →</button>
              <button className="link danger" type="button" onClick={() => onChange(value.filter((_, n) => n !== i))}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="row">
        <label className="btn">Add images<input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={upload} /></label>
        {msg && <span role="status">{msg}</span>}
      </div>
    </fieldset>
  );
}

function MarkdownField({ field, value = '', onChange }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState('');

  const wrap = (before, after = '', placeholder = 'text') => {
    const el = ref.current;
    const start = el.selectionStart; const end = el.selectionEnd;
    const picked = value.slice(start, end) || placeholder;
    onChange(value.slice(0, start) + before + picked + after + value.slice(end));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + before.length, start + before.length + picked.length); });
  };
  const addImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMsg('Uploading…');
    try {
      const url = await uploadImage(file);
      onChange(`${value}\n\n![Describe this image](${url})\n`);
      setMsg('');
    } catch (err) { setMsg(err.message); }
  };

  return (
    <div className="field md-field">
      <div className="md-bar">
        <span>{field.label}</span>
        <div className="row" role="toolbar" aria-label="Formatting">
          <button type="button" onClick={() => wrap('\n## ', '\n', 'Heading')}>Heading</button>
          <button type="button" onClick={() => wrap('\n### ', '\n', 'Subheading')}>Subheading</button>
          <button type="button" onClick={() => wrap('**', '**', 'bold')}>Bold</button>
          <button type="button" onClick={() => wrap('*', '*', 'italic')}>Italic</button>
          <button type="button" onClick={() => wrap('\n- ', '\n', 'list item')}>List</button>
          <button type="button" onClick={() => wrap('[', '](/contact)', 'link text')}>Link</button>
          <label>Image<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={addImage} /></label>
          <button type="button" aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? 'Edit' : 'Preview'}</button>
        </div>
      </div>
      {msg && <span role="status">{msg}</span>}
      {preview
        ? <div className="md-preview"><Markdown source={value} /></div>
        : <textarea ref={ref} aria-label={field.label} rows={18} value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

function Counter({ value = '', range: [min, max] }) {
  const n = value.length;
  const state = !n ? '' : n < min || n > max ? 'warn' : 'good';
  return <small className={`counter ${state}`}>{n} characters (aim for {min} to {max})</small>;
}

export function ResourceEditor({ name }) {
  const def = RESOURCES[name];
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [row, setRow] = useState(isNew ? { ...def.defaults } : null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isNew) api(`/r/${name}/${encodeURIComponent(id)}`).then((d) => setRow(d.row)).catch((e) => setError(e.message));
    if (def.fields.some((f) => f.type === 'category')) api('/categories').then((d) => setCategories(d.rows)).catch(() => {});
  }, [name, id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!row) return error ? <p className="error" role="alert">{error}</p> : <p>Loading…</p>;

  const set = (key, value) => setRow((r) => {
    const next = { ...r, [key]: value };
    const slugField = def.fields.find((f) => f.type === 'slug' && f.from === key);
    if (slugField && !slugTouched) next[slugField.name] = slugify(value);
    return next;
  });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setSaved('');
    try {
      const body = Object.fromEntries(def.fields.map((f) => [f.name, row[f.name]]));
      const res = isNew
        ? await api(`/r/${name}`, { method: 'POST', body })
        : await api(`/r/${name}/${encodeURIComponent(id)}`, { method: 'PUT', body });
      if (isNew) { navigate(`/${name}/${encodeURIComponent(res.row.id)}`, { replace: true }); return; }
      setRow(res.row);
      setSaved('Saved. The website is updated.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const publicPath = !isNew && def.publicPath?.(row);

  return (
    <form className="editor" onSubmit={submit}>
      <div className="head-row">
        <h1>{isNew ? `Add ${def.singular}` : `Edit ${def.singular}`}</h1>
        <Link to={`/${name}`}>Back to list</Link>
      </div>
      {def.fields.map((f) => {
        const v = row[f.name];
        return (
          <div key={f.name}>
            {f.section && <h2>{f.section}</h2>}
            {f.type === 'image' && <ImageField field={f} value={v} alt={f.altField ? row[f.altField] : undefined} onChange={(x) => set(f.name, x)} onAlt={(x) => set(f.altField, x)} />}
            {f.type === 'gallery' && <GalleryField field={f} value={v} onChange={(x) => set(f.name, x)} />}
            {f.type === 'markdown' && <MarkdownField field={f} value={v ?? ''} onChange={(x) => set(f.name, x)} />}
            {f.type === 'bool' && <label className="check"><input type="checkbox" checked={!!v} onChange={(e) => set(f.name, e.target.checked)} />{f.label}</label>}
            {f.type === 'select' && (
              <label>{f.label}
                <select value={v ?? ''} onChange={(e) => set(f.name, f.numeric ? Number(e.target.value) : e.target.value)}>
                  {f.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </label>
            )}
            {f.type === 'category' && (
              <label>{f.label} *
                <select required value={v ?? ''} onChange={(e) => set(f.name, e.target.value)}>
                  <option value="">Choose…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            )}
            {f.type === 'slug' && (
              <label>{f.label}{f.required ? ' *' : ''}
                <span className="prefixed"><span>{f.prefix}</span>
                  <input required={f.required} disabled={f.createOnly && !isNew} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} value={v ?? ''}
                    onChange={(e) => { setSlugTouched(true); setRow((r) => ({ ...r, [f.name]: e.target.value })); }} />
                </span>
                {!isNew && !f.createOnly && <small>If you change this on a live page, the old address redirects to the new one.</small>}
              </label>
            )}
            {f.type === 'number' && <label>{f.label}<input type="number" min={0} max={9999} value={v ?? 0} onChange={(e) => set(f.name, Number(e.target.value))} />{f.hint && <small>{f.hint}</small>}</label>}
            {f.type === 'textarea' && (
              <label>{f.label}{f.required ? ' *' : ''}
                <textarea required={f.required} maxLength={f.maxLength} rows={f.rows ?? 3} value={v ?? ''} onChange={(e) => set(f.name, e.target.value)} />
                {f.counter && <Counter value={v ?? ''} range={f.counter} />}
                {f.hint && <small>{f.hint}</small>}
              </label>
            )}
            {!f.type && (
              <label>{f.label}{f.required ? ' *' : ''}
                <input required={f.required} maxLength={f.maxLength} value={v ?? ''} list={f.suggestions ? `${f.name}-list` : undefined} onChange={(e) => set(f.name, e.target.value)} />
                {f.suggestions && <datalist id={`${f.name}-list`}>{f.suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
                {f.counter && <Counter value={v ?? ''} range={f.counter} />}
                {f.hint && <small>{f.hint}</small>}
              </label>
            )}
          </div>
        );
      })}
      {error && <p className="error" role="alert">{error}</p>}
      {saved && <p className="ok" role="status">{saved}</p>}
      <div className="row save-row">
        <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        {publicPath && <a href={publicPath} target="_blank" rel="noopener">View on website ↗</a>}
      </div>
    </form>
  );
}
