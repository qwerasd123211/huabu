import { useRef, useEffect } from 'react';
import { renderCanvas } from '../../engine/canvasRenderer';
import { useCanvasStore } from '../../stores/canvasStore';
import { useImageStore } from '../../stores/imageStore';

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWidth = useCanvasStore((s) => s.canvasWidth);
  const canvasHeight = useCanvasStore((s) => s.canvasHeight);
  const objects = useCanvasStore((s) => s.objects);

  const images = useImageStore((s) => s.images);
  const loadedImages = useImageStore((s) => s.loadedImages);
  const setLoadedImage = useImageStore((s) => s.setLoadedImage);

  // Preload images
  useEffect(() => {
    for (const layer of images) {
      if (!loadedImages.has(layer.id)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => setLoadedImage(layer.id, img);
        img.onerror = () => console.warn('Failed to load image:', layer.imageUrl);
        img.src = layer.imageUrl;
      }
    }
  }, [images, loadedImages, setLoadedImage]);

  // Scale canvas CSS to fit container, preserving virtual 800×600 coordinate system
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      const scaleX = container.clientWidth / canvasWidth;
      const scaleY = container.clientHeight / canvasHeight;
      const scale = Math.min(scaleX, scaleY, 1);
      canvas.style.width = `${canvasWidth * scale}px`;
      canvas.style.height = `${canvasHeight * scale}px`;
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [canvasWidth, canvasHeight]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const render = () => {
      ctx.fillStyle = '#121010';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      renderCanvas(ctx, objects, canvasWidth, canvasHeight);

      for (const layer of images) {
        const img = loadedImages.get(layer.id);
        if (!img || !img.complete) {
          ctx.fillStyle = '#1e1a18';
          ctx.strokeStyle = 'rgba(212,145,42,0.3)';
          ctx.lineWidth = 2;
          const pw = 800 * layer.scale;
          const ph = 800 * layer.scale;
          const px = layer.x - pw / 2;
          const py = layer.y - ph / 2;
          ctx.fillRect(px, py, pw, ph);
          ctx.strokeRect(px, py, pw, ph);
          ctx.fillStyle = '#8a8070';
          ctx.font = '14px "Noto Sans SC", "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('AI 正在生成图像...', layer.x, layer.y);
          continue;
        }

        const w = img.width * layer.scale;
        const h = img.height * layer.scale;
        const x = layer.x - w / 2;
        const y = layer.y - h / 2;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;

        const r = 16;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, x, y, w, h);
        ctx.restore();

        ctx.fillStyle = '#8a8070';
        ctx.font = '12px "Noto Sans SC", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(layer.prompt.slice(0, 60), layer.x, y + h + 20);
      }

      if (objects.length === 0 && images.length === 0) {
        ctx.strokeStyle = '#2a2520';
        ctx.lineWidth = 1;
        for (let x = 0; x <= canvasWidth; x += 100) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvasHeight);
          ctx.stroke();
        }
        for (let y = 0; y <= canvasHeight; y += 100) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvasWidth, y);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [objects, images, loadedImages, canvasWidth, canvasHeight]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ink)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--border)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          display: 'block',
          borderRadius: 'var(--radius)',
          boxShadow: '0 0 40px rgba(212,145,42,0.05)',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          aspectRatio: `${canvasWidth} / ${canvasHeight}`,
        }}
      />
    </div>
  );
}
