import { create } from 'zustand';

export type VoiceStatus = 'sleeping' | 'waking' | 'greeting' | 'listening' | 'processing' | 'speaking' | 'error';

export interface CommandEntry {
  id: string;
  text: string;
  timestamp: number;
  response: string;
  confidence: number;
}

interface VoiceState {
  status: VoiceStatus;
  interimText: string;
  finalText: string;
  commandHistory: CommandEntry[];
  isSupported: boolean;
  error: string | null;

  setStatus: (s: VoiceStatus) => void;
  setInterimText: (t: string) => void;
  setFinalText: (t: string) => void;
  addCommandEntry: (entry: CommandEntry) => void;
  setSupported: (s: boolean) => void;
  setError: (e: string | null) => void;
  clearHistory: () => void;
}

export const useVoiceStore = create<VoiceState>()((set) => ({
  status: 'sleeping',
  interimText: '',
  finalText: '',
  commandHistory: [],
  isSupported: true,
  error: null,

  setStatus: (status) => set({ status }),
  setInterimText: (interimText) => set({ interimText }),
  setFinalText: (finalText) => set({ finalText, interimText: '' }),
  addCommandEntry: (entry) =>
    set((s) => ({ commandHistory: [...s.commandHistory, entry] })),
  setSupported: (isSupported) => set({ isSupported }),
  setError: (error) => set({ error, status: error ? 'error' : 'sleeping' }),
  clearHistory: () => set({ commandHistory: [] }),
}));
