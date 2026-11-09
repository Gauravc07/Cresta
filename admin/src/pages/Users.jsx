import { useEffect, useState } from 'react';
import { api, fmtDate } from '../api.js';

export default function Users() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [temp, setTemp] = useState(null);

  const load = () => api('/users').then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(''); setTemp(null);
    try {
      const res = await api('/users', { method: 'POST', body: { username: fd.get('username'), name: fd.get('name') } });
      form.reset();
      setTemp({ username: res.row.username, password: res.temp_password });
      load();
    } catch (err) { setError(err.message); }
  };

  const toggle = async (u) => {
    if (u.is_active && !window.confirm(`Disable ${u.username}? They will be signed out straight away.`)) return;
    setError('');
    try { await api(`/users/${u.id}`, { method: 'PATCH', body: { is_active: !u.is_active } }); load(); } catch (err) { setError(err.message); }
  };

  const reset = async (u) => {
    if (!window.confirm(`Reset the password for ${u.username}? They will be signed out.`)) return;
    setError(''); setTemp(null);
    try {
      const res = await api(`/users/${u.id}`, { method: 'PATCH', body: { reset_password: true } });
      setTemp({ username: u.username, password: res.temp_password });
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <>
      <h1>Users</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {temp && (
        <div className="notice" role="status">
          <strong>Temporary password for {temp.username}:</strong> <code>{temp.password}</code>
          <p>Copy it now, because it will not be shown again. They must change it when they first sign in.</p>
        </div>
      )}
      {data && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Username</th><th>Status</th><th>Last sign-in</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {data.rows.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td><td>{u.username}</td>
                  <td>{u.is_active ? 'Active' : 'Disabled'}</td>
                  <td>{u.last_login_at ? fmtDate(u.last_login_at) : 'Never'}</td>
                  <td className="row-actions">
                    {u.id === data.me ? <span className="muted">You</span> : (
                      <>
                        <button className="link" type="button" onClick={() => reset(u)}>Reset password</button>
                        <button className="link danger" type="button" onClick={() => toggle(u)}>{u.is_active ? 'Disable' : 'Enable'}</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2>Add an admin</h2>
      <form className="editor" onSubmit={add}>
        <label>Full name<input name="name" required maxLength={120} /></label>
        <label>Username<input name="username" required pattern="[a-z0-9._\-]{3,40}" autoCapitalize="none" spellCheck="false" /><small>Lowercase letters, numbers, dots or hyphens.</small></label>
        <div className="row save-row"><button className="btn primary" type="submit">Create admin</button></div>
      </form>
    </>
  );
}
