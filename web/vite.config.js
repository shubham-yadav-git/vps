import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const here = import.meta.dirname;
const repoRoot = resolve(here, '..');

// Files from the existing static site that ship unchanged with the React build.
// admin.html keeps working as-is until it is ported in a later pass.
const LEGACY_FILES = [
  'assets',
  'admin.html',
  'js/security-utils.js',
  'js/auth-utils.js',
  'js/fixed-save-handler.js',
  'manifest.json',
  'robots.txt',
  'sitemap.xml',
  '404.html',
];

function copyLegacyFiles() {
  let outDir;
  let isSsrBuild = false;
  return {
    name: 'copy-legacy-files',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
      isSsrBuild = Boolean(config.build.ssr);
    },
    closeBundle() {
      if (isSsrBuild) return;
      for (const file of LEGACY_FILES) {
        const from = resolve(repoRoot, file);
        if (existsSync(from)) {
          cpSync(from, resolve(outDir, file), { recursive: true });
        }
      }
    },
  };
}

// In dev, serve the legacy files straight from the repo root
function serveLegacyFiles() {
  return {
    name: 'serve-legacy-files',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\//, '');
        const match = LEGACY_FILES.some(f => path === f || path.startsWith(f + '/'));
        if (match && existsSync(resolve(repoRoot, path))) {
          req.url = '/@fs/' + resolve(repoRoot, path);
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyLegacyFiles(), serveLegacyFiles()],
  server: {
    fs: { allow: [repoRoot] },
  },
  build: {
    // Keep Vite's hashed output apart from the legacy assets/ folder copied in above
    assetsDir: '_app',
    rollupOptions: {
      input: {
        main: resolve(here, 'index.html'),
        disclosure: resolve(here, 'mandatory-public-disclosure.html'),
      },
    },
  },
});
