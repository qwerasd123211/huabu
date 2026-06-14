import { create } from 'zustand';

export type StyleMode = 'default' | 'watercolor' | 'pixel' | 'childlike';

interface StyleConfig {
  label: string;
  prompt: string;
}

export const STYLE_CONFIGS: Record<StyleMode, StyleConfig> = {
  default: {
    label: '默认风格',
    prompt: '',
  },
  watercolor: {
    label: '水彩风格',
    prompt: 'soft watercolor painting, translucent washes, paper texture, gentle hand-painted edges',
  },
  pixel: {
    label: '像素风格',
    prompt: 'pixel art style, crisp low-resolution blocks, retro game asset, limited color palette',
  },
  childlike: {
    label: '儿童画风格',
    prompt: 'childlike crayon drawing, playful simple shapes, bright colors, naive hand-drawn charm',
  },
};

interface StyleStore {
  styleMode: StyleMode;
  setStyleMode: (mode: StyleMode) => void;
}

export const useStyleStore = create<StyleStore>()((set) => ({
  styleMode: 'default',
  setStyleMode: (styleMode) => set({ styleMode }),
}));
