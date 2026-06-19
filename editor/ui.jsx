// Shared editor UI primitives — used by both the Chord Editor (Editor.jsx) and
// the Progression Editor (ProgressionEditor.jsx) so they look identical.

// Toggle/pill button style. `on` highlights it in `color`.
export const btn = (on, color = '#ffd93d') => ({
  padding: '5px 9px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
  border: `1px solid ${on ? color : '#2a2840'}`, background: on ? color + '22' : '#13121f',
  color: on ? color : '#888', minHeight: '32px', touchAction: 'manipulation',
});
export const panel = { background: '#13121f', border: '1px solid #2a2840', borderRadius: '11px', padding: '12px' };
export const labelCss = { fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' };

// Serialize an array as pretty JSON, one object per line (matches data files).
export const serializeArray = arr => '[\n' + arr.map(x => '  ' + JSON.stringify(x)).join(',\n') + '\n]\n';

// Labelled text input.
export function Field({ label, value, onChange, placeholder, mono }) {
  return (
    <div>
      <div style={labelCss}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: '#0f0e17', border: '1px solid #2a2840', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: mono ? 'monospace' : 'inherit' }} />
    </div>
  );
}

// Numbered step (used by the "How to publish" instructions).
export function Step({ n, title, children }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, width: '26px', height: '26px', borderRadius: '50%', background: '#ffd93d', color: '#111', fontWeight: 900, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '3px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#bbb', lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

// Inline-code style for the instructions.
export const code = { background: '#0f0e17', border: '1px solid #2a2840', borderRadius: '5px', padding: '1px 6px', fontFamily: 'monospace', fontSize: '12px', color: '#ffd93d' };
