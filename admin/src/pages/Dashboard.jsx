import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate } from '../api.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/dashboard').then(setData).catch((e) => setError(e.message)); }, []);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p>Loading…</p>;
  const c = data.counts;
  const cards = [
    ['/enquiries', 'Total enquiries', c.enquiries, `${c.new_enquiries} new`],
    ['/blogs', 'Total blogs', c.blogs, `${c.published_blogs} published`],
    ['/projects', 'Total projects', c.projects, ''],
    ['/testimonials', 'Testimonials', c.testimonials, ''],
  ];

  return (
    <>
      <h1>Dashboard</h1>
      <div className="stats">
        {cards.map(([to, label, n, sub]) => (
          <Link className="stat" to={to} key={label}><span>{label}</span><strong>{n}</strong><small>{sub}</small></Link>
        ))}
      </div>
      <div className="head-row"><h2>Latest enquiries</h2><Link to="/enquiries">View all</Link></div>
      {data.recent.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Interested in</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {data.recent.map((e) => (
                <tr key={e.id}><td>{e.name}</td><td><a href={`tel:${e.phone}`}>{e.phone}</a></td><td>{e.topic}</td><td><span className={`badge ${e.status}`}>{e.status}</span></td><td>{fmtDate(e.created_at)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="muted">No enquiries yet. Submissions from the website's contact form appear here.</p>}
      <h2>Backup</h2>
      <p className="muted">The server saves a backup every night and keeps the latest 14. You can also download all content, enquiries and uploaded images now. The file contains customer details, so store it safely.</p>
      <a className="btn" href="/api/admin/backup" download>Download backup</a>
    </>
  );
}
