import type { DrawableObject } from '../types/dsl';
import { useCanvasStore } from '../stores/canvasStore';

interface GalleryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  x: number;
  y: number;
  scale: number;
}

export function renderGalleryImages(
  ctx: CanvasRenderingContext2D,
  images: GalleryItem[],
  loadedImages: Map<string, HTMLImageElement>
): void {
  for (const item of images) {
    const img = loadedImages.get(item.id);
    if (!img || !img.complete) continue;

    const w = img.width * item.scale;
    const h = img.height * item.scale;
    const x = item.x - w / 2;
    const y = item.y - h / 2;

    ctx.save();
    // Subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    // Rounded rect clip for the image
    const radius = 12;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }
}
