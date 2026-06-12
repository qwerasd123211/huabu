import { useVoiceStore } from '../../stores/voiceStore';
import type { VoiceStatus } from '../../stores/voiceStore';

const STATUS_CONFIG: Record<VoiceStatus, { label: string; color: string; animation: string }> = {
  sleeping: { label: '说"小花小花"唤醒', color: 'var(--accent-glow)', animation: 'wake-pulse 2.5s ease-in-out infinite' },
  waking: { label: '唤醒中...', color: 'var(--accent-glow)', animation: 'voice-pulse 0.6s ease-in-out infinite' },
  greeting: { label: '小花问候中...', color: 'var(--accent-glow)', animation: 'voice-pulse 1.2s ease-in-out infinite' },
  listening: { label: '正在聆听...', color: 'var(--success)', animation: 'voice-pulse 1.2s ease-in-out infinite' },
  processing: { label: 'AI 思考中...', color: 'var(--warning)', animation: 'voice-spin 0.8s linear infinite' },
  speaking: { label: '已理解 ✓', color: 'var(--success)', animation: '' },
  error: { label: '出现错误', color: 'var(--danger)', animation: '' },
};

export default function VoiceStatusBadge() {
  const status = useVoiceStore((s) => s.status);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.sleeping;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: 'var(--bg-tertiary)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        fontSize: 13,
        color: config.color,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: config.color,
          display: 'inline-block',
          animation: config.animation,
          boxShadow: `0 0 8px ${config.color}`,
        }}
      />
      {config.label}
    </div>
  );
}
