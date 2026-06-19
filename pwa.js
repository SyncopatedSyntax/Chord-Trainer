// ── Service worker registration + manual update ──────────────────────────
// vite-plugin-pwa provides the `virtual:pwa-register` module at build time.
// In dev (devOptions.enabled:false) registerSW is a no-op, so reloadApp() just
// reloads the page.
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(swUrl, reg) {
    if (!reg) return;
    const check = () => { reg.update().catch(() => {}); };
    // Re-check for a new deploy hourly while open, and whenever the user
    // returns to the tab/app — so updates are picked up without the button.
    setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    window.addEventListener('focus', check);
  },
});

// Reload exactly once when a new service worker takes control. Registered at
// module load (not inside the click handler) so it ALWAYS catches the event —
// the previous version added this listener mid-click and raced the activation,
// which is why Firefox often reloaded into the still-cached version.
let _reloading = false;
const reloadOnce = () => { if (_reloading) return; _reloading = true; window.location.reload(); };
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);
}

// "Update" button: force an update check now. If a new version is installing,
// the controllerchange listener above reloads once it activates (with a safety
// net in case that event never fires). If nothing new is found, reload anyway.
export async function reloadApp() {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update(); // fetch a fresh sw.js right now
        if (reg.installing || reg.waiting) {
          try { reg.waiting && reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch (e) {}
          try { updateSW(true); } catch (e) {}
          // Give the new worker time to install + activate; reload if the
          // controllerchange somehow doesn't arrive.
          setTimeout(reloadOnce, 6000);
          return;
        }
      }
    }
  } catch (e) {}
  reloadOnce(); // no update available (or no SW) — plain reload
}
