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
    <div style={{ fontSize: 13, fontFamily: 'var(--font-body)' }}>
      <div style={{
        color: 'var(--text-secondary)',
        marginBottom: 10,
        fontWeight: 500,
        fontSize: 12,
        letterSpacing: '0.04em',
      }}>
        画布内容 ({totalItems})
      </div>
      {totalItems === 0 ? (
        <div style={{
          color: 'var(--text-muted)',
          fontSize: 12,
          padding: '12px 0',
          textAlign: 'center',
        }}>
          画布为空
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          maxHeight: 220,
          overflowY: 'auto',
        }}>
          {[...images].reverse().map((img) => (
            <div
              key={img.id}
              style={{
                padding: '8px 10px',
                background: 'var(--ink-light)',
                borderRadius: 'var(--radius)',
                fontSize: 12,
                border: '1px solid rgba(212,145,42,0.2)',
                color: 'var(--text-primary)',
                lineHeight: 1.4,
              }}
            >
              <span style={{ marginRight: 8 }}>🖼</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {img.prompt.slice(0, 24)}{img.prompt.length > 24 ? '…' : ''}
              </span>
            </div>
          ))}
          {[...objects].reverse().map((obj) => (
            <div
              key={obj.shape.id}
              onClick={() => setSelectedId(selectedId === obj.shape.id ? null : obj.shape.id)}
              style={{
                padding: '8px 10px',
                background: selectedId === obj.shape.id ? 'var(--ink-mid)' : 'var(--ink-light)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                border: selectedId === obj.shape.id ? '1px solid var(--accent)' : '1px solid transparent',
                fontSize: 12,
                lineHeight: 1.4,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>{obj.shape.kind}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}>
                {obj.shape.id}
              </span>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            background: 'var(--ink-light)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}
        >
          <div><span style={{ color: 'var(--text-muted)' }}>ID: </span>{selected.shape.id}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>类型: </span>{selected.shape.kind}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>层级: </span>{selected.zIndex}</div>
          {'fill' in selected.shape && (
            <div><span style={{ color: 'var(--text-muted)' }}>填充: </span>{selected.shape.fill as string}</div>
          )}
        </div>
      )}
    </div>
  );
}
