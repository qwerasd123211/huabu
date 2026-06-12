import type { CanvasObjectSummary, CanvasContext } from '../types/dsl';

export function buildContext(
  objects: CanvasObjectSummary[],
  width: number,
  height: number
): CanvasContext {
  return {
    objects,
    width,
    height,
  };
}

export function contextToText(ctx: CanvasContext): string {
  if (ctx.objects.length === 0) {
    return `画布尺寸: ${ctx.width}x${ctx.height}。当前画布为空。`;
  }

  const parts = ctx.objects.map((obj) => {
    const b = obj.bbox;
    return `${obj.kind} "${obj.id}" 位于(${Math.round(b.x)},${Math.round(b.y)}) 尺寸(${Math.round(b.w)}x${Math.round(b.h)}) 颜色${obj.fill}`;
  });

  return `画布尺寸: ${ctx.width}x${ctx.height}。当前画布有${ctx.objects.length}个对象:\n${parts.join('\n')}`;
}
