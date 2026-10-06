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

for (const { file, page } of PAGES) {
  const path = resolve(root, 'dist', file);
  const html = readFileSync(path, 'utf8');
  if (!html.includes('<!--app-html-->')) throw new Error(`${file} is missing the <!--app-html--> placeholder`);
  writeFileSync(path, html.replace('<!--app-html-->', render(page)));
  console.log(`prerendered ${file}`);
}

rmSync(resolve(root, 'dist-ssr'), { recursive: true, force: true });
