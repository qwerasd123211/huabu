import { renderCanvas } from './canvasRenderer';
import type { DrawableObject } from '../types/dsl';
import type { ImageLayer } from '../stores/imageStore';

interface ExportOptions {
  objects: DrawableObject[];
  images: ImageLayer[];
  loadedImages: Map<string, HTMLImageElement>;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawImageLayer(ctx: CanvasRenderingContext2D, layer: ImageLayer, img: HTMLImageElement): void {
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

export async function exportCanvasAsPng({
  objects,
  images,
  loadedImages,
  width,
  height,
}: ExportOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is unavailable');

  renderCanvas(ctx, objects, width, height);

  for (const layer of images) {
    const cached = loadedImages.get(layer.id);
    const img = cached && cached.complete ? cached : await loadImage(layer.imageUrl);
    if (img) drawImageLayer(ctx, layer, img);
  }

  if (objects.length === 0 && images.length === 0) {
    ctx.strokeStyle = '#2a2520';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  return canvas.toDataURL('image/png');
}

export function downloadPng(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
