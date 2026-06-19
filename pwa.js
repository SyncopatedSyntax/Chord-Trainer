// ── Service worker registration + manual update ──────────────────────────
// vite-plugin-pwa provides the `virtual:pwa-register` module at build time.
// In dev (devOptions.enabled:false) registerSW is a no-op, so reloadApp() just
// reloads the page.
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(swUrl, reg) {
    // While the app stays open, check for a new deployment hourly so the
    // "Update" button has a freshly-downloaded version waiting to activate.
    if (reg) setInterval(() => { reg.update().catch(() => {}); }, 60 * 60 * 1000);
  },
});

// Called by the in-app "Update" button. Activates any waiting service worker
// (which triggers a reload via vite-plugin-pwa), and falls back to a plain
// reload when there is no waiting worker so the button always refreshes.
export function reloadApp() {
  try { updateSW(true); } catch (e) {}
  setTimeout(() => { try { window.location.reload(); } catch (e) {} }, 500);
}
