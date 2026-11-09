import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { api, setUnauthorizedHandler } from './api.js';
import { ChangePassword, Login } from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Enquiries from './pages/Enquiries.jsx';
import { ResourceEditor, ResourceList } from './pages/Resources.jsx';
import Settings from './pages/Settings.jsx';
import Users from './pages/Users.jsx';
import { RESOURCES } from './resources.js';
import './admin.css';

const NAV = [
  ['/', 'Dashboard'], ['/enquiries', 'Enquiries'], ['/blogs', 'Blog'], ['/projects', 'Projects'],
  ['/testimonials', 'Testimonials'], ['/banners', 'Banners'], ['/products', 'Products'],
  ['/settings', 'Settings'], ['/users', 'Users'],
];

function Shell({ user, onLogout }) {
  return (
    <div className="shell">
      <aside className="side">
        <Link className="side-brand" to="/"><img src="/brand/cresta-emblem.webp" alt="" width="247" height="240" /><span>Cresta Admin</span></Link>
        <nav aria-label="Admin sections">
          {NAV.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
        </nav>
        <div className="side-foot">
          <a href="/" target="_blank" rel="noopener">View website ↗</a>
          <NavLink to="/password">Change password</NavLink>
          <button type="button" onClick={onLogout}>Sign out ({user.username})</button>
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/enquiries" element={<Enquiries />} />
          {Object.keys(RESOURCES).flatMap((name) => [
            <Route key={name} path={`/${name}`} element={<ResourceList name={name} />} />,
            <Route key={`${name}-new`} path={`/${name}/new`} element={<ResourceEditor key={`${name}-new`} name={name} />} />,
            <Route key={`${name}-edit`} path={`/${name}/:id`} element={<ResourceEditor key={`${name}-edit`} name={name} />} />,
          ])}
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<Users />} />
          <Route path="/password" element={<div className="narrow"><h1>Change password</h1><ChangePassword /></div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    api('/me').then((r) => setUser(r.user)).catch(() => setUser(null));
  }, []);

  const logout = async () => { await api('/logout', { method: 'POST' }).catch(() => {}); setUser(null); };

  if (user === undefined) return <p className="center-note">Loading…</p>;
  if (!user) return <Login onDone={setUser} />;
  if (user.must_change_password) {
    return (
      <div className="auth">
        <div className="auth-card">
          <img src="/brand/cresta-emblem.webp" alt="" width="247" height="240" />
          <h1>Set a new password</h1>
          <p>You signed in with a temporary password. Choose your own to continue.</p>
          <ChangePassword onDone={() => setUser({ ...user, must_change_password: false })} />
          <button className="link" type="button" onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  }
  return <Shell user={user} onLogout={logout} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/admin">
      <App />
    </BrowserRouter>
  </StrictMode>,
);
