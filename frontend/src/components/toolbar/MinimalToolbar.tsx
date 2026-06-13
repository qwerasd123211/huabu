import { useCanvasStore } from '../../stores/canvasStore';

export default function MinimalToolbar() {
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const clear = useCanvasStore((s) => s.clear);
  const objects = useCanvasStore((s) => s.objects);
  const hasItems = objects.length > 0;

  const buttons = [
    { label: '撤销', icon: '↩', action: undo, disabled: !hasItems },
    { label: '重做', icon: '↪', action: redo, disabled: !hasItems },
    { label: '清空', icon: '✕', action: clear, disabled: !hasItems, danger: true },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: '6px 8px',
        background: 'var(--ink-light)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}
    >
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.action}
          disabled={btn.disabled}
          title={btn.label}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 'var(--radius)',
            background: btn.disabled ? 'transparent' : 'transparent',
            color: btn.disabled ? 'var(--text-muted)' : btn.danger ? 'var(--danger)' : 'var(--text-secondary)',
            cursor: btn.disabled ? 'not-allowed' : 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s ease',
            opacity: btn.disabled ? 0.4 : 1,
          }}
          onMouseEnter={(e) => {
            if (!btn.disabled) {
              e.currentTarget.style.background = 'var(--ink-mid)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = btn.disabled ? 'var(--text-muted)' : btn.danger ? 'var(--danger)' : 'var(--text-secondary)';
          }}
        >
          <span style={{ fontSize: 14 }}>{btn.icon}</span>
          <span>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}
