import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

// Absolute paths avoid a Windows path-normalization bug in multi-page input.
const r = p => fileURLToPath(new URL(p, import.meta.url))

// Build stamp shown in Settings → App Updates, so a user can confirm an update
// actually landed. Auto-bumps every build; injected via `define` below.
const BUILD_ID = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

export default defineConfig({
  // Served under /chord on the unified domain (Vercel multi-zone). All asset
  // URLs are emitted with this prefix so they resolve through the shell.
  base: '/chord/',
  // Replaced at build time (and in dev) wherever __BUILD_ID__ appears in source.
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  // Multi-page: the trainer (index.html) and the standalone chord editor
  // (editor.html), which share data/ and components/.
  build: {
    rollupOptions: {
      input: {
        main: r('./index.html'),
        editor: r('./editor.html'),
      },
    },
  },
  // No PWA plugin here: under the unified Fretworks origin the shell owns the
  // single service worker + manifest. Offline for /chord is handled by the
  // shell SW's runtime caching (see fretworks/sw.js).
  plugins: [
    react(),
  ],
})
