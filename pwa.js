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

// Called by the in-app "Update" button. Forces a network check for a new
// service worker NOW, waits for it to take control if one is found, then
// reloads — so a single tap reliably pulls the latest deploy (instead of
// reloading into the still-cached version on the first try).
export async function reloadApp() {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update(); // hit the network for a fresh sw.js right now
        if (reg.installing || reg.waiting) {
          // A new version is downloading/ready — let it activate, then the
          // controllerchange (or our timeout) lets us reload into it.
          await new Promise(resolve => {
            navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
            try { updateSW(true); } catch (e) {}
            setTimeout(resolve, 3000); // safety net if nothing fires
          });
        }
      }
    }
  } catch (e) {}
  try { window.location.reload(); } catch (e) {}
}
