import { useState } from 'react';
import { api } from '../api.js';

export function Login({ onDone }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true); setError('');
    try {
      const { user } = await api('/login', { method: 'POST', body: { username: fd.get('username'), password: fd.get('password') } });
      onDone(user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <img src="/brand/cresta-emblem.webp" alt="" width="247" height="240" />
        <h1>Cresta Admin</h1>
        <label>Username<input name="username" autoComplete="username" autoCapitalize="none" spellCheck="false" required autoFocus /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

export function ChangePassword({ onDone }) {
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (fd.get('next') !== fd.get('again')) { setMsg({ type: 'error', text: 'The new passwords do not match.' }); return; }
    setBusy(true); setMsg({ type: '', text: '' });
    try {
      await api('/password', { method: 'POST', body: { current: fd.get('current'), next: fd.get('next') } });
      form.reset();
      setMsg({ type: 'ok', text: 'Password changed. Other devices have been signed out.' });
      onDone?.();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit}>
      <label>Current password<input name="current" type="password" autoComplete="current-password" required /></label>
      <label>New password<input name="next" type="password" autoComplete="new-password" required minLength={10} /><small>At least 10 characters.</small></label>
      <label>Repeat new password<input name="again" type="password" autoComplete="new-password" required minLength={10} /></label>
      {msg.text && <p className={msg.type === 'error' ? 'error' : 'ok'} role="status">{msg.text}</p>}
      <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
    </form>
  );
}
