# Chord Trainer — project context

A single-file React PWA guitar chord-trainer: a library of 200+ chord
voicings, SM-2 spaced-repetition daily practice, three quiz modes, a large
progressions library across genres, and a separate no-code visual editor for
maintaining the chord data. The original (1st) tool in the **Fretworks**
toolbox (sibling to DiatonicChordsTrainer, MelodicMinorTrainer, AlteredTrainer,
Circle of Fifths, Triad Trainer). Single dev + end user: Zak.

- Toolbox-wide conventions (git-dep workflow, multi-zone, single PWA,
  verify-in-prod, naming): `../CLAUDE.md`.

## Integration
- Vite `base: '/chord/'`, served as a Vercel zone (`vercel.json` rewrites
  `/chord/(.*)` → `/$1`).
- Registered in `@fretworks/design` `tools.js`: `key:"chord"`, `name:"Chord
  Trainer"`, `path:"/chord/"`, **accent gold `#ffd93d`**.
- Multi-page Vite build: the trainer (`index.html` → `src/App.jsx`) **and** a
  separate no-code editor (`editor.html`) in the same repo.
- Dev server port **5173** (`npm run dev`), preview port **4173**
  (`npm run preview`) — see `.claude/launch.json`.
- No backend, no database — everything lives in `localStorage`.

## Theory data model
`data/theory.js` holds pure helpers only (no React/DOM): `OPEN_MIDI`,
`NOTE_NAMES`, `DC` (degree → colour map, shared across the toolbox's
fretboard diagrams), `CATS` (voicing-technique labels: cowboy, triad, barre,
shell, drop2, drop3, drop24, spread, quartal, ext, altered), `DEG_HINT`
(plain-language degree descriptions).

**No chord shapes are hardcoded in JS** — every voicing lives in
`data/chords.json` (200+ voicings, `{ id, name, sym, cat, voicings: [{ str,
deg, sf }] }`). Correctness is enforced differently than the newer trainers
(no `verify.mjs`):
- `deriveDegrees(str, rootIdx)` **auto-derives** degree labels from a fret
  shape + root position, so a voicing can't be hand-labelled wrong.
- `validateVoicing(v)` / `validateChords(chords)` re-check that every labelled
  degree matches the actual pitch class — wired into the editor (see below),
  so bad data gets caught at authoring time, not at runtime.

`data/progressions.js` holds progression theory: `RN_OFFSETS` (Roman numeral
→ semitone offset), `Q_SUFFIX` (quality key → chord symbol), `QTMPL`
(C-rooted template voicings for transposition), `FEEL_TO_CAT` /
`BROAD_CATS` (6 genre groupings: Jazz, Blues, Rock & Pop, Soul & R&B, Latin,
Classical).

## Spaced repetition
SM-2, same algorithm as Triad Trainer: `updateSRS(card, correct)` →
`{ ef, interval, reps, nextDue }`. Persisted to `localStorage`: `ct_srs`
(schedule), `ct_hist` (quiz history per chord/date), `ct_deg_hist`
(scale-degree quiz results), `ct_mastered` (manually marked chords).
`getDailyChords()` surfaces ~5 chords/day (due chords sorted by `nextDue` +
fresh ones, seeded shuffle so the set is stable within a day).
`getWeakChords()` / `getWeakDegrees()` track miss rate + low ease-factor to
drive the Weak tab.

## Tabs
- **Today** 🌅 — the day's SRS chords + a seeded "Progression of the Day"
  pick from the progressions library; grade Got it to advance the interval.
- **Library** 📚 — browse all voicings by sonic family (Major, Dominant,
  Minor, Half-dim, Dim, Aug, Sus) or via the **Builder** (additive
  triad → 7th → extensions picker that generates the right chord label).
- **Progs** 🎵 — progressions by genre tab, transposable to any key, optional
  cowboy-voicing mode.
- **Quiz** 🎯 — Name→Shape, Shape→Name, mixed, plus a Scale-Degree quiz (tap
  the fretboard dot matching the requested degree).
- **Weak** 💪 — auto-tracked chords and degree+chord combos under ~70%
  accuracy; one-tap drill.
- **Guide** 📖 — in-app help + PWA update instructions.
- **Settings** ⚙️ — progress export/import (JSON backup), build-version stamp.

## The editor (`/editor.html`)
A **separate, no-code visual chord-data editor** — the pattern Triad Trainer's
roadmap calls "phase 2" and hasn't built yet. Visual fretboard builder with
live degree derivation (`deriveDegrees`) and live `validateVoicing` feedback,
audio preview, reads/writes `data/chords.json` via the File System Access API
on desktop Chrome/Edge, with a download/import fallback elsewhere. This is
the actual correctness gate for chord data — there's no Node `verify.mjs`
because validation is enforced live while authoring instead.

## Audio
Web Audio synthesis (no audio assets): `playVoicing(v, mode)` does
pluck/arpeggio strums via harmonic-series synthesis (`pluckNote()`, up to 6
harmonics). Includes the standard iOS silent-switch unlock workaround shared
across the toolbox.

## Before shipping any change
- `npm run build` must pass.
- If touching `data/chords.json` or `deriveDegrees`/`validateVoicing`, verify
  through the editor (`/editor.html`) — add or edit a voicing and confirm
  validation still flags a deliberately wrong degree label.
