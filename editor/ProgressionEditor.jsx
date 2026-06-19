import { useState, useMemo, useRef } from 'react';
import ChordDiagram from '../components/ChordDiagram.jsx';
import { playVoicing } from './audio.js';
import progSeed from '../data/progressions.json';
import chordSeed from '../data/chords.json';
import { NOTE_NAMES, CATS } from '../data/theory.js';
import {
  RN_KEYS, QUALITY_KEYS, FEEL_KEYS, Q_SUFFIX, BROAD_CATS,
  feelToCat, getChordName, voicingForSlot, hasVoicing, buildCowboyMap,
  shapesForQuality, buildChordIndex, validateProgression, validateProgressions,
} from '../data/progressions.js';
import { btn, panel, labelCss, serializeArray, Field, Step, code } from './ui.jsx';

const blankDraft = () => ({ title: '', feel: FEEL_KEYS[0], desc: '', chords: [{ rn: 'I', q: 'maj' }, { rn: 'V', q: '7' }] });
const cloneChord = c => ({ rn: c.rn, q: c.q, ...(c.shape ? { shape: c.shape } : {}) });
const clone = p => ({ title: p.title, feel: p.feel, desc: p.desc || '', chords: p.chords.map(cloneChord) });

// Small chip showing a Roman numeral + its printed quality suffix (matches the app).
const Chip = ({ c }) => (
  <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffd93d', background: '#ffd93d11', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
    {c.rn}<span style={{ fontSize: '9px', opacity: 0.8 }}>{Q_SUFFIX[c.q] ?? c.q}</span>
  </span>
);

const selStyle = { background: '#0f0e17', border: '1px solid #2a2840', borderRadius: '8px', padding: '7px 8px', color: '#fff', fontSize: '13px', outline: 'none' };

export default function ProgressionEditor() {
  const [progs, setProgs] = useState(() => progSeed);
  const [draft, setDraft] = useState(null);
  const [fileHandle, setFileHandle] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [view, setView] = useState('edit'); // 'edit' | 'help'
  const [previewKey, setPreviewKey] = useState(0);
  const [showCowboy, setShowCowboy] = useState(false);
  const importRef = useRef(null);
  const editingOriginal = useRef(null);

  const hasFsAccess = typeof window !== 'undefined' && 'showOpenFilePicker' in window;
  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 2500); };
  const cowboyMap = useMemo(() => buildCowboyMap(chordSeed), []);
  const chordIndex = useMemo(() => buildChordIndex(chordSeed), []);
  // Movable library shapes available per quality (computed once).
  const shapesByQuality = useMemo(() => {
    const m = {};
    QUALITY_KEYS.forEach(q => { m[q] = shapesForQuality(q, chordSeed); });
    return m;
  }, []);

  // ── Draft derivation ──────────────────────────────────────────────────────
  const draftErrors = useMemo(() => (draft ? validateProgression(draft).errors : []), [draft]);
  const draftSlots = useMemo(() => {
    if (!draft) return [];
    return draft.chords.map(c => ({
      ...c,
      name: getChordName(previewKey, c.rn, c.q),
      voicing: voicingForSlot(c, previewKey, { cowboyMap: showCowboy ? cowboyMap : null, chordIndex }),
    }));
  }, [draft, previewKey, showCowboy, cowboyMap, chordIndex]);

  // ── Draft actions ─────────────────────────────────────────────────────────
  const startNew = () => { editingOriginal.current = null; setDraft(blankDraft()); };
  const startEdit = p => { editingOriginal.current = p; setDraft(clone(p)); };
  const startDuplicate = p => { editingOriginal.current = null; const d = clone(p); d.title = p.title + ' copy'; setDraft(d); };
  const cancel = () => { editingOriginal.current = null; setDraft(null); };
  const patch = pp => setDraft(d => ({ ...d, ...pp }));

  const setChord = (i, cp) => setDraft(d => ({ ...d, chords: d.chords.map((c, j) => (j === i ? { ...c, ...cp } : c)) }));
  const addChord = () => setDraft(d => ({ ...d, chords: [...d.chords, { rn: 'I', q: 'maj' }] }));
  const removeChord = i => setDraft(d => ({ ...d, chords: d.chords.filter((_, j) => j !== i) }));
  const moveChord = (i, dir) => setDraft(d => {
    const j = i + dir;
    if (j < 0 || j >= d.chords.length) return d;
    const chords = [...d.chords];
    [chords[i], chords[j]] = [chords[j], chords[i]];
    return { ...d, chords };
  });

  const save = () => {
    if (draftErrors.length) { flash('Fix errors before saving'); return; }
    const prog = { title: draft.title.trim(), feel: draft.feel, desc: draft.desc.trim(), chords: draft.chords.map(cloneChord) };
    setProgs(prev => {
      const orig = editingOriginal.current;
      if (orig) return prev.map(p => (p === orig ? prog : p));
      return [...prev, prog];
    });
    setDirty(true);
    editingOriginal.current = null;
    setDraft(null);
    flash('Saved to working set — remember to Save/Download the file');
  };

  const remove = p => {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    setProgs(prev => prev.filter(x => x !== p));
    setDirty(true);
    if (editingOriginal.current === p) cancel();
  };

  // ── File I/O (mirrors editor/Editor.jsx) ───────────────────────────────────
  const openFromDisk = async () => {
    try {
      const [handle] = await window.showOpenFilePicker({ types: [{ description: 'Progression JSON', accept: { 'application/json': ['.json'] } }] });
      const text = await (await handle.getFile()).text();
      const data = JSON.parse(text);
      const r = validateProgressions(data);
      if (!r.ok && !window.confirm(`File has ${r.errors.length} validation issue(s). Load anyway?\n\n${r.errors.slice(0, 8).join('\n')}`)) return;
      setProgs(data); setFileHandle(handle); setDirty(false); cancel();
      flash(`Opened ${data.length} progressions`);
    } catch (e) { if (e.name !== 'AbortError') flash('Open failed: ' + e.message); }
  };

  const saveToDisk = async () => {
    const r = validateProgressions(progs);
    if (!r.ok && !window.confirm(`${r.errors.length} validation issue(s) in the set. Save anyway?\n\n${r.errors.slice(0, 8).join('\n')}`)) return;
    const text = serializeArray(progs);
    try {
      if (fileHandle) {
        const w = await fileHandle.createWritable(); await w.write(text); await w.close();
        setDirty(false); flash('Saved to file ✓');
      } else if (hasFsAccess) {
        const handle = await window.showSaveFilePicker({ suggestedName: 'progressions.json', types: [{ description: 'Progression JSON', accept: { 'application/json': ['.json'] } }] });
        const w = await handle.createWritable(); await w.write(text); await w.close();
        setFileHandle(handle); setDirty(false); flash('Saved to file ✓');
      } else { download(text); }
    } catch (e) { if (e.name !== 'AbortError') flash('Save failed: ' + e.message); }
  };

  const download = (text = serializeArray(progs)) => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'progressions.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setDirty(false); flash('Downloaded progressions.json');
  };

  const importFile = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const r = validateProgressions(data);
        if (!r.ok && !window.confirm(`File has ${r.errors.length} validation issue(s). Load anyway?`)) return;
        setProgs(data); setFileHandle(null); setDirty(false); cancel(); flash(`Imported ${data.length} progressions`);
      } catch (err) { flash('Invalid JSON'); }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // ── List filtering ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = catFilter === 'all' ? progs : progs.filter(p => feelToCat(p.feel) === catFilter);
    const q = search.trim().toLowerCase();
    if (q) r = r.filter(p => p.title.toLowerCase().includes(q) || p.feel.toLowerCase().includes(q) || p.chords.some(c => c.rn.toLowerCase().includes(q)));
    return r;
  }, [progs, catFilter, search]);

  const setValid = useMemo(() => validateProgressions(progs), [progs]);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={{ fontSize: '20px', fontWeight: 900 }}>🎵 <span style={{ color: '#a29bfe' }}>Progression</span> Editor</div>
        <span style={{ fontSize: '11px', color: '#888' }}>{progs.length} progressions{dirty && <span style={{ color: '#ff6b6b', fontWeight: 700 }}> · unsaved</span>}</span>
        <span style={{ fontSize: '11px', color: setValid.ok ? '#00b894' : '#ff6363', fontWeight: 700 }}>{setValid.ok ? '✓ all valid' : `✗ ${setValid.errors.length} issue(s)`}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {hasFsAccess && <button onClick={openFromDisk} style={btn(false, '#74b9ff')}>Open file…</button>}
          <button onClick={saveToDisk} style={btn(true, '#00b894')}>{fileHandle ? 'Save file ✓' : 'Save file…'}</button>
          <button onClick={() => download()} style={btn(false, '#a29bfe')}>Download</button>
          <button onClick={() => importRef.current?.click()} style={btn(false, '#4ecdc4')}>Import</button>
          <input ref={importRef} type="file" accept=".json" onChange={importFile} style={{ display: 'none' }} />
        </div>
      </div>
      {msg && <div style={{ background: '#a29bfe18', border: '1px solid #a29bfe44', color: '#a29bfe', borderRadius: '9px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', fontWeight: 600 }}>{msg}</div>}
      {!hasFsAccess && <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>Your browser can't save in place — use <b>Download</b> to export and <b>Import</b> to reload. (Chrome/Edge support direct file editing.)</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {[{ id: 'edit', label: '✏️ Editor' }, { id: 'help', label: '📖 How to publish' }].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={btn(view === t.id, '#a29bfe')}>{t.label}</button>
        ))}
      </div>

      {view === 'help' && <Instructions hasFsAccess={hasFsAccess} />}

      {view === 'edit' && (
      <div style={{ display: 'grid', gridTemplateColumns: draft ? '320px 1fr' : '1fr', gap: '14px', alignItems: 'start' }}>
        {/* List */}
        <div style={panel}>
          <button onClick={startNew} style={{ ...btn(true, '#a29bfe'), width: '100%', marginBottom: '10px', padding: '9px' }}>+ New progression</button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ width: '100%', background: '#0f0e17', border: '1px solid #2a2840', borderRadius: '8px', padding: '7px 10px', color: '#fff', fontSize: '13px', marginBottom: '8px', outline: 'none' }} />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: '100%', ...selStyle, fontSize: '12px', marginBottom: '10px' }}>
            <option value="all">All categories ({progs.length})</option>
            {BROAD_CATS.map(bc => <option key={bc.id} value={bc.id}>{bc.emoji} {bc.label} ({progs.filter(p => feelToCat(p.feel) === bc.id).length})</option>)}
          </select>
          <div style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {filtered.map((p, i) => {
              const bc = BROAD_CATS.find(b => b.id === feelToCat(p.feel));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: editingOriginal.current === p ? '#1e1c32' : '#0f0e17', border: `1px solid ${editingOriginal.current === p ? '#a29bfe' : '#2a2840'}`, borderRadius: '8px', padding: '6px 8px' }}>
                  <div onClick={() => startEdit(p)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>{p.title}</div>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {p.chords.map((c, ci) => <Chip key={ci} c={c} />)}
                    </div>
                    {bc && <div style={{ fontSize: '9px', color: bc.color, marginTop: '3px' }}>{bc.emoji} {p.feel}</div>}
                  </div>
                  <button title="Duplicate" onClick={() => startDuplicate(p)} style={{ ...btn(false), minHeight: '26px', padding: '3px 7px', fontSize: '11px' }}>⧉</button>
                  <button title="Delete" onClick={() => remove(p)} style={{ ...btn(false, '#ff6363'), minHeight: '26px', padding: '3px 7px', fontSize: '11px' }}>✕</button>
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px' }}>No progressions match.</div>}
          </div>
        </div>

        {/* Editor form */}
        {draft && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Metadata */}
            <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Field label="Title" value={draft.title} onChange={v => patch({ title: v })} placeholder="e.g. ii–V–I" />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <div style={labelCss}>Feel</div>
                  <select value={draft.feel} onChange={e => patch({ feel: e.target.value })} style={{ width: '100%', ...selStyle }}>
                    {FEEL_KEYS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <FeelBadge feel={draft.feel} />
              </div>
              <div>
                <div style={labelCss}>Description</div>
                <textarea value={draft.desc} onChange={e => patch({ desc: e.target.value })} placeholder="What makes this progression tick…" rows={2}
                  style={{ width: '100%', background: '#0f0e17', border: '1px solid #2a2840', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>

            {/* Sequence builder */}
            <div style={panel}>
              <div style={labelCss}>Chords — Roman numeral + quality + shape, in order</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {draft.chords.map((c, i) => {
                  const shapes = shapesByQuality[c.q] || [];
                  return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '5px', borderBottom: '1px solid #1a1928', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '20px', fontSize: '11px', color: '#666', fontWeight: 700, textAlign: 'right' }}>{i + 1}</span>
                      <select value={c.rn} onChange={e => setChord(i, { rn: e.target.value })} style={{ ...selStyle, fontFamily: 'monospace' }}>
                        {RN_KEYS.map(rn => <option key={rn} value={rn}>{rn}</option>)}
                      </select>
                      <select value={c.q} onChange={e => setChord(i, { q: e.target.value, shape: '' })} style={{ ...selStyle, flex: 1 }}>
                        {QUALITY_KEYS.map(q => <option key={q} value={q}>{q}{hasVoicing(q) ? '' : ' — no diagram'}</option>)}
                      </select>
                      <button title="Move up" onClick={() => moveChord(i, -1)} disabled={i === 0} style={{ ...btn(false), minWidth: '28px', padding: '4px 6px', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                      <button title="Move down" onClick={() => moveChord(i, 1)} disabled={i === draft.chords.length - 1} style={{ ...btn(false), minWidth: '28px', padding: '4px 6px', opacity: i === draft.chords.length - 1 ? 0.3 : 1 }}>↓</button>
                      <button title="Remove" onClick={() => removeChord(i)} style={{ ...btn(false, '#ff6363'), minWidth: '28px', padding: '4px 6px' }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '26px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: '#888', flexShrink: 0 }}>Shape</span>
                        <select value={shapes.some(s => s.id === c.shape) ? c.shape : ''} onChange={e => setChord(i, { shape: e.target.value })} style={{ ...selStyle, flex: 1, fontSize: '12px', padding: '5px 8px' }}>
                          <option value="">Auto — default {Q_SUFFIX[c.q] || c.q} template</option>
                          {shapes.map(s => <option key={s.id} value={s.id}>{(CATS[s.cat]?.label || s.cat)} · {(s.voicings[0]?.label || '').split(' · ')[0] || s.name}</option>)}
                        </select>
                        <input value={c.shape || ''} onChange={e => setChord(i, { shape: e.target.value.trim() })} placeholder="or chord id…"
                          style={{ width: '116px', background: '#0f0e17', border: '1px solid #2a2840', borderRadius: '8px', padding: '5px 8px', color: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'monospace' }} />
                      </div>
                      {c.shape && (chordIndex[c.shape]
                        ? <div style={{ fontSize: '10px', color: '#00b894', paddingLeft: '40px' }}>✓ {chordIndex[c.shape].name} <span style={{ color: '#666' }}>({chordIndex[c.shape].sym})</span></div>
                        : <div style={{ fontSize: '10px', color: '#ff6363', paddingLeft: '40px' }}>✗ no chord with id "{c.shape}" — will use the default template</div>)}
                    </div>
                  </div>
                  );
                })}
              </div>
              <button onClick={addChord} style={{ ...btn(false, '#a29bfe'), marginTop: '10px' }}>+ Add chord</button>
            </div>

            {/* Live preview */}
            <div style={panel}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={labelCss}>Preview · key of <span style={{ color: '#ffd93d' }}>{NOTE_NAMES[previewKey]}</span></div>
                <button onClick={() => setShowCowboy(s => !s)} style={btn(showCowboy, '#74b9ff')}>🎸 Open Pos.</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '12px' }}>
                {NOTE_NAMES.map((n, i) => (
                  <button key={i} onClick={() => setPreviewKey(i)} style={{ ...btn(i === previewKey), minWidth: '30px', padding: '4px 7px' }}>{n}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {draftSlots.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ background: '#0f0e17', borderRadius: '10px', padding: '10px 8px 8px', border: '1px solid #2a2840', minWidth: '92px', textAlign: 'center' }}>
                      {s.voicing ? (<>
                        <ChordDiagram v={s.voicing} showDeg size={0.95} />
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', marginTop: '3px' }}>{s.name}</div>
                        <div style={{ fontSize: '10px', color: '#ffd93d', marginTop: '1px', marginBottom: '5px', fontWeight: 700 }}>{s.rn}</div>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button onClick={() => playVoicing(s.voicing, 'strum')} style={{ ...btn(false), minHeight: '26px', padding: '3px 7px', fontSize: '11px' }}>♬</button>
                          <button onClick={() => playVoicing(s.voicing, 'arp')} style={{ ...btn(false), minHeight: '26px', padding: '3px 7px', fontSize: '11px' }}>♩</button>
                        </div>
                      </>) : (
                        <div style={{ padding: '24px 8px', color: '#555', fontSize: '11px' }}>{s.name}<br /><span style={{ fontSize: '9px' }}>no voicing</span></div>
                      )}
                    </div>
                    {i < draftSlots.length - 1 && <span style={{ color: '#333', fontSize: '16px' }}>→</span>}
                  </div>
                ))}
              </div>
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
                {editingOriginal.current ? 'Update progression' : 'Add progression'}
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

function FeelBadge({ feel }) {
  const bc = BROAD_CATS.find(b => b.id === feelToCat(feel));
  if (!bc) return null;
  return <span style={{ fontSize: '11px', background: bc.color + '22', color: bc.color, padding: '8px 10px', borderRadius: '8px', fontWeight: 700, whiteSpace: 'nowrap' }}>{bc.emoji} {bc.label}</span>;
}

// Instructions tab — how an edit here becomes a change in the live app.
function Instructions({ hasFsAccess }) {
  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ ...panel, marginBottom: '14px', borderColor: '#a29bfe44' }}>
        <div style={{ fontSize: '13px', color: '#ddd', lineHeight: 1.6 }}>
          <b style={{ color: '#a29bfe' }}>How this works.</b> This editor changes a <b>local copy</b> of the progression
          data. The live app reads <code style={code}>data/progressions.json</code> from the repo, so your edits go
          live only after that file is committed and the site redeploys. Each progression is a list of
          <b> Roman numeral + quality</b> chords (e.g. <code style={code}>ii · m7</code>) — the app transposes them
          to any key automatically. Here's the full loop:
        </div>
      </div>

      <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Step n="1" title="Build your progression">
          Add, duplicate, edit, or delete progressions in the <b>Editor</b> tab. Pick each chord's numeral and
          quality from the dropdowns and reorder with <b>↑ / ↓</b>. The preview transposes to any key and plays
          back — and the header shows a live
          <span style={{ color: '#00b894', fontWeight: 700 }}> ✓ all valid </span> /
          <span style={{ color: '#ff6363', fontWeight: 700 }}> ✗ issues</span> status so you can't save a broken one.
        </Step>

        <Step n="2" title="Save the JSON file">
          {hasFsAccess ? (
            <>On Chrome/Edge desktop: click <b>Open file…</b> and pick the repo's
            <code style={code}>data/progressions.json</code>, edit, then <b>Save file ✓</b> to write straight back to it.
            Otherwise <b>Save file…</b> / <b>Download</b> writes a fresh <code style={code}>progressions.json</code>.</>
          ) : (
            <>Your browser can't write files directly, so click <b>Download</b> to get an updated
            <code style={code}> progressions.json</code>. (Tip: desktop Chrome or Edge can edit in place via <b>Open file…</b>.)</>
          )}
        </Step>

        <Step n="3" title="Put it in the repo">
          Replace <code style={code}>data/progressions.json</code> in the project with the file you just saved
          (skip this if you used <b>Open file…</b> on that exact file).
        </Step>

        <Step n="4" title="Commit & push to GitHub">
          <div style={{ ...code, display: 'block', padding: '8px 10px', marginTop: '6px', whiteSpace: 'pre-wrap', color: '#9be7c4' }}>git add data/progressions.json{'\n'}git commit -m "Update progressions"{'\n'}git push</div>
        </Step>

        <Step n="5" title="Vercel redeploys automatically">
          Pushing to <code style={code}>main</code> triggers a Vercel build. After ~1 minute the live app at
          <code style={code}> chord-trainer-mauve.vercel.app</code> serves the new progressions (open the
          <b> Progs</b> tab). If installed as an app, tap <b>↻ Update</b> in Settings (or reload) to pull it in.
        </Step>
      </div>
    </div>
  );
}
