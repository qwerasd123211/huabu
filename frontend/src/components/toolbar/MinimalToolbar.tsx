import { useCanvasStore } from '../../stores/canvasStore';

export default function MinimalToolbar() {
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const clear = useCanvasStore((s) => s.clear);
  const objects = useCanvasStore((s) => s.objects);

  const buttons = [
    { label: '撤销', icon: '↩', action: undo, disabled: objects.length === 0 },
    { label: '重做', icon: '↪', action: redo, disabled: objects.length === 0 },
    { label: '清空', icon: '✕', action: clear, disabled: objects.length === 0, danger: true },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        padding: '8px 12px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
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
            padding: '6px 14px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)',
            color: btn.disabled ? 'var(--text-muted)' : btn.danger ? 'var(--danger)' : 'var(--text-primary)',
            cursor: btn.disabled ? 'not-allowed' : 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all var(--transition)',
            opacity: btn.disabled ? 0.4 : 1,
          }}
        >
          <span>{btn.icon}</span>
          <span>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}
