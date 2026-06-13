import { useVoiceStore } from '../../stores/voiceStore';

export default function CommandHistory() {
  const commandHistory = useVoiceStore((s) => s.commandHistory);

  if (commandHistory.length === 0) {
    return (
      <div style={{
        padding: '16px 0',
        color: 'var(--text-muted)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 1.7,
        fontFamily: 'var(--font-body)',
      }}>
        还没有指令记录<br />
        说出你的第一个绘图指令吧
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxHeight: 260,
      overflowY: 'auto',
    }}>
      {[...commandHistory].reverse().map((entry) => (
        <div
          key={entry.id}
          style={{
            padding: '10px 12px',
            background: 'var(--ink-light)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            fontSize: 12,
            lineHeight: 1.5,
            fontFamily: 'var(--font-body)',
            animation: 'fadeUp 0.3s ease',
          }}
        >
          <div style={{
            color: 'var(--text-primary)',
            fontWeight: 500,
            marginBottom: 4,
            fontFamily: 'var(--font-display)',
          }}>
            "{entry.text}"
          </div>
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: 11,
            marginBottom: 3,
          }}>
            {entry.response}
          </div>
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{
              display: 'inline-block',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: entry.confidence > 0.7 ? 'var(--success)' : entry.confidence > 0.4 ? 'var(--warning)' : 'var(--danger)',
            }} />
            置信度 {(entry.confidence * 100).toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  );
}
