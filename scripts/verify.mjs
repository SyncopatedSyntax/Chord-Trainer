// Correctness gate for the chord and progression data: `npm run verify`.
//
// The editor already validates a voicing while it is being authored
// (validateVoicing: every label matches the pitch it sounds). That cannot catch
// a template whose labels agree with each other but whose root is not the one
// the transposer assumes — which is how the maj7#5 template played a G chord
// under a C label in every key. So this re-derives each progression chord from
// first principles: the chord's real root from key + numeral, and every
// sounding string measured from that root.
import fs from 'fs';
import { NOTE_NAMES, CATS, DEGREE_SEMITONE, pitchClassAt, validateChords, validateVoicing } from '../data/theory.js';
import { QTMPL, TMPL_ROOT, RN_OFFSETS, Q_SUFFIX, validateProgressions, voicingForSlot, buildChordIndex, buildCowboyMap } from '../data/progressions.js';

const chords = JSON.parse(fs.readFileSync(new URL('../data/chords.json', import.meta.url), 'utf8'));
const progs = JSON.parse(fs.readFileSync(new URL('../data/progressions.json', import.meta.url), 'utf8'));

let n = 0;
const fails = [];
const check = (ok, msg) => { n++; if (!ok) fails.push(msg); };
let mark = 0;
const section = name => { console.log(`\n${name}`); mark = fails.length; };
const done = label => { console.log(`  ${fails.length > mark ? '✗' : '✓'} ${label}`); mark = fails.length; };

section('chord library');
{
  const r = validateChords(chords);
  check(r.ok, `validateChords: ${r.errors.slice(0, 5).join('; ')}`);
  const ids = new Set();
  for (const c of chords) { check(!ids.has(c.id), `duplicate chord id ${c.id}`); ids.add(c.id); }
  for (const c of chords) check(c.cat in CATS, `${c.id}: unknown category ${c.cat}`);
  done(`${chords.length} chords: every label sounds its degree, ids unique, categories known`);
}

section('progression templates');
{
  for (const [q, t] of Object.entries(QTMPL)) {
    check(validateVoicing(t).ok, `template ${q}: ${validateVoicing(t).errors.join('; ')}`);
    const r = t.str.findIndex((f, i) => t.deg[i] === 'R' && f >= 0);
    check(r >= 0 && pitchClassAt(r, t.str[r]) === TMPL_ROOT, `template ${q}: its root sounds ${NOTE_NAMES[pitchClassAt(r, t.str[r])]}, not ${NOTE_NAMES[TMPL_ROOT]}`);
    check(q in Q_SUFFIX, `template ${q}: no chord-symbol suffix`);
  }
  done(`${Object.keys(QTMPL).length} templates: labels match pitches, and every one is rooted on ${NOTE_NAMES[TMPL_ROOT]}`);
}

section('progressions');
{
  const list = progs.progressions || progs;
  const v = validateProgressions(list);
  check(v.ok, `validateProgressions: ${v.errors.slice(0, 5).join('; ')}`);
  // A lower-case numeral is a minor-family chord, upper-case is not — the
  // library's own convention: a secondary dominant is written in capitals
  // (I–II7–V–I, Rhythm Changes' III7–VI7–II7–V7). This checks that the label
  // matches the chord played; WHICH chord is right is a musical call, settled
  // against real tunes, not by this rule.
  const MINOR = new Set(['min', 'm7', 'm9', 'm6', 'm7b5', 'dim7', 'mMaj7', 'm13']);
  for (const p of list) for (const c of p.chords) {
    const core = c.rn.replace(/^[b#]/, '');
    check((core === core.toLowerCase()) === MINOR.has(c.q), `${p.title}: ${c.rn} is played as ${c.q} — a lower-case numeral reads as minor; write a secondary dominant in capitals`);
  }
  done(`${list.length} progressions valid; numeral case matches chord quality`);

  const index = buildChordIndex(chords), cowboy = buildCowboyMap(chords);
  let slots = 0;
  for (const mode of ['template', 'open position']) for (const p of list) for (const c of p.chords) for (let key = 0; key < 12; key++) {
    slots++;
    const tag = `${p.title} [${mode}] ${c.rn} ${c.q} in ${NOTE_NAMES[key]}`;
    const vc = voicingForSlot(c, key, { chordIndex: index, cowboyMap: mode === 'open position' ? cowboy : null });
    check(!!vc, `${tag}: no voicing`);
    if (!vc) continue;
    const root = (key + (RN_OFFSETS[c.rn] ?? 0) + 12) % 12;
    for (let s = 0; s < 6; s++) {
      if (vc.str[s] < 0) continue;
      const d = vc.deg[s];
      const iv = ((pitchClassAt(s, vc.str[s]) - root) % 12 + 12) % 12;
      check(d != null && DEGREE_SEMITONE[d] === iv, `${tag}: string ${s + 1} labelled ${d} sounds ${iv} semitones above ${NOTE_NAMES[root]}`);
    }
    check(Math.max(...vc.str) <= 17, `${tag}: fret ${Math.max(...vc.str)}`);
  }
  done(`${slots} progression chords (every slot, all 12 keys, template and open position) sound the chord they name`);
}

if (fails.length) {
  console.log(`\n${fails.length} of ${n} checks FAILED:`);
  for (const f of [...new Set(fails)].slice(0, 40)) console.log('  ' + f);
  process.exit(1);
}
console.log(`\nAll checks passed. ${n} assertions.`);
