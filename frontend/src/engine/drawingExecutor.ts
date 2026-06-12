import { v4 as uuidv4 } from 'uuid';
import type { DrawingOperation, DrawableObject, Shape } from '../types/dsl';
import { getShapeBBox } from './canvasRenderer';
import { isComposite, resolveComposite } from '../utils/shapeLibrary';

// Detect composite shape from the shape's id or metadata
// LLM uses shape kind + id naming convention: "house1", "tree2", etc.
function tryExpandComposite(op: DrawingOperation): DrawingOperation[] {
  if (op.op !== 'draw') return [op];
  const shape = op.shape;
  // Check if the shape id contains a known composite name
  for (const name of Object.keys(resolveComposite as unknown as Record<string, unknown>)) {
    // We check by importing isComposite directly below
  }
  return [op];
}

// Creates a shape with a guaranteed unique ID
function ensureId(shape: Shape): Shape {
  if (!shape.id) {
    return { ...shape, id: uuidv4() };
  }
  return shape;
}

// Apply a single operation to the objects array (immutable)
function applyOp(
  objects: DrawableObject[],
  op: DrawingOperation,
  nextZIndex: number
): { objects: DrawableObject[]; nextZIndex: number } {
  switch (op.op) {
    case 'draw': {
      const shape = ensureId(op.shape);
      const newObj: DrawableObject = {
        shape,
        zIndex: nextZIndex,
      };
      return {
        objects: [...objects, newObj],
        nextZIndex: nextZIndex + 1,
      };
    }

    case 'modify': {
      const idx = objects.findIndex((o) => o.shape.id === op.targetId);
      if (idx === -1) return { objects, nextZIndex };
      const updated = [...objects];
      const oldShape = updated[idx].shape;
      updated[idx] = {
        ...updated[idx],
        shape: { ...oldShape, ...op.changes } as Shape,
      };
      return { objects: updated, nextZIndex };
    }

    case 'delete': {
      const filtered = objects.filter((o) => o.shape.id !== op.targetId);
      return { objects: filtered, nextZIndex };
    }

    default:
      return { objects, nextZIndex };
  }
}

// Main function: apply a list of operations immutably
export function executeOperations(
  currentObjects: DrawableObject[],
  operations: DrawingOperation[]
): { objects: DrawableObject[]; historyEntry: DrawingOperation[] } {
  let objects = currentObjects;
  let nextZIndex = objects.length > 0
    ? Math.max(...objects.map((o) => o.zIndex)) + 1
    : 0;

  const effectiveOps: DrawingOperation[] = [];

  for (const op of operations) {
    if (op.op === 'clear') {
      objects = [];
      nextZIndex = 0;
      effectiveOps.push(op);
    } else if (op.op === 'undo' || op.op === 'redo') {
      // undo/redo are handled at the store level, not here
      effectiveOps.push(op);
    } else {
      const result = applyOp(objects, op, nextZIndex);
      objects = result.objects;
      nextZIndex = result.nextZIndex;
      effectiveOps.push(op);
    }
  }

  return {
    objects,
    historyEntry: effectiveOps,
  };
}

// Inverse operations for undo (simplified: return the operations that would reverse)
export function inverseOperations(objects: DrawableObject[], ops: DrawingOperation[]): DrawingOperation[] {
  const inverted: DrawingOperation[] = [];
  for (const op of [...ops].reverse()) {
    switch (op.op) {
      case 'draw':
        inverted.push({ op: 'delete', targetId: op.shape.id });
        break;
      case 'delete':
        // Can't fully reverse without the original shape data
        break;
      case 'modify':
        // Can't fully reverse without original values
        break;
      case 'clear':
        // Re-create all objects that existed before clear
        for (const obj of objects) {
          inverted.push({ op: 'draw', shape: obj.shape });
        }
        break;
    }
  }
  return inverted;
}

// Count the current max zIndex
export function getMaxZIndex(objects: DrawableObject[]): number {
  if (objects.length === 0) return 0;
  return Math.max(...objects.map((o) => o.zIndex));
}
