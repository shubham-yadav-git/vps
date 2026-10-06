import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const here = import.meta.dirname;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Hashed build output, kept apart from the static files in public/assets
    assetsDir: '_app',
    rollupOptions: {
      input: {
        main: resolve(here, 'index.html'),
        disclosure: resolve(here, 'mandatory-public-disclosure.html'),
        admin: resolve(here, 'admin.html'),
      },
    },
  },
});
