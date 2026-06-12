import { useState, useRef, useCallback, useEffect } from 'react';

const WAKE_WORDS = ['小花', '笑话', '小化', '消化'];

function containsWakeWord(text: string): boolean {
  const cleaned = text.toLowerCase().replace(/[\s，,。.！!？?、\-\—]/g, '');
  for (const w of WAKE_WORDS) {
    if (cleaned.includes(w)) return true;
  }
  return false;
}

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function getBrowserSpeechRecognition(): SpeechRecognitionConstructor | null {
  const win = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onWakeWord?: (fullText: string) => void;
  onError?: (error: string) => void;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const ref = useRef({
    onResult: options.onResult,
    onWakeWord: options.onWakeWord,
    onError: options.onError,
    recognition: null as BrowserSpeechRecognition | null,
    wanted: false,
    woken: false,
    listening: false, // true when ready to receive commands
    reconnectTimer: null as ReturnType<typeof setTimeout> | null,
    lastFinal: '',
    speaking: false, // TTS playing → block recognition
  });

  ref.current.onResult = options.onResult;
  ref.current.onWakeWord = options.onWakeWord;
  ref.current.onError = options.onError;

  const closeRecognition = useCallback(() => {
    if (ref.current.reconnectTimer) {
      clearTimeout(ref.current.reconnectTimer);
      ref.current.reconnectTimer = null;
    }
    if (ref.current.recognition) {
      const r = ref.current.recognition;
      r.onend = null;
      r.onresult = null;
      r.onerror = null;
      try { r.stop(); } catch { /* ok */ }
      try { r.abort(); } catch { /* ok */ }
      ref.current.recognition = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    closeRecognition();
    setIsListening(false);
    ref.current.woken = false;
    ref.current.listening = false;
  }, [closeRecognition]);

  const start = useCallback(() => {
    const SpeechRecognition = getBrowserSpeechRecognition();
    if (!SpeechRecognition) {
      ref.current.onError?.('no_speech_api');
      return false;
    }

    closeRecognition();
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      // Block recognition results while TTS is speaking
      if (ref.current.speaking) return;

      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript?.trim() || '';
        if (!text) continue;
        if (result.isFinal) {
          finalText += text;
        } else {
          interim += text;
        }
      }

      const visibleText = finalText || interim;
      if (!visibleText) return;
      setTranscript(visibleText);

      // Wake word detection — skip onResult entirely if wake word found
      if (!ref.current.woken && containsWakeWord(visibleText)) {
        ref.current.woken = true;
        ref.current.onWakeWord?.(visibleText);
        return;
      }

      // Only process command results when we're in listening state
      // (i.e., after wake word has been handled and we're ready for commands)
      if (ref.current.listening) {
        if (interim) ref.current.onResult?.(interim, false);

        const normalizedFinal = finalText.trim();
        if (normalizedFinal && normalizedFinal !== ref.current.lastFinal) {
          ref.current.lastFinal = normalizedFinal;
          ref.current.onResult?.(normalizedFinal, true);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.warn('[Speech] Error:', event.error);
      ref.current.onError?.(event.error);
    };

    recognition.onend = () => {
      // Auto-reconnect for continuous listening
      if (ref.current.wanted) {
        ref.current.reconnectTimer = setTimeout(() => {
          if (ref.current.wanted && ref.current.recognition) {
            try { ref.current.recognition.start(); } catch { /* already started */ }
          }
        }, 200);
      } else {
        setIsListening(false);
      }
    };

    ref.current.recognition = recognition;
    try {
      recognition.start();
      return true;
    } catch {
      ref.current.recognition = null;
      return false;
    }
  }, [closeRecognition]);

  const startListening = useCallback(() => {
    ref.current.wanted = true;
    ref.current.woken = false;
    ref.current.lastFinal = '';
    setTranscript('');
    start();
  }, [start]);

  const stopListening = useCallback(() => {
    ref.current.wanted = false;
    ref.current.woken = false;
    cleanup();
  }, [cleanup]);

  // Block microphone input during TTS playback
  const suspendInput = useCallback(() => {
    ref.current.speaking = true;
    if (ref.current.recognition) {
      try { ref.current.recognition.stop(); } catch { /* ok */ }
    }
  }, []);

  // Restore microphone input after TTS playback
  const resumeInput = useCallback(() => {
    ref.current.speaking = false;
    if (ref.current.wanted && ref.current.recognition) {
      try { ref.current.recognition.start(); } catch { /* ok */ }
    }
  }, []);

  // Called when VAD ends and user wants to speak next command
  const resetForCommand = useCallback(() => {
    ref.current.woken = true;
    ref.current.listening = true;
    ref.current.lastFinal = '';
    setTranscript('');
  }, []);

  useEffect(() => {
    if (!getBrowserSpeechRecognition()) {
      setIsSupported(false);
    }
    return () => cleanup();
  }, [cleanup]);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetForCommand,
    suspendInput,
    resumeInput,
  };
};
