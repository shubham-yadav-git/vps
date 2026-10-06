import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './admin/AdminApp';
import './styles.css';

// The admin is client-only (no prerender): it needs a signed-in user
createRoot(document.getElementById('root')).render(<StrictMode><AdminApp /></StrictMode>);
