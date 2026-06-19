import { useState, useEffect } from 'react';
import Editor from './Editor.jsx';
import ProgressionEditor from './ProgressionEditor.jsx';
import { btn } from './ui.jsx';

// Initial tab from the URL hash (#progs|#chords). A hash is used instead of a
// query string so the service worker still sees a clean /editor.html that
// matches the precache — a ?query would miss the precache and the SPA
// navigateFallback would serve index.html (the trainer) instead.
const initialMode = () => {
  try {
    const h = (location.hash || '').replace('#', '').toLowerCase();
    if (h === 'progs' || h === 'chords') return h;
    // Back-compat with the earlier ?tab= links.
    return new URLSearchParams(location.search).get('tab') === 'progs' ? 'progs' : 'chords';
  } catch { return 'chords'; }
};

// Top-level switch between the two authoring surfaces on /editor.html.
export default function EditorApp() {
  const [mode, setMode] = useState(initialMode); // 'chords' | 'progs'
  const go = m => {
    setMode(m);
    // Keep the URL in sync so a refresh/bookmark stays on this tab.
    try { history.replaceState(null, '', '#' + m); } catch {}
  };
  // Follow hash changes (e.g. browser back/forward, or editing the URL).
  useEffect(() => {
    const onHash = () => setMode(initialMode());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', padding: '14px 16px 0', flexWrap: 'wrap' }}>
        <button onClick={() => go('chords')} style={{ ...btn(mode === 'chords', '#ffd93d'), padding: '8px 16px' }}>🎸 Chord Editor</button>
        <button onClick={() => go('progs')} style={{ ...btn(mode === 'progs', '#a29bfe'), padding: '8px 16px' }}>🎵 Progression Editor</button>
      </div>
      {mode === 'chords' ? <Editor /> : <ProgressionEditor />}
    </div>
  );
}
