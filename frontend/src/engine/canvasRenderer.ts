import type { Shape, DrawableObject } from '../types/dsl';

// Pure function: renders a single shape to a Canvas 2D context
function drawShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
  ctx.save();

  switch (shape.kind) {
    case 'circle': {
      ctx.fillStyle = shape.fill;
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = shape.strokeWidth;
      ctx.beginPath();
      ctx.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2);
      if (shape.fill && shape.fill !== 'none') ctx.fill();
      if (shape.stroke && shape.stroke !== 'none') ctx.stroke();
      break;
    }

    case 'rect': {
      ctx.fillStyle = shape.fill;
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = shape.strokeWidth;
      if (shape.fill && shape.fill !== 'none') {
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      }
      if (shape.stroke && shape.stroke !== 'none') {
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      }
      break;
    }

    case 'triangle': {
      ctx.fillStyle = shape.fill;
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = shape.strokeWidth;
      ctx.beginPath();
      ctx.moveTo(shape.points[0], shape.points[1]);
      ctx.lineTo(shape.points[2], shape.points[3]);
      ctx.lineTo(shape.points[4], shape.points[5]);
      ctx.closePath();
      if (shape.fill && shape.fill !== 'none') ctx.fill();
      if (shape.stroke && shape.stroke !== 'none') ctx.stroke();
      break;
    }

    case 'line': {
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = shape.strokeWidth;
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
      break;
    }

    case 'polygon': {
      if (shape.points.length < 4) break;
      ctx.fillStyle = shape.fill;
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = shape.strokeWidth;
      ctx.beginPath();
      ctx.moveTo(shape.points[0], shape.points[1]);
      for (let i = 2; i < shape.points.length; i += 2) {
        ctx.lineTo(shape.points[i], shape.points[i + 1]);
      }
      ctx.closePath();
      if (shape.fill && shape.fill !== 'none') ctx.fill();
      if (shape.stroke && shape.stroke !== 'none') ctx.stroke();
      break;
    }

    case 'freehand': {
      if (shape.points.length < 4) break;
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = shape.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(shape.points[0], shape.points[1]);
      for (let i = 2; i < shape.points.length; i += 2) {
        ctx.lineTo(shape.points[i], shape.points[i + 1]);
      }
      ctx.stroke();
      break;
    }

    case 'text': {
      ctx.fillStyle = shape.fill;
      ctx.font = `${shape.fontSize}px ${shape.fontFamily}`;
      ctx.fillText(shape.content, shape.x, shape.y);
      break;
    }
  }

  ctx.restore();
}

// Pure function: renders all objects to canvas (sorted by zIndex)
export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  objects: DrawableObject[],
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);

  // Draw subtle background
  ctx.fillStyle = '#1a1a24';
  ctx.fillRect(0, 0, width, height);

  // Sort by zIndex
  const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  for (const obj of sorted) {
    drawShape(ctx, obj.shape);
  }
}

// Calculate bounding box for a shape
export function getShapeBBox(shape: Shape): { x: number; y: number; w: number; h: number } {
  switch (shape.kind) {
    case 'circle':
      return {
        x: shape.cx - shape.radius,
        y: shape.cy - shape.radius,
        w: shape.radius * 2,
        h: shape.radius * 2,
      };
    case 'rect':
      return { x: shape.x, y: shape.y, w: shape.width, h: shape.height };
    case 'triangle': {
      const xs = [shape.points[0], shape.points[2], shape.points[4]];
      const ys = [shape.points[1], shape.points[3], shape.points[5]];
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    case 'line':
      return {
        x: Math.min(shape.x1, shape.x2),
        y: Math.min(shape.y1, shape.y2),
        w: Math.abs(shape.x2 - shape.x1),
        h: Math.abs(shape.y2 - shape.y1),
      };
    case 'polygon': {
      const xs: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i < shape.points.length; i += 2) {
        xs.push(shape.points[i]);
        ys.push(shape.points[i + 1]);
      }
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    case 'freehand': {
      const xs: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i < shape.points.length; i += 2) {
        xs.push(shape.points[i]);
        ys.push(shape.points[i + 1]);
      }
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    case 'text':
      return { x: shape.x, y: shape.y - shape.fontSize, w: shape.content.length * shape.fontSize * 0.6, h: shape.fontSize };
  }
}
