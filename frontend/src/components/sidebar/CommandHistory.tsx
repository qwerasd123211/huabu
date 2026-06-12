import { useVoiceStore } from '../../stores/voiceStore';

export default function CommandHistory() {
  const commandHistory = useVoiceStore((s) => s.commandHistory);

  if (commandHistory.length === 0) {
    return (
      <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
        还没有指令记录
        <br />
        说出你的第一个绘图指令吧
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
      {[...commandHistory].reverse().map((entry) => (
        <div
          key={entry.id}
          style={{
            padding: '8px 10px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            fontSize: 12,
          }}
        >
          <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>
            "{entry.text}"
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
            {entry.response}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 3 }}>
            置信度: {(entry.confidence * 100).toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  );
}
