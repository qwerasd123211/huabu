import type { CanvasObjectSummary, DrawingOperation } from '../types/dsl';

// Local pattern-based command parser as fallback when LLM is unavailable
// Matches common Chinese voice drawing commands

interface ParsedCommand {
  operations: DrawingOperation[];
  explanation: string;
  confidence: number;
}

let objCounter = 0;
function nextId(prefix: string): string {
  objCounter++;
  return `${prefix}-${objCounter}`;
}

// Extract color from text, optionally near a target word
function extractColor(text: string, near?: string): string | null {
  const colorMap: Record<string, string> = {
    '深红': '#CC2222', '浅红': '#FF8888',
    '深蓝': '#2255CC', '浅蓝': '#88BBFF', '天蓝': '#87CEEB', '天空蓝': '#87CEEB',
    '深绿': '#228B22', '浅绿': '#88DD88',
    '深黄': '#CCAA00', '浅黄': '#FFEE88',
    '粉红': '#FF69B4', '浅粉': '#FFB6C1',
    '深灰': '#666666', '浅灰': '#CCCCCC',
    '红色': '#FF4444', '蓝色': '#4488FF', '绿色': '#44BB44', '黄色': '#FFD700',
    '橙色': '#FF8C00', '紫色': '#9B59B6', '粉色': '#FF69B4',
    '黑色': '#333333', '白色': '#FFFFFF', '灰色': '#999999',
    '棕色': '#8B4513', '咖啡色': '#8B4513',
    '金色': '#FFD700', '银色': '#C0C0C0', '青色': '#00CED1',
    '橘色': '#FF8C00',
    '红': '#FF4444', '蓝': '#4488FF', '绿': '#44BB44', '黄': '#FFD700',
    '橙': '#FF8C00', '紫': '#9B59B6', '粉': '#FF69B4',
    '黑': '#333333', '白': '#FFFFFF', '灰': '#999999',
    '棕': '#8B4513', '褐': '#8B4513', '金': '#FFD700', '银': '#C0C0C0', '青': '#00CED1',
  };

  // Sort keys by length descending so "天空蓝" matches before "蓝"
  const keys = Object.keys(colorMap).sort((a, b) => b.length - a.length);

  if (near) {
    const idx = text.indexOf(near);
    if (idx !== -1) {
      const nearby = text.slice(Math.max(0, idx - 8), idx + near.length + 8);
      for (const name of keys) {
        if (nearby.includes(name)) return colorMap[name];
      }
    }
  }

  // Fallback: search full text
  for (const name of keys) {
    if (text.includes(name)) return colorMap[name];
  }
  return null;
}

function extractPosition(text: string): { x: number; y: number } {
  // Default center
  let x = 400;
  let y = 300;

  if (text.includes('左边') || text.includes('左侧')) x = 150;
  else if (text.includes('右边') || text.includes('右侧')) x = 650;
  else if (text.includes('中间') || text.includes('中心')) x = 400;

  if (text.includes('上面') || text.includes('上方') || text.includes('顶部')) y = 150;
  else if (text.includes('下面') || text.includes('下方') || text.includes('底部')) y = 450;
  else if (text.includes('中间') || text.includes('中心')) y = 300;

  return { x, y };
}

function hasExplicitPosition(text: string): boolean {
  return /左边|左侧|右边|右侧|中间|中心|上面|上方|顶部|下面|下方|底部/.test(text);
}

function overlaps(a: CanvasObjectSummary['bbox'], b: CanvasObjectSummary['bbox']): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function isBackgroundBox(box: CanvasObjectSummary['bbox']): boolean {
  return box.w >= 720 && box.h >= 520;
}

function makeBBox(cx: number, cy: number, w: number, h: number): CanvasObjectSummary['bbox'] {
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

function createAutoPlacer(text: string, existingObjects: CanvasObjectSummary[] = []) {
  const occupied = existingObjects
    .map((obj) => obj.bbox)
    .filter((box) => !isBackgroundBox(box));

  const slots = [
    { x: 180, y: 170 },
    { x: 400, y: 170 },
    { x: 620, y: 170 },
    { x: 170, y: 330 },
    { x: 400, y: 330 },
    { x: 630, y: 330 },
    { x: 240, y: 470 },
    { x: 520, y: 470 },
  ];

  return (fallback: { x: number; y: number }, footprint = { w: 140, h: 120 }): { x: number; y: number } => {
    if (hasExplicitPosition(text)) return extractPosition(text);

    const candidates = [fallback, ...slots];
    for (const candidate of candidates) {
      const bbox = makeBBox(candidate.x, candidate.y, footprint.w, footprint.h);
      if (!occupied.some((box) => overlaps(box, bbox))) {
        occupied.push(bbox);
        return candidate;
      }
    }

    const index = occupied.length % slots.length;
    const wrapped = slots[index];
    occupied.push(makeBBox(wrapped.x, wrapped.y, footprint.w, footprint.h));
    return wrapped;
  };
}

function extractSize(text: string): number {
  if (text.includes('大') || text.includes('巨大')) return 1.5;
  if (text.includes('小') || text.includes('很小')) return 0.6;
  return 1.0;
}

export function parseCommandLocally(
  transcript: string,
  existingObjects: CanvasObjectSummary[] = []
): ParsedCommand | null {
  const text = transcript.trim();
  if (!text) return null;

  const ops: DrawingOperation[] = [];
  const explanations: string[] = [];
  const place = createAutoPlacer(text, existingObjects);

  // --- Clear ---
  if (/^(清空|清除|清屏|全部清除|擦除全部)$/.test(text)) {
    return {
      operations: [{ op: 'clear' }],
      explanation: '已清空画布',
      confidence: 0.95,
    };
  }

  // --- Undo ---
  if (/^(撤销|撤回|上一步)$/.test(text)) {
    return {
      operations: [{ op: 'undo' }],
      explanation: '已撤销上一步操作',
      confidence: 0.95,
    };
  }

  // --- Redo ---
  if (/^(重做|恢复|下一步)$/.test(text)) {
    return {
      operations: [{ op: 'redo' }],
      explanation: '已重做',
      confidence: 0.95,
    };
  }

  // --- Delete ---
  const deleteMatch = text.match(/^删除(.+)$/);
  if (deleteMatch) {
    const target = deleteMatch[1].trim();
    // Try to match by common object names
    const objNames = ['房子', '树', '太阳', '云', '船', '花', '爱心', '星星', '圆', '方形', '三角形'];
    for (const name of objNames) {
      if (target.includes(name)) {
        return {
          operations: [{ op: 'delete', targetId: `${name}1` }],
          explanation: `已删除"${name}"`,
          confidence: 0.85,
        };
      }
    }
    return {
      operations: [{ op: 'delete', targetId: target }],
      explanation: `已删除"${target}"`,
      confidence: 0.7,
    };
  }

  // --- Background/Sky ---
  if (text.includes('背景') || text.includes('天空')) {
    const color = extractColor(text, '天空') || extractColor(text, '背景') || '#87CEEB';
    ops.push({
      op: 'draw',
      shape: {
        kind: 'rect',
        id: nextId('bg'),
        x: 0, y: 0, width: 800, height: 600,
        fill: color, stroke: 'none', strokeWidth: 0,
      },
    });
    explanations.push(`画了${color}背景`);
  }

  // --- Circle ---
  if (text.includes('圆') || text.includes('太阳')) {
    const scale = extractSize(text);
    const color = extractColor(text) || '#FFD700';
    const isSun = text.includes('太阳');
    const pos = place(isSun ? { x: 650, y: 140 } : { x: 400, y: 300 }, { w: 110 * scale, h: 110 * scale });
    const id = isSun ? nextId('sun') : nextId('circle');
    ops.push({
      op: 'draw',
      shape: {
        kind: 'circle',
        id,
        cx: pos.x, cy: pos.y - 20,
        radius: Math.round(40 * scale),
        fill: color, stroke: isSun ? '#FF8F00' : '#333', strokeWidth: isSun ? 3 : 2,
      },
    });
    explanations.push(isSun ? '画了太阳' : `画了${color}圆形`);
  }

  // --- Rectangle / House ---
  if (text.includes('房子') || text.includes('方形') || text.includes('长方形') || text.includes('矩形')) {
    const isHouse = text.includes('房子');
    const color = extractColor(text) || '#FFE0B2';
    const id = isHouse ? nextId('house') : nextId('rect');
    const pos = place(isHouse ? { x: 400, y: 350 } : { x: 400, y: 300 }, isHouse ? { w: 150, h: 150 } : { w: 150, h: 110 });

    ops.push({
      op: 'draw',
      shape: {
        kind: 'rect',
        id: isHouse ? `${id}-body` : id,
        x: pos.x - (isHouse ? 50 : 60),
        y: pos.y + (isHouse ? 20 : 0),
        width: isHouse ? 100 : 120,
        height: isHouse ? 70 : 80,
        fill: color, stroke: isHouse ? '#8D6E63' : '#333', strokeWidth: 2,
      },
    });

    if (isHouse) {
      ops.push({
        op: 'draw',
        shape: {
          kind: 'triangle',
          id: `${id}-roof`,
          points: [
            pos.x - 60, pos.y + 20,
            pos.x, pos.y - 30,
            pos.x + 60, pos.y + 20,
          ],
          fill: extractColor(text.replace('红', '棕')) || '#E53935',
          stroke: '#B71C1C', strokeWidth: 2,
        },
      });
      ops.push({
        op: 'draw',
        shape: {
          kind: 'rect',
          id: `${id}-door`,
          x: pos.x - 12, y: pos.y + 50,
          width: 24, height: 40,
          fill: '#5D4037', stroke: '#3E2723', strokeWidth: 1,
        },
      });
      explanations.push('画了房子');
    } else {
      explanations.push(`画了${color}方形`);
    }
  }

  // --- Triangle ---
  if (text.includes('三角') && !text.includes('房子')) {
    const pos = place({ x: 400, y: 300 }, { w: 140, h: 140 });
    const color = extractColor(text) || '#9B59B6';
    const id = nextId('tri');
    const s = 60;
    ops.push({
      op: 'draw',
      shape: {
        kind: 'triangle',
        id,
        points: [pos.x, pos.y - s, pos.x - s, pos.y + s, pos.x + s, pos.y + s],
        fill: color, stroke: '#333', strokeWidth: 2,
      },
    });
    explanations.push(`画了${color}三角形`);
  }

  // --- Tree ---
  if (text.includes('树')) {
    const pos = place({ x: 180, y: 380 }, { w: 120, h: 150 });
    const id = nextId('tree');
    ops.push({
      op: 'draw',
      shape: { kind: 'rect', id: `${id}-trunk`, x: pos.x - 10, y: pos.y + 20, width: 20, height: 50, fill: '#795548', stroke: '#4E342E', strokeWidth: 1 },
    });
    ops.push({
      op: 'draw',
      shape: { kind: 'circle', id: `${id}-crown`, cx: pos.x, cy: pos.y - 10, radius: 40, fill: '#4CAF50', stroke: '#2E7D32', strokeWidth: 2 },
    });
    explanations.push('画了树');
  }

  // --- Cloud ---
  if (text.includes('云')) {
    const pos = place({ x: 240, y: 150 }, { w: 130, h: 90 });
    const id = nextId('cloud');
    ops.push({
      op: 'draw', shape: { kind: 'circle', id: `${id}-1`, cx: pos.x, cy: pos.y, radius: 22, fill: '#FFF', stroke: '#E0E0E0', strokeWidth: 1 },
    });
    ops.push({
      op: 'draw', shape: { kind: 'circle', id: `${id}-2`, cx: pos.x + 28, cy: pos.y - 8, radius: 28, fill: '#FFF', stroke: '#E0E0E0', strokeWidth: 1 },
    });
    ops.push({
      op: 'draw', shape: { kind: 'circle', id: `${id}-3`, cx: pos.x + 55, cy: pos.y, radius: 22, fill: '#FFF', stroke: '#E0E0E0', strokeWidth: 1 },
    });
    explanations.push('画了云');
  }

  // --- Boat ---
  if (text.includes('船')) {
    const pos = place({ x: 350, y: 430 }, { w: 160, h: 110 });
    const id = nextId('boat');
    ops.push({
      op: 'draw', shape: {
        kind: 'polygon', id: `${id}-hull`,
        points: [pos.x, pos.y + 30, pos.x + 100, pos.y + 30, pos.x + 85, pos.y + 50, pos.x + 15, pos.y + 50],
        fill: '#795548', stroke: '#4E342E', strokeWidth: 2,
      },
    });
    ops.push({
      op: 'draw', shape: {
        kind: 'triangle', id: `${id}-sail`,
        points: [pos.x + 50, pos.y - 25, pos.x + 20, pos.y + 30, pos.x + 50, pos.y + 30],
        fill: '#FFF', stroke: '#BDBDBD', strokeWidth: 1,
      },
    });
    explanations.push('画了船');
  }

  // --- Flower ---
  if (text.includes('花')) {
    const pos = place({ x: 560, y: 390 }, { w: 100, h: 140 });
    const id = nextId('flower');
    const r = 12;
    const offsets = [[0, -16], [14, -6], [10, 12], [-10, 12], [-14, -6]];
    ops.push({
      op: 'draw', shape: { kind: 'circle', id: `${id}-center`, cx: pos.x, cy: pos.y, radius: 8, fill: '#FFD700', stroke: '#FF8F00', strokeWidth: 1 },
    });
    offsets.forEach(([dx, dy], i) => {
      ops.push({
        op: 'draw', shape: { kind: 'circle', id: `${id}-p${i}`, cx: pos.x + dx, cy: pos.y + dy, radius: r, fill: '#FF69B4', stroke: '#E91E63', strokeWidth: 1 },
      });
    });
    ops.push({
      op: 'draw', shape: { kind: 'line', id: `${id}-stem`, x1: pos.x, y1: pos.y + 20, x2: pos.x, y2: pos.y + 60, stroke: '#4CAF50', strokeWidth: 3 },
    });
    explanations.push('画了花');
  }

  // --- Heart ---
  if (text.includes('爱心') || text.includes('心形')) {
    const pos = place({ x: 400, y: 300 }, { w: 90, h: 90 });
    const id = nextId('heart');
    const s = 30;
    ops.push({
      op: 'draw', shape: {
        kind: 'polygon', id,
        points: [
          pos.x, pos.y + s * 0.8,
          pos.x - s * 0.9, pos.y - s * 0.1,
          pos.x - s * 0.5, pos.y - s * 0.6,
          pos.x, pos.y - s * 0.2,
          pos.x + s * 0.5, pos.y - s * 0.6,
          pos.x + s * 0.9, pos.y - s * 0.1,
        ],
        fill: '#EF5350', stroke: '#B71C1C', strokeWidth: 2,
      },
    });
    explanations.push('画了爱心');
  }

  // --- Star ---
  if (text.includes('星星') || text.includes('五角星')) {
    const pos = place({ x: 560, y: 160 }, { w: 90, h: 90 });
    const id = nextId('star');
    const outerR = 30, innerR = 12;
    const points: number[] = [];
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 72 - 90) * (Math.PI / 180);
      const innerAngle = ((i * 72) + 36 - 90) * (Math.PI / 180);
      points.push(pos.x + outerR * Math.cos(outerAngle), pos.y + outerR * Math.sin(outerAngle));
      points.push(pos.x + innerR * Math.cos(innerAngle), pos.y + innerR * Math.sin(innerAngle));
    }
    ops.push({
      op: 'draw', shape: { kind: 'polygon', id, points, fill: '#FFD700', stroke: '#FF8F00', strokeWidth: 2 },
    });
    explanations.push('画了星星');
  }

  if (ops.length === 0) {
    return null; // Can't parse locally, needs LLM
  }

  return {
    operations: ops,
    explanation: explanations.join('；'),
    confidence: 0.75,
  };
}
