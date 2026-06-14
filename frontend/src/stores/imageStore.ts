import { create } from 'zustand';

export interface ImageLayer {
  id: string;
  imageUrl: string;
  prompt: string;
  x: number;
  y: number;
  scale: number;
  timestamp: number;
}

interface ImageStore {
  images: ImageLayer[];
  undoStack: ImageLayer[];
  redoStack: ImageLayer[];
  isGenerating: boolean;
  loadedImages: Map<string, HTMLImageElement>;

  addImage: (layer: ImageLayer) => void;
  removeImage: (id: string) => void;
  undoImage: () => boolean;
  redoImage: () => boolean;
  clearImages: () => void;
  setGenerating: (v: boolean) => void;
  setLoadedImage: (id: string, img: HTMLImageElement) => void;
}

export const useImageStore = create<ImageStore>()((set, get) => ({
  images: [],
  undoStack: [],
  redoStack: [],
  isGenerating: false,
  loadedImages: new Map(),

  addImage: (layer) =>
    set((s) => ({
      images: [...s.images, layer],
      undoStack: [...s.undoStack, layer].slice(-20),
      redoStack: [],
    })),

  removeImage: (id) =>
    set((s) => ({
      images: s.images.filter((img) => img.id !== id),
    })),

  undoImage: () => {
    const { images, redoStack } = get();
    if (images.length === 0) return false;

    const removed = images[images.length - 1];
    set({
      images: images.slice(0, -1),
      redoStack: [...redoStack, removed].slice(-20),
    });
    return true;
  },

  redoImage: () => {
    const { images, redoStack } = get();
    if (redoStack.length === 0) return false;

    const restored = redoStack[redoStack.length - 1];
    set({
      images: [...images, restored],
      redoStack: redoStack.slice(0, -1),
    });
    return true;
  },

  clearImages: () => set({ images: [], undoStack: [], redoStack: [] }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setLoadedImage: (id, img) => {
    const map = new Map(get().loadedImages);
    map.set(id, img);
    set({ loadedImages: map });
  },
}));
