import VoiceStatusBadge from '../voice/VoiceStatusBadge';

export default function AppHeader() {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20 }}>🎨</span>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          语音画布
        </h1>
      </div>
      <VoiceStatusBadge />
    </header>
  );
}
