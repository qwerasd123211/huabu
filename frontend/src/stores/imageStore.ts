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
  isGenerating: boolean;
  loadedImages: Map<string, HTMLImageElement>;

  addImage: (layer: ImageLayer) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  setGenerating: (v: boolean) => void;
  setLoadedImage: (id: string, img: HTMLImageElement) => void;
}

export const useImageStore = create<ImageStore>()((set, get) => ({
  images: [],
  isGenerating: false,
  loadedImages: new Map(),

  addImage: (layer) =>
    set((s) => ({
      images: [...s.images, layer],
    })),

  removeImage: (id) =>
    set((s) => ({
      images: s.images.filter((img) => img.id !== id),
    })),

  clearImages: () => set({ images: [] }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setLoadedImage: (id, img) => {
    const map = new Map(get().loadedImages);
    map.set(id, img);
    set({ loadedImages: map });
  },
}));
