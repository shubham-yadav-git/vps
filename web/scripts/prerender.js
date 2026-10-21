// Injects server-rendered HTML into the built pages so content is visible
// before JavaScript runs and readable by search engines.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { render } = await import(pathToFileURL(resolve(root, 'dist-ssr/entry-server.js')).href);

const PAGES = [
  { file: 'index.html', page: 'home' },
  { file: 'mandatory-public-disclosure.html', page: 'disclosure' },
];

// Site & SEO settings from the admin panel, read through Firestore's public REST API.
// Any failure keeps the title and description written in index.html.
async function fetchSeo() {
  const url = 'https://firestore.googleapis.com/v1/projects/vpschool-918d6/databases/(default)/documents/settings/site';
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return {};
    const fields = (await response.json()).fields || {};
    const text = key => String(fields[key]?.stringValue || '').trim();
    return { title: text('seoTitle'), description: text('seoDescription') };
  } catch (error) {
    console.warn(`Could not fetch SEO settings, keeping the defaults (${error.message})`);
    return {};
  }
}

const escapeHtml = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function applySeo(html, { title, description }) {
  let out = html;
  if (title) {
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(title)}$2`);
  }
  if (description) {
    out = out.replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`);
  }
  return out;
}

const seo = process.env.SKIP_SEO_FETCH ? {} : await fetchSeo();

for (const { file, page } of PAGES) {
  const path = resolve(root, 'dist', file);
  let html = readFileSync(path, 'utf8');
  if (!html.includes('<!--app-html-->')) throw new Error(`${file} is missing the <!--app-html--> placeholder`);
  html = html.replace('<!--app-html-->', render(page));
  if (page === 'home') html = applySeo(html, seo);
  writeFileSync(path, html);
  console.log(`prerendered ${file}${page === 'home' && (seo.title || seo.description) ? ' (with Site & SEO settings)' : ''}`);
}

rmSync(resolve(root, 'dist-ssr'), { recursive: true, force: true });
