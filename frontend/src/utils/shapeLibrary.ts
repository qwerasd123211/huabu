import type { DrawingOperation } from '../types/dsl';

// Composite shapes: Chinese name → DrawingOperation generator
// The LLM outputs primitive shapes + composite names.
// The frontend detects composite names and expands them automatically.

export type CompositeGenerator = (
  id: string,
  x: number,
  y: number,
  scale: number,
  color: string
) => DrawingOperation[];

export const COMPOSITES: Record<string, CompositeGenerator> = {
  '房子': (id, x, y, scale) => [
    {
      op: 'draw',
      shape: {
        kind: 'rect',
        id: `${id}-body`,
        x: x - 50 * scale,
        y: y + 20 * scale,
        width: 100 * scale,
        height: 70 * scale,
        fill: '#FFE0B2',
        stroke: '#8D6E63',
        strokeWidth: 2,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'triangle',
        id: `${id}-roof`,
        points: [
          x - 60 * scale, y + 20 * scale,
          x, y - 30 * scale,
          x + 60 * scale, y + 20 * scale,
        ],
        fill: '#E53935',
        stroke: '#B71C1C',
        strokeWidth: 2,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'rect',
        id: `${id}-door`,
        x: x - 12 * scale,
        y: y + 50 * scale,
        width: 24 * scale,
        height: 40 * scale,
        fill: '#5D4037',
        stroke: '#3E2723',
        strokeWidth: 1,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'rect',
        id: `${id}-window-left`,
        x: x - 35 * scale,
        y: y + 35 * scale,
        width: 18 * scale,
        height: 18 * scale,
        fill: '#81D4FA',
        stroke: '#5D4037',
        strokeWidth: 1,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'rect',
        id: `${id}-window-right`,
        x: x + 17 * scale,
        y: y + 35 * scale,
        width: 18 * scale,
        height: 18 * scale,
        fill: '#81D4FA',
        stroke: '#5D4037',
        strokeWidth: 1,
      },
    },
  ],

  '树': (id, x, y, scale) => [
    {
      op: 'draw',
      shape: {
        kind: 'rect',
        id: `${id}-trunk`,
        x: x - 10 * scale,
        y: y + 40 * scale,
        width: 20 * scale,
        height: 50 * scale,
        fill: '#795548',
        stroke: '#4E342E',
        strokeWidth: 1,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'circle',
        id: `${id}-crown`,
        cx: x,
        cy: y,
        radius: 40 * scale,
        fill: '#4CAF50',
        stroke: '#2E7D32',
        strokeWidth: 2,
      },
    },
  ],

  '太阳': (id, x, y, scale) => [
    {
      op: 'draw',
      shape: {
        kind: 'circle',
        id: `${id}-body`,
        cx: x,
        cy: y,
        radius: 35 * scale,
        fill: '#FFD700',
        stroke: '#FF8F00',
        strokeWidth: 3,
      },
    },
  ],

  '云': (id, x, y, scale) => [
    {
      op: 'draw',
      shape: {
        kind: 'circle',
        id: `${id}-c1`,
        cx: x,
        cy: y,
        radius: 22 * scale,
        fill: '#FFFFFF',
        stroke: '#E0E0E0',
        strokeWidth: 1,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'circle',
        id: `${id}-c2`,
        cx: x + 28 * scale,
        cy: y - 8 * scale,
        radius: 28 * scale,
        fill: '#FFFFFF',
        stroke: '#E0E0E0',
        strokeWidth: 1,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'circle',
        id: `${id}-c3`,
        cx: x + 55 * scale,
        cy: y,
        radius: 22 * scale,
        fill: '#FFFFFF',
        stroke: '#E0E0E0',
        strokeWidth: 1,
      },
    },
  ],

  '船': (id, x, y, scale) => [
    {
      op: 'draw',
      shape: {
        kind: 'polygon',
        id: `${id}-hull`,
        points: [
          x, y + 30 * scale,
          x + 100 * scale, y + 30 * scale,
          x + 85 * scale, y + 50 * scale,
          x + 15 * scale, y + 50 * scale,
        ],
        fill: '#795548',
        stroke: '#4E342E',
        strokeWidth: 2,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'triangle',
        id: `${id}-sail`,
        points: [
          x + 50 * scale, y - 25 * scale,
          x + 20 * scale, y + 30 * scale,
          x + 50 * scale, y + 30 * scale,
        ],
        fill: '#FFFFFF',
        stroke: '#BDBDBD',
        strokeWidth: 1,
      },
    },
  ],

  '花': (id, x, y, scale) => [
    {
      op: 'draw',
      shape: {
        kind: 'circle',
        id: `${id}-center`,
        cx: x,
        cy: y,
        radius: 8 * scale,
        fill: '#FFD700',
        stroke: '#FF8F00',
        strokeWidth: 1,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'circle',
        id: `${id}-petal1`,
        cx: x,
        cy: y - 16 * scale,
        radius: 12 * scale,
        fill: '#FF69B4',
        stroke: '#E91E63',
        strokeWidth: 1,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'circle',
        id: `${id}-petal2`,
        cx: x + 14 * scale,
        cy: y - 6 * scale,
        radius: 12 * scale,
        fill: '#FF69B4',
        stroke: '#E91E63',
        strokeWidth: 1,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'circle',
        id: `${id}-petal3`,
        cx: x + 10 * scale,
        cy: y + 12 * scale,
        radius: 12 * scale,
        fill: '#FF69B4',
        stroke: '#E91E63',
        strokeWidth: 1,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'circle',
        id: `${id}-petal4`,
        cx: x - 10 * scale,
        cy: y + 12 * scale,
        radius: 12 * scale,
        fill: '#FF69B4',
        stroke: '#E91E63',
        strokeWidth: 1,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'circle',
        id: `${id}-petal5`,
        cx: x - 14 * scale,
        cy: y - 6 * scale,
        radius: 12 * scale,
        fill: '#FF69B4',
        stroke: '#E91E63',
        strokeWidth: 1,
      },
    },
    {
      op: 'draw',
      shape: {
        kind: 'line',
        id: `${id}-stem`,
        x1: x,
        y1: y + 20 * scale,
        x2: x,
        y2: y + 60 * scale,
        stroke: '#4CAF50',
        strokeWidth: 3,
      },
    },
  ],

  '星星': (id, x, y, scale) => {
    const ops: DrawingOperation[] = [];
    const outerR = 25 * scale;
    const innerR = 10 * scale;
    const points: number[] = [];
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 72 - 90) * (Math.PI / 180);
      const innerAngle = ((i * 72) + 36 - 90) * (Math.PI / 180);
      points.push(
        x + outerR * Math.cos(outerAngle),
        y + outerR * Math.sin(outerAngle),
      );
      points.push(
        x + innerR * Math.cos(innerAngle),
        y + innerR * Math.sin(innerAngle),
      );
    }
    ops.push({
      op: 'draw',
      shape: {
        kind: 'polygon',
        id,
        points,
        fill: '#FFD700',
        stroke: '#FF8F00',
        strokeWidth: 2,
      },
    });
    return ops;
  },

  '爱心': (id, x, y, scale) => {
    const s = 30 * scale;
    const cx1 = x - s * 0.35;
    const cx2 = x + s * 0.35;
    const cy = y - s * 0.2;
    const r = s * 0.38;
    return [
      {
        op: 'draw',
        shape: {
          kind: 'polygon',
          id,
          points: [
            x, y + s * 0.8,
            x - s * 0.9, y - s * 0.1,
            x - s * 0.5, y - s * 0.6,
            x, y - s * 0.2,
            x + s * 0.5, y - s * 0.6,
            x + s * 0.9, y - s * 0.1,
          ],
          fill: '#EF5350',
          stroke: '#B71C1C',
          strokeWidth: 2,
        },
      },
    ];
  },
};

export function isComposite(name: string): boolean {
  return name in COMPOSITES;
}

export function resolveComposite(
  name: string,
  id: string,
  x: number,
  y: number,
  scale: number,
  color: string
): DrawingOperation[] | null {
  const generator = COMPOSITES[name];
  if (!generator) return null;
  return generator(id, x, y, scale, color);
}
