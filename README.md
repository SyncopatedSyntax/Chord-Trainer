# 🎸 ChordTrainer

A guitar chord-trainer PWA: learn, drill, and internalise chord shapes, scale degrees,
and progressions — with spaced repetition, quizzes, audio, and a fretboard-aware library
of 200+ voicings. Ships with a separate **no-code chord editor** for maintaining the data.

**Live app:** https://chord-trainer-mauve.vercel.app
**Chord editor:** https://chord-trainer-mauve.vercel.app/editor.html

---

## Features

### Trainer
- **Today / Spaced Repetition** — an SM-2 (Anki-style) scheduler surfaces a daily set of
  chords plus a "Progression of the Day". Mark each "Got it" to update its interval.
- **Library** — browse every voicing with two complementary filters:
  - **Family** — 7 mutually-exclusive sonic families (Major, Dominant, Minor, Half-dim,
    Dim, Aug, Sus).
  - **Builder** — construct a target chord additively: triad base → optional 7th →
    optional color tones, with a live "what chord is this" label.
- **Quiz** — Name→Shape, Shape→Name, or mixed; plus a **Scale-Degree** trainer where you
  tap the dot matching a requested degree.
- **Weak spots** — automatically tracks chords and degree+chord combos you miss, with a
  one-tap drill.
- **Progressions** — a large library of progressions across genres, transposable to any
  key, with an optional open-position ("cowboy") voicing mode.
- **Scale-degree colouring** — every diagram dot can be colour-coded by harmonic function.
- **Audio** — Web Audio pluck synthesis (strum or arpeggio) for every voicing.
- **Offline PWA** — installable, works offline (service worker via `vite-plugin-pwa`), with
  an in-app **Update** button (Guide tab) to pull new versions.
- **Backup** — export/import all progress as JSON.

### Chord editor (`/editor.html`)
A standalone, no-code tool for maintaining the chord data:
- Build a shape on a per-string fretboard and mark the root.
- **Scale degrees auto-derive from the shape** — no hand-typed degree arrays, which
  eliminates a whole class of data error. Ambiguous spellings (e.g. ♭3/♯9, ♯5/♭13) use a
  per-string dropdown.
- Live diagram + audio preview, live validation (won't save an inconsistent shape), and
  add / duplicate / delete / search / filter.
- Reads and writes `data/chords.json` directly via the File System Access API
  (desktop Chrome/Edge), with a download/import fallback elsewhere.
- A **How to publish** tab explains turning an edit into a live change.

---

## Tech stack

- **React 18** + **Vite 4** (multi-page build: trainer + editor)
- **vite-plugin-pwa** (Workbox) for offline support
- **Web Audio API** for sound — no audio assets
- No backend, no database — all state lives in `localStorage`; chord data is static JSON

---

## Getting started

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install      # install dependencies
npm run dev      # dev server — trainer at /, editor at /editor.html
npm run build    # production build to dist/ (emits index.html + editor.html)
npm run preview  # serve the production build locally
```

> Offline/service-worker behaviour is disabled in `dev`; test it with `build` + `preview`.

---

## Project structure

```
index.html            Trainer HTML entry
main.jsx              Trainer mount
App.jsx               The entire trainer UI (tabs, quizzes, SRS, library, progressions)
pwa.js               Service-worker registration + the in-app "Update" helper

editor.html           Editor HTML entry
editor.jsx           Editor mount
editor/Editor.jsx    The no-code chord editor
editor/audio.js      Editor's audio preview

components/
  ChordDiagram.jsx   Shared fretboard SVG (used by both apps)
data/
  chords.json        All chord voicings (the single source of chord data)
  theory.js          Shared constants + helpers (degree math, validation, derivation)

vite.config.js        Multi-page input + PWA config
```

---

## Chord data model

Each chord in `data/chords.json` looks like:

```json
{
  "id": "cC",
  "name": "C Major",
  "sym": "C",
  "cat": "cowboy",
  "voicings": [
    { "label": "Open", "str": [-1, 3, 2, 0, 1, 0], "deg": [null, "R", "3", "5", "R", "3"], "sf": 1 }
  ]
}
```

- **`str`** — fret per string, low-E to high-e. `-1` = muted, `0` = open, `n` = fret `n`.
- **`deg`** — scale degree per string (parallel to `str`); `null` where muted.
- **`sf`** — start fret shown on the diagram.
- **`movable`** (optional) — `true` for transposable shapes with no open strings.
- **`cat`** — voicing-technique category: `cowboy`, `triad`, `barre`, `shell`, `drop2`,
  `drop3`, `drop24`, `spread`, `quartal`, `ext`, `altered`.

`data/theory.js` derives degrees from a shape + root and validates that every labeled
degree matches the pitch the fret actually produces — so the data stays internally
consistent. The editor uses these helpers so new chords can't be entered with a wrong note.

---

## Editing the chord library

1. Open the **editor** (`/editor.html`), add/edit chords.
2. **Save / Download** the updated `data/chords.json` (desktop Chrome/Edge can write it in
   place via *Open file…* → *Save file*).
3. Commit it to the repo and push to `main`.
4. Vercel redeploys automatically; the live app serves the new chords.

The editor's **How to publish** tab walks through this in-app.

---

## Deployment

Hosted on **Vercel** with automatic deploys from the `main` branch (Vite preset). Pushing to
`main` builds and publishes both the trainer and the editor.

---

## Credits

Made with 🎸 by **Zak** ([@SyncopatedSyntax](https://github.com/SyncopatedSyntax)).
If it's useful, you can [buy me a coffee](https://ko-fi.com/syncopatedsyntax) ☕.
