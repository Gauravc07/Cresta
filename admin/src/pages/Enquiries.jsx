import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate } from '../api.js';

const STATUSES = [['new', 'New'], ['contacted', 'Contacted'], ['closed', 'Closed']];

function Detail({ row, onSaved }) {
  const [status, setStatus] = useState(row.status);
  const [notes, setNotes] = useState(row.notes ?? '');
  const [msg, setMsg] = useState('');

  const save = async () => {
    setMsg('Saving…');
    try {
      const { row: updated } = await api(`/enquiries/${row.id}`, { method: 'PATCH', body: { status, notes } });
      setMsg('Saved.');
      onSaved(updated);
    } catch (err) { setMsg(err.message); }
  };

  return (
    <div className="lead-detail">
      <dl>
        <div><dt>Phone</dt><dd><a href={`tel:${row.phone}`}>{row.phone}</a></dd></div>
        {row.email && <div><dt>Email</dt><dd><a href={`mailto:${row.email}`}>{row.email}</a></dd></div>}
        {row.company && <div><dt>Company</dt><dd>{row.company}</dd></div>}
        {row.city && <div><dt>Location</dt><dd>{row.city}</dd></div>}
        <div><dt>Interested in</dt><dd>{row.topic}{row.product ? ` · ${row.product}` : ''}</dd></div>
        {row.source_page && <div><dt>Sent from</dt><dd>{row.source_page}</dd></div>}
      </dl>
      <p className="lead-message">{row.message}</p>
      <div className="lead-actions">
        <label>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="grow">Notes (private)<textarea rows={2} value={notes} maxLength={4000} onChange={(e) => setNotes(e.target.value)} /></label>
        <button className="btn primary" type="button" onClick={save}>Save</button>
        {msg && <span role="status">{msg}</span>}
      </div>
    </div>
  );
}

export default function Enquiries() {
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams({ page });
    if (filter) params.set('status', filter);
    if (q.trim()) params.set('q', q.trim());
    return api(`/enquiries?${params}`).then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message));
  }, [filter, q, page]);

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;
  const pages = data ? Math.ceil(data.total / data.size) : 0;
  const choose = (s) => { setFilter(s); setPage(0); setOpen(null); };

  return (
    <>
      <h1>Enquiries</h1>
      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Filter by status">
          <button type="button" aria-pressed={!filter} onClick={() => choose('')}>All ({total})</button>
          {STATUSES.map(([v, l]) => <button type="button" key={v} aria-pressed={filter === v} onClick={() => choose(v)}>{l} ({data?.counts[v] ?? 0})</button>)}
        </div>
        <input type="search" aria-label="Search enquiries" placeholder="Search name, phone, email or message" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {data && !data.rows.length && <p className="muted">No enquiries found.</p>}
      {data && data.rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Message</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {data.rows.map((r) => (
                <FragmentRow key={r.id} row={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)}
                  onSaved={(updated) => {
                    // Show the saved status straight away, then refresh the counts.
                    setData((d) => ({ ...d, rows: d.rows.map((x) => (x.id === updated.id ? updated : x)) }));
                    load();
                  }} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="pager">
          <button className="btn" type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page + 1} of {pages}</span>
          <button className="btn" type="button" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </>
  );
}

function FragmentRow({ row, open, onToggle, onSaved }) {
  return (
    <>
      <tr>
        <td><button className="link" type="button" aria-expanded={open} onClick={onToggle}>{row.name}</button></td>
        <td><a href={`tel:${row.phone}`}>{row.phone}</a></td>
        <td>{row.email ? <a href={`mailto:${row.email}`}>{row.email}</a> : '—'}</td>
        <td className="clip">{row.message}</td>
        <td className="nowrap">{fmtDate(row.created_at)}</td>
        <td><span className={`badge ${row.status}`}>{row.status}</span></td>
      </tr>
      {open && <tr className="detail-row"><td colSpan={6}><Detail row={row} onSaved={onSaved} /></td></tr>}
    </>
  );
}
