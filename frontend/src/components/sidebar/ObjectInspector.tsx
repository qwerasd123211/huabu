import { useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useImageStore } from '../../stores/imageStore';

export default function ObjectInspector() {
  const objects = useCanvasStore((s) => s.objects);
  const images = useImageStore((s) => s.images);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = objects.find((o) => o.shape.id === selectedId);
  const totalItems = objects.length + images.length;

  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
        画布内容 ({totalItems})
      </div>
      {totalItems === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>画布为空</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
          {[...images].reverse().map((img) => (
            <div
              key={img.id}
              style={{
                padding: '6px 8px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                border: '1px solid var(--accent-glow)',
                color: 'var(--text-primary)',
              }}
            >
              <span>🖼 AI图片</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}>
                {img.prompt.slice(0, 20)}{img.prompt.length > 20 ? '...' : ''}
              </span>
            </div>
          ))}
          {[...objects].reverse().map((obj) => (
            <div
              key={obj.shape.id}
              onClick={() => setSelectedId(selectedId === obj.shape.id ? null : obj.shape.id)}
              style={{
                padding: '6px 8px',
                background: selectedId === obj.shape.id ? 'var(--bg-tertiary)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                border: selectedId === obj.shape.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>{obj.shape.kind}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{obj.shape.id}</span>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--accent-primary)',
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          <div>ID: {selected.shape.id}</div>
          <div>类型: {selected.shape.kind}</div>
          <div>层级: {selected.zIndex}</div>
          {'fill' in selected.shape && <div>填充: {selected.shape.fill as string}</div>}
        </div>
      )}
    </div>
  );
}
