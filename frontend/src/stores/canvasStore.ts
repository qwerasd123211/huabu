import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DrawingOperation, DrawableObject, CanvasObjectSummary } from '../types/dsl';
import { executeOperations } from '../engine/drawingExecutor';
import { getShapeBBox } from '../engine/canvasRenderer';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface CanvasState {
  objects: DrawableObject[];
  undoStack: DrawingOperation[][];
  redoStack: DrawingOperation[][];
  canvasWidth: number;
  canvasHeight: number;

  executeOperations: (ops: DrawingOperation[]) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  getContextSummary: () => CanvasObjectSummary[];
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      objects: [],
      undoStack: [],
      redoStack: [],
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,

      executeOperations: (ops: DrawingOperation[]) => {
        const { objects, undoStack } = get();
        const result = executeOperations(objects, ops);

        set({
          objects: result.objects,
          undoStack: [...undoStack, result.historyEntry],
          redoStack: [],
        });
      },

      undo: () => {
        const { undoStack, redoStack } = get();
        if (undoStack.length === 0) return;

        const lastOps = undoStack[undoStack.length - 1];
        // For undo, we reload state from scratch minus the last operation batch
        // Simplified approach: rebuild from empty using all but last op batch
        const allButLast = undoStack.slice(0, -1);
        let objects: DrawableObject[] = [];
        for (const batch of allButLast) {
          const result = executeOperations(objects, batch);
          objects = result.objects;
        }

        set({
          objects,
          undoStack: allButLast,
          redoStack: [...redoStack, lastOps],
        });
      },

      redo: () => {
        const { redoStack, undoStack } = get();
        if (redoStack.length === 0) return;

        const nextOps = redoStack[redoStack.length - 1];
        const result = executeOperations(get().objects, nextOps);

        set({
          objects: result.objects,
          undoStack: [...undoStack, nextOps],
          redoStack: redoStack.slice(0, -1),
        });
      },

      clear: () => {
        set({
          objects: [],
          undoStack: [],
          redoStack: [],
        });
      },

      getContextSummary: (): CanvasObjectSummary[] => {
        return get().objects.map((obj) => ({
          id: obj.shape.id,
          kind: obj.shape.kind,
          bbox: getShapeBBox(obj.shape),
          fill: 'fill' in obj.shape ? (obj.shape.fill as string) : '#000',
        }));
      },
    }),
    {
      name: 'voice-drawing-canvas',
      partialize: (state) => ({
        objects: state.objects,
        undoStack: state.undoStack.slice(-20), // keep only last 20 for storage
      }),
    }
  )
);
