import { useState, useMemo, useRef, useCallback } from 'react';
import ChordDiagram from '../components/ChordDiagram.jsx';
import { playVoicing } from './audio.js';
import seed from '../data/chords.json';
import {
  CATS, DC, NOTE_NAMES, OPEN_MIDI, DEGREE_ALTS,
  deriveDegrees, computeStartFret, validateVoicing, validateChords,
} from '../data/theory.js';
import { btn, panel, labelCss, serializeArray, Field, Step, code } from './ui.jsx';

const STRINGS = ['E (6th)', 'A (5th)', 'D (4th)', 'G (3rd)', 'B (2nd)', 'e (1st)'];
const FRETS = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const CAT_KEYS = Object.keys(CATS);

const serialize = serializeArray;
const slug = s => (s || '').replace(/[^a-z0-9]/gi, '').slice(0, 14) || 'chord';
const blankDraft = () => ({ id: '', name: '', sym: '', cat: CAT_KEYS[0], movable: false, label: '', str: [-1, -1, -1, -1, -1, -1], rootIdx: null, overrides: {} });

// Build the editor draft from an existing chord, preserving its exact degree
// spellings (e.g. #9, b13) as overrides where they differ from the default.
function draftFromChord(c) {
  const v = c.voicings[0];
  let rootIdx = v.deg.findIndex((d, i) => d === 'R' && v.str[i] >= 0);
  if (rootIdx < 0) rootIdx = null;
  const derived = deriveDegrees(v.str, rootIdx);
  const overrides = {};
  v.deg.forEach((d, i) => { if (d != null && v.str[i] >= 0 && d !== derived[i]) overrides[i] = d; });
  return { id: c.id, name: c.name, sym: c.sym, cat: c.cat, movable: !!c.movable, label: v.label || '', str: [...v.str], rootIdx, overrides };
}

export default function Editor() {
  const [chords, setChords] = useState(() => seed);
  const [draft, setDraft] = useState(null);          // current edit draft or null
  const [fileHandle, setFileHandle] = useState(null); // FS Access handle for in-place save
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [view, setView] = useState('edit'); // 'edit' | 'help'
  const importRef = useRef(null);
  const editingOriginal = useRef(null); // the chord object being edited (for id-collision allowance)

  const hasFsAccess = typeof window !== 'undefined' && 'showOpenFilePicker' in window;
  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  // ── Derived degree array for the current draft ──────────────────────────
  const finalDeg = useMemo(() => {
    if (!draft) return [];
    const derived = deriveDegrees(draft.str, draft.rootIdx);
    return derived.map((d, i) => (draft.overrides[i] != null && draft.str[i] >= 0 ? draft.overrides[i] : d));
  }, [draft]);

  const draftVoicing = useMemo(() => {
    if (!draft) return null;
    return { str: draft.str, deg: finalDeg, sf: computeStartFret(draft.str), label: draft.label };
  }, [draft, finalDeg]);

  const draftErrors = useMemo(() => {
    if (!draft) return [];
    const e = [];
    if (!draft.id.trim()) e.push('id is required');
    else if (chords.some(c => c.id === draft.id && c !== editingOriginal.current)) e.push(`id "${draft.id}" already exists`);
    if (!draft.name.trim()) e.push('name is required');
    if (!draft.sym.trim()) e.push('symbol is required');
    if (draft.rootIdx == null) e.push('mark a root (R) on one string');
    if (draftVoicing) e.push(...validateVoicing(draftVoicing).errors);
    return e;
  }, [draft, draftVoicing, chords]);

  // ── Draft actions ───────────────────────────────────────────────────────
  const startNew = () => { editingOriginal.current = null; setDraft(blankDraft()); };
  const startEdit = c => { editingOriginal.current = c; setDraft(draftFromChord(c)); };
  const startDuplicate = c => { editingOriginal.current = null; const d = draftFromChord(c); d.id = ''; d.name = c.name + ' copy'; setDraft(d); };
  const cancel = () => { editingOriginal.current = null; setDraft(null); };

  const setStr = (i, fret) => setDraft(d => {
    const str = [...d.str]; str[i] = fret;
    // Changing a string's fret changes its interval, so any prior spelling
    // override for that string no longer applies — reset it to the default.
    const overrides = { ...d.overrides }; delete overrides[i];
    let rootIdx = d.rootIdx;
    if (fret < 0 && rootIdx === i) rootIdx = null; // muting the root clears it
    return { ...d, str, overrides, rootIdx };
  });
  // Moving the root re-intervals every string, so clear all overrides.
  const setRoot = i => setDraft(d => (d.str[i] < 0 ? d : { ...d, rootIdx: i, overrides: {} }));
  const setOverride = (i, deg) => setDraft(d => ({ ...d, overrides: { ...d.overrides, [i]: deg } }));
  const patch = p => setDraft(d => ({ ...d, ...p }));

  const save = () => {
    if (draftErrors.length) { flash('Fix errors before saving'); return; }
    const chord = {
      id: draft.id.trim(), name: draft.name.trim(), sym: draft.sym.trim(), cat: draft.cat,
      ...(draft.movable ? { movable: true } : {}),
      voicings: [{ label: draft.label.trim(), str: draft.str, deg: finalDeg, sf: computeStartFret(draft.str) }],
    };
    setChords(prev => {
      const orig = editingOriginal.current;
      if (orig) return prev.map(c => (c === orig ? chord : c));
      return [...prev, chord];
    });
    setDirty(true);
    editingOriginal.current = null;
    setDraft(null);
    flash('Saved to working set — remember to Save/Download the file');
  };

  const remove = c => {
    if (!window.confirm(`Delete "${c.name}" (${c.id})?`)) return;
    setChords(prev => prev.filter(x => x !== c));
    setDirty(true);
    if (editingOriginal.current === c) cancel();
  };

  // ── File I/O ─────────────────────────────────────────────────────────────
  const openFromDisk = async () => {
    try {
      const [handle] = await window.showOpenFilePicker({ types: [{ description: 'Chord JSON', accept: { 'application/json': ['.json'] } }] });
      const text = await (await handle.getFile()).text();
      const data = JSON.parse(text);
      const r = validateChords(data);
      if (!r.ok && !window.confirm(`File has ${r.errors.length} validation issue(s). Load anyway?\n\n${r.errors.slice(0, 8).join('\n')}`)) return;
      setChords(data); setFileHandle(handle); setDirty(false); cancel();
      flash(`Opened ${data.length} chords`);
    } catch (e) { if (e.name !== 'AbortError') flash('Open failed: ' + e.message); }
  };

  const saveToDisk = async () => {
    const r = validateChords(chords);
    if (!r.ok && !window.confirm(`${r.errors.length} validation issue(s) in the set. Save anyway?\n\n${r.errors.slice(0, 8).join('\n')}`)) return;
    const text = serialize(chords);
    try {
      if (fileHandle) {
        const w = await fileHandle.createWritable(); await w.write(text); await w.close();
        setDirty(false); flash('Saved to file ✓');
      } else if (hasFsAccess) {
        const handle = await window.showSaveFilePicker({ suggestedName: 'chords.json', types: [{ description: 'Chord JSON', accept: { 'application/json': ['.json'] } }] });
        const w = await handle.createWritable(); await w.write(text); await w.close();
        setFileHandle(handle); setDirty(false); flash('Saved to file ✓');
      } else { download(text); }
    } catch (e) { if (e.name !== 'AbortError') flash('Save failed: ' + e.message); }
  };

  const download = (text = serialize(chords)) => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'chords.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setDirty(false); flash('Downloaded chords.json');
  };

  const importFile = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const r = validateChords(data);
        if (!r.ok && !window.confirm(`File has ${r.errors.length} validation issue(s). Load anyway?`)) return;
        setChords(data); setFileHandle(null); setDirty(false); cancel(); flash(`Imported ${data.length} chords`);
      } catch (err) { flash('Invalid JSON'); }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // ── List filtering ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = catFilter === 'all' ? chords : chords.filter(c => c.cat === catFilter);
    const q = search.trim().toLowerCase();
    if (q) r = r.filter(c => c.name.toLowerCase().includes(q) || c.sym.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    return r;
  }, [chords, catFilter, search]);

  const setValid = useMemo(() => validateChords(chords), [chords]);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={{ fontSize: '20px', fontWeight: 900 }}>🎸 <span style={{ color: '#ffd93d' }}>Chord</span> Editor</div>
        <span style={{ fontSize: '11px', color: '#888' }}>{chords.length} chords{dirty && <span style={{ color: '#ff6b6b', fontWeight: 700 }}> · unsaved</span>}</span>
        <span style={{ fontSize: '11px', color: setValid.ok ? '#00b894' : '#ff6363', fontWeight: 700 }}>{setValid.ok ? '✓ all valid' : `✗ ${setValid.errors.length} issue(s)`}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {hasFsAccess && <button onClick={openFromDisk} style={btn(false, '#74b9ff')}>Open file…</button>}
          <button onClick={saveToDisk} style={btn(true, '#00b894')}>{fileHandle ? 'Save file ✓' : 'Save file…'}</button>
          <button onClick={() => download()} style={btn(false, '#a29bfe')}>Download</button>
          <button onClick={() => importRef.current?.click()} style={btn(false, '#4ecdc4')}>Import</button>
          <input ref={importRef} type="file" accept=".json" onChange={importFile} style={{ display: 'none' }} />
        </div>
      </div>
      {msg && <div style={{ background: '#ffd93d18', border: '1px solid #ffd93d44', color: '#ffd93d', borderRadius: '9px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', fontWeight: 600 }}>{msg}</div>}
      {!hasFsAccess && <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>Your browser can't save in place — use <b>Download</b> to export and <b>Import</b> to reload. (Chrome/Edge support direct file editing.)</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {[{ id: 'edit', label: '✏️ Editor' }, { id: 'help', label: '📖 How to publish' }].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={btn(view === t.id)}>{t.label}</button>
        ))}
      </div>

      {view === 'help' && <Instructions hasFsAccess={hasFsAccess} />}

      {view === 'edit' && (
      <div style={{ display: 'grid', gridTemplateColumns: draft ? '300px 1fr' : '1fr', gap: '14px', alignItems: 'start' }}>
        {/* List */}
        <div style={panel}>
          <button onClick={startNew} style={{ ...btn(true), width: '100%', marginBottom: '10px', padding: '9px' }}>+ New chord</button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ width: '100%', background: '#0f0e17', border: '1px solid #2a2840', borderRadius: '8px', padding: '7px 10px', color: '#fff', fontSize: '13px', marginBottom: '8px', outline: 'none' }} />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: '100%', background: '#0f0e17', border: '1px solid #2a2840', borderRadius: '8px', padding: '7px 10px', color: '#fff', fontSize: '12px', marginBottom: '10px' }}>
            <option value="all">All categories ({chords.length})</option>
            {CAT_KEYS.map(k => <option key={k} value={k}>{CATS[k].label} ({chords.filter(c => c.cat === k).length})</option>)}
          </select>
          <div style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {filtered.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: editingOriginal.current === c ? '#1e1c32' : '#0f0e17', border: `1px solid ${editingOriginal.current === c ? '#ffd93d' : '#2a2840'}`, borderRadius: '8px', padding: '5px 7px' }}>
                <div onClick={() => startEdit(c)} style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <ChordDiagram v={c.voicings[0]} showDeg size={0.5} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: '9px', color: CATS[c.cat]?.color || '#888' }}>{c.sym} · {c.id}</div>
                  </div>
                </div>
                <button title="Duplicate" onClick={() => startDuplicate(c)} style={{ ...btn(false), minHeight: '26px', padding: '3px 7px', fontSize: '11px' }}>⧉</button>
                <button title="Delete" onClick={() => remove(c)} style={{ ...btn(false, '#ff6363'), minHeight: '26px', padding: '3px 7px', fontSize: '11px' }}>✕</button>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px' }}>No chords match.</div>}
          </div>
        </div>

        {/* Editor form */}
        {draft && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={panel}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Live preview */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: '#0f0e17', borderRadius: '10px', padding: '12px', border: '1px solid #2a2840' }}>
                    <ChordDiagram v={draftVoicing} showDeg size={1.7} />
                  </div>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '8px', justifyContent: 'center' }}>
                    <button onClick={() => playVoicing(draftVoicing, 'strum')} style={btn(false)}>♬ Strum</button>
                    <button onClick={() => playVoicing(draftVoicing, 'arp')} style={btn(false)}>♩ Arp</button>
                  </div>
                </div>
                {/* Metadata fields */}
                <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Field label="Name" value={draft.name} onChange={v => patch(editingOriginal.current || draft.id ? { name: v } : { name: v, id: slug(v) })} placeholder="e.g. C Major" />
                  <Field label="Symbol" value={draft.sym} onChange={v => patch({ sym: v })} placeholder="e.g. C, m7, Δ" />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={labelCss}>Category</div>
                      <select value={draft.cat} onChange={e => patch({ cat: e.target.value })} style={{ width: '100%', background: '#0f0e17', border: '1px solid #2a2840', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '13px' }}>
                        {CAT_KEYS.map(k => <option key={k} value={k}>{CATS[k].label}</option>)}
                      </select>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#bbb', alignSelf: 'flex-end', padding: '8px 0' }}>
                      <input type="checkbox" checked={draft.movable} onChange={e => patch({ movable: e.target.checked })} /> movable
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}><Field label="id (unique)" value={draft.id} onChange={v => patch({ id: v })} placeholder={slug(draft.name)} mono /></div>
                    <button onClick={() => patch({ id: slug(draft.name) })} style={btn(false)}>Auto-id</button>
                  </div>
                  <Field label="Voicing label (optional)" value={draft.label} onChange={v => patch({ label: v })} placeholder="e.g. Open, 6th-str root · ex G@3fr" />
                  <div style={{ fontSize: '11px', color: '#888' }}>Start fret (auto): <b style={{ color: '#ffd93d' }}>{computeStartFret(draft.str)}</b></div>
                </div>
              </div>
            </div>

            {/* Fretboard editor */}
            <div style={panel}>
              <div style={labelCss}>Shape — set each string's fret, then mark the root</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {STRINGS.map((sName, i) => {
                  const fret = draft.str[i];
                  const isRoot = draft.rootIdx === i;
                  const deg = finalDeg[i];
                  // override options for this string
                  let opts = null;
                  if (fret >= 0 && draft.rootIdx != null && draft.str[draft.rootIdx] >= 0 && i !== draft.rootIdx) {
                    const rootPc = (OPEN_MIDI[draft.rootIdx] + draft.str[draft.rootIdx]) % 12;
                    const pc = (OPEN_MIDI[i] + fret) % 12;
                    const interval = ((pc - rootPc) % 12 + 12) % 12;
                    opts = DEGREE_ALTS[interval] || null;
                  }
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #1a1928', paddingBottom: '4px' }}>
                      <div style={{ width: '54px', fontSize: '11px', color: '#bbb', fontWeight: 700, flexShrink: 0 }}>{sName}</div>
                      <button onClick={() => setRoot(i)} disabled={fret < 0} title="Mark as root"
                        style={{ ...btn(isRoot, '#ff4757'), minWidth: '30px', opacity: fret < 0 ? 0.3 : 1 }}>R</button>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', flex: 1 }}>
                        {FRETS.map(f => (
                          <button key={f} onClick={() => setStr(i, f)} style={{ ...btn(fret === f, f === -1 ? '#e74c3c' : '#74b9ff'), minWidth: '26px', padding: '4px 6px' }}>
                            {f === -1 ? '✕' : f}
                          </button>
                        ))}
                      </div>
                      <div style={{ width: '78px', flexShrink: 0, textAlign: 'right' }}>
                        {fret < 0 ? <span style={{ color: '#555', fontSize: '11px' }}>muted</span>
                          : opts && opts.length > 1
                            ? <select value={deg} onChange={e => setOverride(i, e.target.value)} style={{ background: (DC[deg] || '#888') + '22', color: DC[deg] || '#fff', border: `1px solid ${DC[deg] || '#2a2840'}`, borderRadius: '7px', padding: '3px 6px', fontSize: '12px', fontWeight: 700 }}>
                              {opts.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                            : <span style={{ background: (DC[deg] || '#888') + '22', color: DC[deg] || '#888', border: `1px solid ${(DC[deg] || '#2a2840')}66`, borderRadius: '7px', padding: '3px 8px', fontSize: '12px', fontWeight: 700 }}>{deg || '—'}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>Degrees auto-derive from the shape and the root. Where a note can be spelled two ways (e.g. ♭3/♯9), use the dropdown.</div>
            </div>

            {/* Errors + actions */}
            {draftErrors.length > 0 && (
              <div style={{ ...panel, border: '1px solid #ff636355' }}>
                <div style={{ fontSize: '11px', color: '#ff6363', fontWeight: 700, marginBottom: '5px' }}>{draftErrors.length} issue(s)</div>
                {draftErrors.map((e, i) => <div key={i} style={{ fontSize: '11px', color: '#ffb3b3' }}>• {e}</div>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={save} disabled={draftErrors.length > 0} style={{ ...btn(true, '#00b894'), opacity: draftErrors.length ? 0.4 : 1, padding: '10px 20px', cursor: draftErrors.length ? 'not-allowed' : 'pointer' }}>
                {editingOriginal.current ? 'Update chord' : 'Add chord'}
              </button>
              <button onClick={cancel} style={{ ...btn(false), padding: '10px 18px' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

// Instructions tab — how an edit here becomes a change in the live app.
function Instructions({ hasFsAccess }) {
  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ ...panel, marginBottom: '14px', borderColor: '#ffd93d44' }}>
        <div style={{ fontSize: '13px', color: '#ddd', lineHeight: 1.6 }}>
          <b style={{ color: '#ffd93d' }}>How this works.</b> This editor changes a <b>local copy</b> of the chord
          data. The live app reads <code style={code}>data/chords.json</code> from the repo, so your edits go live
          only after that file is committed and the site redeploys. Here's the full loop:
        </div>
      </div>

      <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Step n="1" title="Edit your chords">
          Add, duplicate, edit, or delete chords in the <b>Editor</b> tab. The header shows a live
          <span style={{ color: '#00b894', fontWeight: 700 }}> ✓ all valid </span> / <span style={{ color: '#ff6363', fontWeight: 700 }}>✗ issues</span>
          status — every shape is checked automatically (degrees are derived from the fretboard), so you can't
          save a chord with a wrong note.
        </Step>

        <Step n="2" title="Save the JSON file">
          {hasFsAccess ? (
            <>The cleanest path on Chrome/Edge desktop: click <b>Open file…</b> and pick the repo's
            <code style={code}>data/chords.json</code>, edit, then <b>Save file ✓</b> to write straight back to it.
            If you didn't open from disk, <b>Save file…</b> / <b>Download</b> writes a fresh <code style={code}>chords.json</code> to your computer.</>
          ) : (
            <>Your browser can't write files directly, so click <b>Download</b> to get an updated
            <code style={code}> chords.json</code>. (Tip: desktop Chrome or Edge can edit the file in place via <b>Open file…</b>.)</>
          )}
        </Step>

        <Step n="3" title="Put it in the repo">
          Replace <code style={code}>data/chords.json</code> in the project with the file you just saved
          (skip this if you used <b>Open file…</b> on that exact file — it's already updated).
        </Step>

        <Step n="4" title="Commit & push to GitHub">
          Commit the change and push to <code style={code}>main</code>:
          <div style={{ ...code, display: 'block', padding: '8px 10px', marginTop: '6px', whiteSpace: 'pre-wrap', color: '#9be7c4' }}>git add data/chords.json{'\n'}git commit -m "Update chords"{'\n'}git push</div>
        </Step>

        <Step n="5" title="Vercel redeploys automatically">
          Pushing to <code style={code}>main</code> triggers a Vercel build. After ~1 minute the live app at
          <code style={code}> chord-trainer-mauve.vercel.app</code> serves the new chords. If you have it installed
          as an app, open the <b>Guide</b> tab and tap <b>↻ Update</b> (or just reload) to pull the new version.
        </Step>
      </div>

      <div style={{ ...panel, marginTop: '14px' }}>
        <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.6 }}>
          <b style={{ color: '#bbb' }}>Tips.</b> Use <b>Download</b> any time to back up the whole set. Use <b>Import</b>
          to load a <code style={code}>chords.json</code> from disk and keep editing it. The <b>id</b> of each chord
          must be unique — the editor flags collisions before you save.
        </div>
      </div>
    </div>
  );
}
