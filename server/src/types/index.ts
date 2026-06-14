// Drawing DSL types — shared between frontend and server
// Duplicated in server to avoid cross-project import issues

export interface CircleShape {
  kind: 'circle';
  id: string;
  cx: number;
  cy: number;
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface RectShape {
  kind: 'rect';
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface TriangleShape {
  kind: 'triangle';
  id: string;
  points: [number, number, number, number, number, number];
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineShape {
  kind: 'line';
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
}

export interface FreehandShape {
  kind: 'freehand';
  id: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export interface PolygonShape {
  kind: 'polygon';
  id: string;
  points: number[];
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface TextShape {
  kind: 'text';
  id: string;
  x: number;
  y: number;
  content: string;
  fontSize: number;
  fill: string;
  fontFamily: string;
}

export type Shape =
  | CircleShape
  | RectShape
  | TriangleShape
  | LineShape
  | FreehandShape
  | PolygonShape
  | TextShape;

export interface DrawOp {
  op: 'draw';
  shape: Shape;
}

export interface ClearOp {
  op: 'clear';
}

export interface ModifyOp {
  op: 'modify';
  targetId: string;
  changes: Partial<{
    x: number;
    y: number;
    cx: number;
    cy: number;
    width: number;
    height: number;
    radius: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    points: number[];
    fontSize: number;
    content: string;
  }>;
}

export interface DeleteOp {
  op: 'delete';
  targetId: string;
}

export interface UndoOp {
  op: 'undo';
}

export interface RedoOp {
  op: 'redo';
}

export type DrawingOperation =
  | DrawOp
  | ClearOp
  | ModifyOp
  | DeleteOp
  | UndoOp
  | RedoOp;

export interface CanvasObjectSummary {
  id: string;
  kind: string;
  bbox: { x: number; y: number; w: number; h: number };
  fill: string;
  zIndex?: number;
}

export interface CanvasContext {
  objects: CanvasObjectSummary[];
  width: number;
  height: number;
}

export interface ParseCommandRequest {
  transcript: string;
  canvasState: CanvasContext;
  history: string[];
}

export interface ParseCommandResponse {
  operations: DrawingOperation[];
  explanation: string;
  confidence: number;
}
