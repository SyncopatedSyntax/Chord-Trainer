import { useState } from 'react';
import Editor from './Editor.jsx';
import ProgressionEditor from './ProgressionEditor.jsx';
import { btn } from './ui.jsx';

// Initial tab from ?tab=progs|chords (lets the app's Settings deep-link a tab).
const initialMode = () => {
  try { return new URLSearchParams(location.search).get('tab') === 'progs' ? 'progs' : 'chords'; }
  catch { return 'chords'; }
};

// Top-level switch between the two authoring surfaces on /editor.html.
export default function EditorApp() {
  const [mode, setMode] = useState(initialMode); // 'chords' | 'progs'
  const go = m => {
    setMode(m);
    // Keep the URL in sync so a refresh/bookmark stays on this tab.
    try { const u = new URL(location.href); u.searchParams.set('tab', m); history.replaceState(null, '', u); } catch {}
  };
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
