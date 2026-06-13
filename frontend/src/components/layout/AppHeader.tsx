import VoiceStatusBadge from '../voice/VoiceStatusBadge';

export default function AppHeader() {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 28px',
        background: 'var(--ink-light)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          style={{
            fontSize: 26,
            filter: 'saturate(0.8)',
          }}
        >
          🖌️
        </span>
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: 0,
              fontFamily: 'var(--font-display)',
              color: 'var(--accent)',
              letterSpacing: '0.06em',
            }}
          >
            语音画布
          </h1>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.08em',
              marginTop: 1,
            }}
          >
            VOICE CANVAS
          </div>
        </div>
      </div>
      <VoiceStatusBadge />
    </header>
  );
}
