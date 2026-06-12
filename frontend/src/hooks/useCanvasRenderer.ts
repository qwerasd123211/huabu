import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import { renderCanvas } from '../engine/canvasRenderer';

export function useCanvasRenderer(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const objects = useCanvasStore((s) => s.objects);
  const canvasWidth = useCanvasStore((s) => s.canvasWidth);
  const canvasHeight = useCanvasStore((s) => s.canvasHeight);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use requestAnimationFrame for smooth rendering
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      renderCanvas(ctx, objects, canvasWidth, canvasHeight);
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [objects, canvasWidth, canvasHeight, canvasRef]);
}
