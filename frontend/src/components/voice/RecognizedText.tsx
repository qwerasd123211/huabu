import { useVoiceStore } from '../../stores/voiceStore';

export default function RecognizedText() {
  const finalText = useVoiceStore((s) => s.finalText);
  const interimText = useVoiceStore((s) => s.interimText);
  const status = useVoiceStore((s) => s.status);

  if (status === 'sleeping') return null;

  const displayText = finalText || interimText;

  return (
    <div
      style={{
        padding: '10px 14px',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        fontSize: 14,
        color: finalText ? 'var(--text-primary)' : 'var(--text-muted)',
        fontStyle: interimText ? 'italic' : 'normal',
        minHeight: 40,
        wordBreak: 'break-word',
      }}
    >
      {displayText || <span style={{ color: 'var(--text-muted)' }}>说到的话会显示在这里...</span>}
    </div>
  );
}
