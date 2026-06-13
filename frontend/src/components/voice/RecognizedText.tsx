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
        padding: '12px 16px',
        background: 'var(--ink-light)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        fontSize: 14,
        color: finalText ? 'var(--text-primary)' : 'var(--text-muted)',
        fontStyle: interimText ? 'italic' : 'normal',
        minHeight: 44,
        wordBreak: 'break-word',
        lineHeight: 1.6,
        fontFamily: 'var(--font-body)',
      }}
    >
      {displayText || (
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          说到的话会显示在这里…
        </span>
      )}
    </div>
  );
}
