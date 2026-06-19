# Reusable recipe: true-offline PWA + reliable in-app update

A portable pattern for making a web app work offline **and** update reliably across
browsers (including Firefox), with an in-app "Update" button. Extracted from ChordTrainer.

The one-paragraph mental model: **a cache-first PWA always serves the cached app shell, so
"updating" means swapping the service worker — not just reloading. Register the
reload-on-activation listener once, force an update check, and let that listener reload you;
don't reload on a timer.**

---

## Paste this to Claude in a new project

> **Set up this web app as a true offline PWA with a reliable in-app update button.**
>
> Requirements:
> 1. **Offline:** precache the built app shell so it loads with no network. (If Vite, use
>    `vite-plugin-pwa` with Workbox; otherwise an equivalent service worker.)
> 2. **Auto-update:** `registerType: 'autoUpdate'` — a new deploy's SW skips waiting and
>    claims clients.
> 3. **Reliable manual update:** an in-app "Update" button that forces a fresh check and
>    reloads into the new version in a single press, cross-browser (must work in Firefox,
>    not just Safari/Chrome).
> 4. **"Updating…" indicator:** the button shows a spinner/disabled state while it works.
>
> Critical implementation details (the things usually done wrong):
> - Register the `controllerchange → reload` listener **once at module load**, not inside the
>   click handler — adding it per-click races SW activation and reloads into the stale cache
>   (the classic "I have to hard-reload" bug, worst in Firefox).
> - The update function should `await registration.update()`, and if a new worker is
>   installing/waiting, let the global `controllerchange` listener do the reload, with a ~6s
>   safety-net timeout. Only do a plain reload when there's genuinely no update.
> - Re-check for updates on `visibilitychange`/`focus`, so returning to the tab after a deploy
>   pulls the new version without the button.
> - **Register the SW from every HTML entry point** the user can open directly (e.g. a
>   multi-page build), or that page never updates its cache.
> - Note that the update only takes effect after the user loads the new build once
>   (hard-reload), because the fix ships *inside* the new version.
>
> Keep the service worker script served with `Cache-Control: max-age=0, must-revalidate`
> (most hosts like Vercel default to this — verify).

---

## Reference implementation (Vite + `vite-plugin-pwa`)

### `vite.config.js`
```js
import { VitePWA } from 'vite-plugin-pwa'
// ...inside plugins:
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: false,          // we register manually to expose an update fn
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
    navigateFallback: 'index.html',
    cleanupOutdatedCaches: true,
  },
  devOptions: { enabled: false }, // no SW in dev
})
```

### `pwa.js` — import it from *every* entry (e.g. `main.jsx` and any other page entry)
```js
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(url, reg) {
    if (!reg) return;
    const check = () => reg.update().catch(() => {});
    setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
    window.addEventListener('focus', check);
  },
});

// Register ONCE at module load — the key to cross-browser reliability.
let _reloading = false;
const reloadOnce = () => { if (_reloading) return; _reloading = true; window.location.reload(); };
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);

export async function reloadApp() {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.installing || reg.waiting) {
          try { reg.waiting?.postMessage({ type: 'SKIP_WAITING' }); } catch {}
          try { updateSW(true); } catch {}
          setTimeout(reloadOnce, 6000); // safety net
          return;
        }
      }
    }
  } catch {}
  reloadOnce();
}
```

### Update button (React) — `import { reloadApp } from './pwa.js'`
```jsx
const [updating, setUpdating] = useState(false);
const onUpdate = async () => {
  if (updating) return;
  setUpdating(true);
  try { await reloadApp(); } catch {}
  setTimeout(() => setUpdating(false), 7000); // revert if nothing reloaded
};

// <button onClick={onUpdate} disabled={updating}>
//   <span className={updating ? 'ct-spin' : ''}>↻</span> {updating ? 'Updating…' : 'Update'}
// </button>
```

```css
@keyframes ct-spin { to { transform: rotate(360deg); } }
.ct-spin { display: inline-block; animation: ct-spin .8s linear infinite; }
```

---

## Gotchas checklist

- [ ] SW registered from **every** directly-openable page (multi-page apps).
- [ ] `controllerchange` listener attached **once at load**, not per click.
- [ ] Update button **awaits `reg.update()`** and lets the listener reload (timeout is only a
      safety net).
- [ ] Update re-checked on focus/visibility.
- [ ] First adoption of the fix needs **one hard-reload** (it ships inside the new build).
- [ ] `sw.js` served `max-age=0, must-revalidate` (verify host headers).
- [ ] Multi-page Vite `rollupOptions.input` uses **absolute paths** on Windows
      (`fileURLToPath(new URL('./x.html', import.meta.url))`) to avoid a path-normalization bug.
- [ ] If the app injects its own web manifest at runtime, set `manifest: false` so the plugin
      doesn't emit a competing one.
