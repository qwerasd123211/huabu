import { useVoiceStore } from '../../stores/voiceStore';

export default function VoiceStatusBadge() {
  const status = useVoiceStore((s) => s.status);

  const CONFIG: Record<string, { label: string; color: string }> = {
    sleeping: { label: '说"小花小花"唤醒', color: 'var(--accent)' },
    waking: { label: '唤醒中…', color: 'var(--accent-glow)' },
    greeting: { label: '小花问候中…', color: 'var(--accent-glow)' },
    listening: { label: '正在聆听…', color: 'var(--success)' },
    processing: { label: 'AI 思考中…', color: 'var(--warning)' },
    speaking: { label: '已理解 ✓', color: 'var(--success)' },
    error: { label: '出现错误', color: 'var(--danger)' },
  };

  const config = CONFIG[status] || CONFIG.sleeping;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 16px',
        background: 'var(--ink-light)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        fontSize: 12,
        color: config.color,
        fontWeight: 500,
        fontFamily: 'var(--font-body)',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: config.color,
          display: 'inline-block',
          boxShadow: `0 0 6px ${config.color}`,
        }}
      />
      {config.label}
    </div>
  );
}
