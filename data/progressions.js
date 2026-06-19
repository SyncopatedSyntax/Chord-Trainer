// ── Shared progression theory: Roman-numeral + quality → transposed voicing ──
// Single source of truth used by BOTH the trainer (App.jsx, Progressions tab)
// and the progression editor (editor/). Keep this pure — no React, no DOM.
//
// A progression is { title, feel, desc, chords: [{ rn, q }] } where `rn` is a
// Roman numeral (I, ii, bVII…) and `q` is a quality key (maj7, m7, 7, sus4…).
// At render time we pick a key, look up the numeral's semitone offset, and
// transpose a C-rooted template voicing to the target note.

import { NOTE_NAMES, OPEN_MIDI } from './theory.js';

// Roman numeral → semitones above the tonic. Upper- and lower-case both map to
// the same offset (case only signals major/minor intent to the reader).
export const RN_OFFSETS = {
  'I': 0, 'bII': 1, 'II': 2, 'bIII': 3, 'III': 4, 'IV': 5, 'bV': 6, 'V': 7, 'bVI': 8, 'VI': 9, 'bVII': 10, 'VII': 11,
  'i': 0, 'bii': 1, 'ii': 2, 'biii': 3, 'iii': 4, 'iv': 5, 'bv': 6, 'v': 7, 'bvi': 8, 'vi': 9, 'bvii': 10, 'vii': 11,
};

// Quality key → printed chord-symbol suffix.
export const Q_SUFFIX = {
  'maj7': 'maj7', 'm7': 'm7', '7': '7', 'maj': '', 'min': 'm', 'm7b5': 'm7b5',
  'dim7': 'dim7', '7b9': '7b9', '9': '9', 'maj9': 'maj9', 'm9': 'm9',
  '6': '6', '7sus4': '7sus4', 'm6': 'm6', 'sus2': 'sus2', 'sus4': 'sus4',
  'aug': '+', '9sus4': '9sus4', '13sus4': '13sus4', 'maj7s5': 'maj7#5',
  'm13': 'm13', 'maj9s11': 'maj9#11', '9s11': '9#11', 'mMaj7': '(Δ7)',
};

// Quality key → C-rooted template voicing {str, deg, sf}. A string fret 3 = C.
export const QTMPL = {
  // All templates rooted at C — A string fret 3 = MIDI 48 = C
  // ── Seventh chords: shell / 4-string — the jazz comping vocabulary ──────
  'maj7':   { str: [-1, 3, 2, 4, -1, -1], deg: [null, 'R', '3', '7', null, null], sf: 1 },
  'm7':     { str: [-1, 3, 1, 3, -1, -1], deg: [null, 'R', 'b3', 'b7', null, null], sf: 1 },
  '7':      { str: [-1, 3, 2, 3, -1, -1], deg: [null, 'R', '3', 'b7', null, null], sf: 1 },
  'm7b5':   { str: [-1, 3, 4, 3, -1, -1], deg: [null, 'R', 'b5', 'b7', null, null], sf: 3 },
  'dim7':   { str: [-1, 3, 4, 2, 4, -1], deg: [null, 'R', 'b5', 'bb7', 'b3', null], sf: 2 },
  '7b9':    { str: [-1, 3, 2, 3, 2, -1], deg: [null, 'R', '3', 'b7', 'b9', null], sf: 2 },
  '9':      { str: [-1, 3, 2, 3, 3, -1], deg: [null, 'R', '3', 'b7', '9', null], sf: 1 },
  'maj9':   { str: [-1, 3, 2, 4, 3, -1], deg: [null, 'R', '3', '7', '9', null], sf: 1 },
  'm9':     { str: [-1, 3, 1, 3, 3, -1], deg: [null, 'R', 'b3', 'b7', '9', null], sf: 1 },
  '7sus4':  { str: [-1, 3, 3, 3, -1, -1], deg: [null, 'R', '4', 'b7', null, null], sf: 3 },
  '6':      { str: [-1, 3, 2, 2, 3, -1], deg: [null, 'R', '3', '6', '9', null], sf: 2 },
  'm6':     { str: [-1, 3, 1, 2, -1, -1], deg: [null, 'R', 'b3', '6', null, null], sf: 1 },
  '9sus4':  { str: [-1, 3, 3, 3, 3, -1], deg: [null, 'R', '4', 'b7', '9', null], sf: 3 },
  'aug':    { str: [-1, 3, 2, 1, -1, -1], deg: [null, 'R', '3', '#5', null, null], sf: 1 },
  'maj7s5': { str: [3, 2, 4, -1, 4, -1], deg: ['R', '3', '7', null, '#5', null], sf: 2 },
  'mMaj7':  { str: [-1, 3, 1, 4, -1, -1], deg: [null, 'R', 'b3', '7', null, null], sf: 1 },
  // ── Triads: COMPACT 4-string on 5-4-3-2 (no top-e barre) ───────────────
  // These are the shapes advanced rock, soul, and fusion players use —
  // not the full 6-string cowboy barre. Cleaner on-neck sound.
  // C major: A3=C(R):48✓, D5=G(5):55✓, G5=C(R):60✓, B5=E(3):64✓
  'maj':    { str: [-1, 3, 5, 5, 5, -1], deg: [null, 'R', '5', 'R', '3', null], sf: 3 },
  // C minor: A3=C(R):48✓, D5=G(5):55✓, G5=C(R):60✓, B4=Eb(b3):63✓
  'min':    { str: [-1, 3, 5, 5, 4, -1], deg: [null, 'R', '5', 'R', 'b3', null], sf: 3 },
  // C sus2: B3=D(2):62✓ (2nd of C=D✓)
  'sus2':   { str: [-1, 3, 5, 5, 3, -1], deg: [null, 'R', '5', 'R', '2', null], sf: 3 },
  // C sus4: B6=F(4):65✓ (4th of C=F✓)
  'sus4':   { str: [-1, 3, 5, 5, 6, -1], deg: [null, 'R', '5', 'R', '4', null], sf: 3 },
};
export const TMPL_ROOT = 0;

// Feel string → broad category id (used to bucket the long feel list into tabs).
export const FEEL_TO_CAT = {
  'Jazz': 'Jazz', 'Bebop': 'Jazz', 'Bebop/Modern': 'Jazz', 'Jazz Standard': 'Jazz', 'Jazz Waltz': 'Jazz', 'Modal Jazz': 'Jazz', 'Jazz / Fusion': 'Jazz', 'Jazz Comping': 'Jazz', 'Jazz Fusion': 'Jazz', 'Jazz Minor': 'Jazz', 'Smooth Jazz': 'Jazz',
  'Blues': 'Blues', 'Gospel/Blues': 'Blues', 'Minor Blues': 'Blues',
  'Pop': 'Rock & Pop', 'Pop/50s': 'Rock & Pop', 'Pop/Soul': 'Rock & Pop', 'Pop / Soul': 'Rock & Pop', 'Pop/Rock': 'Rock & Pop', 'Folk/Country': 'Rock & Pop', 'Rock': 'Rock & Pop', 'Rock/Classical': 'Rock & Pop', 'Rock/Modal': 'Rock & Pop', 'Rock / Classical': 'Rock & Pop', 'Classical/Pop': 'Rock & Pop',
  'R&B/Soul': 'Soul & R&B', 'Neo-Soul/R&B': 'Soul & R&B', 'Neo-Soul': 'Soul & R&B', 'Neo-Soul / R&B': 'Soul & R&B', 'Funk/Soul': 'Soul & R&B', 'Gospel': 'Soul & R&B', 'Soul/R&B': 'Soul & R&B',
  'Bossa Nova': 'Latin', 'Samba': 'Latin', 'Samba / Brazilian': 'Latin', 'Flamenco': 'Latin', 'Tango': 'Latin',
  'Classical': 'Classical',
};
export const BROAD_CATS = [
  { id: 'Jazz', label: 'Jazz', emoji: '🎷', color: '#a29bfe' },
  { id: 'Blues', label: 'Blues', emoji: '🎸', color: '#ff6b6b' },
  { id: 'Rock & Pop', label: 'Rock & Pop', emoji: '🎵', color: '#ffd93d' },
  { id: 'Soul & R&B', label: 'Soul & R&B', emoji: '🎹', color: '#fd79a8' },
  { id: 'Latin', label: 'Latin', emoji: '🪗', color: '#00b894' },
  { id: 'Classical', label: 'Classical', emoji: '🎼', color: '#74b9ff' },
];

// Dropdown sources for the editor (declaration order preserved).
export const RN_KEYS = Object.keys(RN_OFFSETS);
// All printable qualities. A handful (e.g. maj9s11, 9s11) have a name suffix but
// no voicing template — the app renders those as "no voicing", same as before.
export const QUALITY_KEYS = Object.keys(Q_SUFFIX);
export const FEEL_KEYS = Object.keys(FEEL_TO_CAT);
// True when a quality has a transposable voicing template (drives a preview hint).
export const hasVoicing = q => q in QTMPL;

// Map a feel string to its broad category (defaults to Jazz, matching the app).
export const feelToCat = feel => FEEL_TO_CAT[feel] || 'Jazz';

// Transpose a C-rooted template up to `targetNote` (pitch class 0–11).
export function transposeFromTemplate(tmpl, targetNote) {
  const shift = ((targetNote - TMPL_ROOT) + 12) % 12;
  if (shift === 0) return { ...tmpl, label: '' };
  const newStr = tmpl.str.map(f => f > 0 ? f + shift : f);
  const active = newStr.filter(f => f > 0);
  return { ...tmpl, str: newStr, sf: active.length > 0 ? Math.min(...active) : 1, label: '' };
}

// Printed chord name for a numeral+quality in a given key.
export function getChordName(keyNote, rnStr, quality) {
  const offset = RN_OFFSETS[rnStr] || 0;
  const noteIdx = (keyNote + offset + 12) % 12;
  const sfx = Q_SUFFIX[quality] !== undefined ? Q_SUFFIX[quality] : quality;
  return NOTE_NAMES[noteIdx] + sfx;
}

// Voicing for a numeral+quality in a given key. If `cowboyMap` is supplied
// (a `${noteIdx}_${quality}` → voicing map, built from the chord library by the
// caller), an open/cowboy voicing is preferred where one exists.
export function getVoicing(keyNote, rnStr, quality, cowboyMap = null) {
  const offset = RN_OFFSETS[rnStr] || 0;
  const targetNote = (keyNote + offset + 12) % 12;
  if (cowboyMap) {
    const cv = cowboyMap[`${targetNote}_${quality}`];
    if (cv) return cv;
  }
  const tmpl = QTMPL[quality];
  if (!tmpl) return null;
  return transposeFromTemplate(tmpl, targetNote);
}

// ── Open/cowboy voicing map ─────────────────────────────────────────────────
// Build a `${noteIdx}_${quality}` → open voicing map from a chord library, for
// "Open Pos." mode. Pass the chord list in (keeps this module data-free).
const COWBOY_Q = {
  'maj': c => /^[A-G][#b]?$/.test(c.sym),
  'min': c => /^[A-G][#b]?m$/.test(c.sym),
  '7':   c => /^[A-G][#b]?7$/.test(c.sym),
  'sus2': c => c.sym.endsWith('sus2'),
  'sus4': c => c.sym.endsWith('sus4'),
  'maj7': c => /^[A-G][#b]?maj7$/.test(c.sym),
  'm7':  c => /^[A-G][#b]?m7$/.test(c.sym),
};
const rootPcOf = v => {
  for (let i = 0; i < v.str.length; i++) {
    if (v.deg?.[i] === 'R' && v.str[i] >= 0) return ((OPEN_MIDI[i] + v.str[i]) % 12 + 12) % 12;
  }
  return null;
};
export function buildCowboyMap(chords) {
  const map = {};
  Object.entries(COWBOY_Q).forEach(([q, test]) => {
    chords.filter(c => c.cat === 'cowboy' && test(c)).forEach(c => {
      const root = rootPcOf(c.voicings[0]);
      if (root !== null && !map[`${root}_${q}`]) map[`${root}_${q}`] = c.voicings[0];
    });
  });
  return map;
}

// ── Specific shape selection (movable library voicings) ─────────────────────
// Each quality maps to the library chord syms that voice it (including inversions),
// so the editor can offer concrete movable shapes that still transpose to any key.
// A slot may carry `shape` = a chord id from chords.json; if set, that voicing is
// used (transposed) instead of the default quality template.
export const QUALITY_SHAPES = {
  'maj': ['maj', 'maj/3', 'maj/5'], 'min': ['min', 'min/b3', 'min/5'], 'aug': ['+', 'aug'],
  'dim7': ['°7', '°7/b3'], 'm7b5': ['ø', 'ø/b7'],
  '7': ['7', '7/3', '7/b7', '7/R'], 'maj7': ['maj7', 'Δ', 'Δ/3', 'Δ/7', 'Δ/R'], 'm7': ['m7', 'm7/b3', 'm7/b7'],
  'mMaj7': ['m(Δ)'], '6': ['6'], 'm6': ['m6'], '9': ['9'], 'maj9': ['maj9'], 'm9': ['m9'],
  'sus2': ['sus2'], 'sus4': ['sus4'], '7sus4': ['7sus4'], '9sus4': ['9sus4'], '13sus4': ['13sus4'],
  'm13': ['m13'], 'maj7s5': ['Δ#5'], 'maj9s11': ['Δ9#11'], '9s11': ['9#11'], '7b9': ['7b9'],
};

// Movable library chords that voice the given quality. `chords` is chords.json.
export function shapesForQuality(quality, chords) {
  const syms = QUALITY_SHAPES[quality];
  if (!syms) return [];
  return chords.filter(c => c.movable && syms.includes(c.sym));
}

// id → chord lookup, for resolving a slot's chosen shape.
export function buildChordIndex(chords) {
  const idx = {};
  for (const c of chords) idx[c.id] = c;
  return idx;
}

// Transpose any movable voicing so its root lands on `targetNote` (pitch class).
export function transposeVoicingToNote(v, targetNote) {
  const cur = rootPcOf(v);
  if (cur == null) return { ...v, label: '' };
  const shift = ((targetNote - cur) + 12) % 12;
  if (shift === 0) return { ...v, label: '' };
  const newStr = v.str.map(f => f > 0 ? f + shift : f);
  const active = newStr.filter(f => f > 0);
  return { ...v, str: newStr, sf: active.length > 0 ? Math.min(...active) : 1, label: '' };
}

// Resolve a progression slot {rn, q, shape?} to a voicing in the given key.
// Priority: explicit chosen shape → open/cowboy (when cowboyMap) → quality template.
export function voicingForSlot(slot, keyNote, { cowboyMap = null, chordIndex = null } = {}) {
  const offset = RN_OFFSETS[slot.rn] || 0;
  const targetNote = (keyNote + offset + 12) % 12;
  if (slot.shape && chordIndex) {
    const c = chordIndex[slot.shape];
    if (c && c.voicings?.[0]) return transposeVoicingToNote(c.voicings[0], targetNote);
  }
  if (cowboyMap) {
    const cv = cowboyMap[`${targetNote}_${slot.q}`];
    if (cv) return cv;
  }
  const tmpl = QTMPL[slot.q];
  if (!tmpl) return null;
  return transposeFromTemplate(tmpl, targetNote);
}

// ── Validation (mirrors validateVoicing/validateChords in theory.js) ────────
// Validate one progression. Returns { ok, errors }.
export function validateProgression(p) {
  const errors = [];
  if (!p || typeof p !== 'object') return { ok: false, errors: ['not an object'] };
  if (!p.title || !String(p.title).trim()) errors.push('title is required');
  if (!Array.isArray(p.chords) || p.chords.length < 2) errors.push('needs at least 2 chords');
  else p.chords.forEach((c, i) => {
    if (!c || !(c.rn in RN_OFFSETS)) errors.push(`chord ${i + 1}: unknown numeral '${c?.rn}'`);
    if (!c || !(c.q in Q_SUFFIX)) errors.push(`chord ${i + 1}: unknown quality '${c?.q}'`);
  });
  return { ok: errors.length === 0, errors };
}

// Validate a whole progression list. Returns { ok, errors } with per-item messages.
export function validateProgressions(list) {
  const errors = [];
  if (!Array.isArray(list)) return { ok: false, errors: ['file is not an array'] };
  list.forEach((p, i) => {
    const r = validateProgression(p);
    if (!r.ok) r.errors.forEach(e => errors.push(`"${p?.title || `#${i + 1}`}": ${e}`));
  });
  return { ok: errors.length === 0, errors };
}
