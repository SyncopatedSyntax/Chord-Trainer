import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // New SW skips waiting and claims clients automatically; our in-app
      // "Update" button (pwa.js → reloadApp) lets the user pull it in on demand.
      registerType: 'autoUpdate',
      // We register manually in pwa.js so we can expose updateSW() to the button.
      injectRegister: false,
      // The app generates and injects its own web manifest at runtime (canvas
      // icons + Blob), so the plugin must not emit a competing manifest.
      manifest: false,
      workbox: {
        // Precache the built app shell so it loads with no network.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      // No SW in `npm run dev`; virtual:pwa-register stays a no-op there.
      devOptions: { enabled: false },
    }),
  ],
})
