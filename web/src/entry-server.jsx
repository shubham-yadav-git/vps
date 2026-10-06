import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import Home from './pages/Home';
import Disclosure from './pages/Disclosure';

const PAGES = { home: Home, disclosure: Disclosure };

/** Build-time prerender: renders a page with default content (no Firebase calls). */
export function render(page) {
  const Page = PAGES[page];
  return renderToString(<StrictMode><Page /></StrictMode>);
}
