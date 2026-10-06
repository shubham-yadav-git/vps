import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles.css';

/** Hydrates prerendered HTML in production; renders from scratch in dev. */
export function mount(Page) {
  const root = document.getElementById('root');
  const app = <StrictMode><Page /></StrictMode>;
  if (root.firstElementChild) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
