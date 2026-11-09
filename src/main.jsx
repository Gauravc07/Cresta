import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

const root = document.getElementById('root');
const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// The production server sends finished HTML; the Vite dev server sends an empty root.
if (root.firstElementChild) hydrateRoot(root, tree);
else createRoot(root).render(tree);
