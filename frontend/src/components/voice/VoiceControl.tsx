import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useVoiceStore } from '../../stores/voiceStore';
import { generateImage, parseCommand, proxyImageUrl } from '../../services/api';
import { useImageStore } from '../../stores/imageStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { parseCommandLocally } from '../../engine/localParser';

const GREETINGS = ['我在，请问有什么可以帮您的？', '我在呢，想画点什么？', '嗯，你说，我来画。'];
const THINKING_REPLIES = ['好的，马上画。', '收到，我来画。'];
const DONE_REPLIES = ['画好了，看看怎么样？', '完成啦，还想画什么告诉我哦。'];

function speak(text: string, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.rate = 1.1;
  u.pitch = 1.1;
  u.volume = 1;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

const STATUS_STYLES: Record<string, { label: string; dotColor: string; ringColor: string }> = {
  sleeping: { label: '说"小花小花"唤醒', dotColor: 'var(--accent)', ringColor: 'rgba(212,145,42,0.3)' },
  waking: { label: '唤醒了！', dotColor: 'var(--accent-glow)', ringColor: 'rgba(232,168,76,0.5)' },
  greeting: { label: '你好，我在', dotColor: 'var(--accent-glow)', ringColor: 'rgba(232,168,76,0.4)' },
  listening: { label: '正在聆听…', dotColor: 'var(--success)', ringColor: 'rgba(90,154,90,0.4)' },
  processing: { label: '正在画…', dotColor: 'var(--warning)', ringColor: 'rgba(212,145,42,0.4)' },
  speaking: { label: '小花回复中…', dotColor: 'var(--accent-glow)', ringColor: 'rgba(232,168,76,0.3)' },
  error: { label: '出错了', dotColor: 'var(--danger)', ringColor: 'rgba(196,74,63,0.4)' },
};

export default function VoiceControl() {
  const status = useVoiceStore((s) => s.status);
  const setStatus = useVoiceStore((s) => s.setStatus);
  const setInterimText = useVoiceStore((s) => s.setInterimText);
  const setFinalText = useVoiceStore((s) => s.setFinalText);
  const addCommandEntry = useVoiceStore((s) => s.addCommandEntry);
  const setError = useVoiceStore((s) => s.setError);
  const isSupported = useVoiceStore((s) => s.isSupported);
  const setSupported = useVoiceStore((s) => s.setSupported);

  const addImage = useImageStore((s) => s.addImage);
  const setGenerating = useImageStore((s) => s.setGenerating);
  const images = useImageStore((s) => s.images);
  const commandHistory = useVoiceStore((s) => s.commandHistory);
  const executeCanvasOperations = useCanvasStore((s) => s.executeOperations);
  const undoCanvas = useCanvasStore((s) => s.undo);
  const redoCanvas = useCanvasStore((s) => s.redo);
  const getContextSummary = useCanvasStore((s) => s.getContextSummary);
  const canvasWidth = useCanvasStore((s) => s.canvasWidth);
  const canvasHeight = useCanvasStore((s) => s.canvasHeight);

  const [assistantText, setAssistantText] = useState('');

  const statusRef = useRef(status);
  statusRef.current = status;
  const resetForCmdRef = useRef<() => void>(() => {});

  const [cooldown, setCooldown] = useState(false);

  const startCooldown = useCallback(() => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), 3000);
  }, []);

  const processCommand = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      if (isStopCommand(text)) {
        setStatus('speaking');
        setAssistantText('好的，不画了。');
        wrappedSpeak('好的，不画了。', () => {
          setStatus('listening');
          resetForCmdRef.current();
        });
        addCommandEntry({
          id: uuidv4(), text, timestamp: Date.now(),
          response: '已停止', confidence: 1.0,
        });
        return;
      }

      setFinalText(text);
      setStatus('processing');
      setGenerating(true);

      const reply = THINKING_REPLIES[Math.floor(Math.random() * THINKING_REPLIES.length)];
      setAssistantText(reply);
      wrappedSpeak(reply);

      try {
        let parsed = parseCommandLocally(text);

        if (!parsed) {
          try {
            parsed = await parseCommand({
              transcript: text,
              canvasState: {
                objects: getContextSummary(),
                width: canvasWidth,
                height: canvasHeight,
              },
              history: commandHistory.slice(-5).map((e) => e.text),
            });
          } catch {
            parsed = null;
          }
        }

        if (parsed?.operations?.length) {
          const normalOps = parsed.operations.filter((op) => op.op !== 'undo' && op.op !== 'redo');
          if (parsed.operations.some((op) => op.op === 'undo')) undoCanvas();
          if (parsed.operations.some((op) => op.op === 'redo')) redoCanvas();
          if (normalOps.length) executeCanvasOperations(normalOps);

          addCommandEntry({
            id: uuidv4(),
            text,
            timestamp: Date.now(),
            response: parsed.explanation || '已画到画布上',
            confidence: parsed.confidence ?? 0.8,
          });
        } else {
          const result = await generateImage(
            text,
            commandHistory.slice(-5).map((e) => e.text)
          );

          if (result.success && result.imageUrl) {
            addImage({
              id: uuidv4(),
              imageUrl: proxyImageUrl(result.imageUrl),
              prompt: text,
              x: 400,
              y: 300 + images.length * 30,
              scale: 0.55,
              timestamp: Date.now(),
            });
            addCommandEntry({ id: uuidv4(), text, timestamp: Date.now(), response: result.explanation || `已生成图像: ${text}`, confidence: 1.0 });
          } else {
            addCommandEntry({ id: uuidv4(), text, timestamp: Date.now(), response: result.error || '没有识别出可绘制内容', confidence: 0 });
          }
        }
      } catch (err) {
        addCommandEntry({ id: uuidv4(), text, timestamp: Date.now(), response: '绘图失败，请重试', confidence: 0 });
      }

      setGenerating(false);
      setStatus('speaking');

      const doneReply = DONE_REPLIES[Math.floor(Math.random() * DONE_REPLIES.length)];
      setAssistantText(doneReply);
      wrappedSpeak(doneReply, () => {
        setStatus('listening');
        resetForCmdRef.current();
        startCooldown();
      });
    },
    [
      setFinalText,
      setStatus,
      commandHistory,
      addCommandEntry,
      addImage,
      setGenerating,
      images.length,
      executeCanvasOperations,
      undoCanvas,
      redoCanvas,
      getContextSummary,
      canvasWidth,
      canvasHeight,
      startCooldown,
    ]
  );

  const processCommandRef = useRef(processCommand);
  processCommandRef.current = processCommand;

  const handleWake = useCallback((fullText?: string) => {
    setStatus('waking');

    if (fullText) {
      const cleaned = fullText.replace(/^[，,。.！!？?、\s]+/, '').replace(/[，,。.！!？?、\s]+$/, '');
      for (const w of ['小花', '笑话', '小化', '消化']) {
        const idx = cleaned.indexOf(w);
        if (idx !== -1) {
          const afterWake = cleaned.substring(idx + w.length).replace(/^[，,。.！!？?、\s]+/, '');
          if (afterWake && afterWake.length > 1) {
            const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
            setAssistantText(greeting);
            wrappedSpeak(greeting, () => {
              setStatus('listening');
              resetForCmdRef.current();
              processCommandRef.current(afterWake);
            });
            return;
          }
        }
      }
    }

    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    setAssistantText(greeting);
    wrappedSpeak(greeting, () => {
      setStatus('listening');
      resetForCmdRef.current();
    });
  }, [setStatus, setAssistantText]);

  const handleWakeRef = useRef(handleWake);
  handleWakeRef.current = handleWake;

  const onWake = useCallback((fullText?: string) => {
    if (statusRef.current !== 'sleeping') return;
    handleWakeRef.current(fullText);
  }, []);

  const STOP_WORDS = ['停止', '停下来', '不用画了', '不用画', '别画了', '不画了', '不画', '算了', '取消', '停'];
  function isStopCommand(text: string): boolean {
    const cleaned = text.toLowerCase().replace(/[\s，,。.！!？?、\-\—]/g, '');
    for (const w of STOP_WORDS) {
      if (cleaned.includes(w)) return true;
    }
    return false;
  }

  const onSubmit = useCallback(
    (text: string, isFinal: boolean) => {
      if (!isFinal) {
        setInterimText(text);
        return;
      }
      if (statusRef.current === 'processing' || statusRef.current === 'speaking') return;
      if (cooldown) return;
      if (text.trim()) {
        processCommandRef.current(text.trim());
      }
    },
    [setInterimText, cooldown]
  );

  const onErr = useCallback(
    (error: string) => {
      if (error === 'not-allowed') {
        setError(error);
        return;
      }
      if (error === 'no-speech' || error === 'aborted') return;
      setError(error);
    },
    [setError]
  );

  const {
    isListening,
    startListening,
    stopListening,
    resetForCommand,
    suspendInput,
    resumeInput,
    isSupported: speechSupported,
  } = useSpeechRecognition({
    onResult: (text, isFinal) => onSubmit(text, isFinal),
    onWakeWord: (fullText) => onWake(fullText),
    onError: onErr,
  });

  resetForCmdRef.current = resetForCommand;

  const wrappedSpeak = useCallback((text: string, onEnd?: () => void) => {
    suspendInput();
    speak(text, () => {
      resumeInput();
      onEnd?.();
    });
  }, [suspendInput, resumeInput]);

  useEffect(() => { setSupported(speechSupported); }, [speechSupported, setSupported]);

  const handleToggleMic = useCallback(() => {
    if (isListening) {
      stopListening();
      setStatus('sleeping');
      setAssistantText('');
    } else {
      setError(null);
      startListening();
      setStatus('sleeping');
      setAssistantText('');
    }
  }, [isListening, startListening, stopListening, setStatus, setError]);

  const isActive = status !== 'sleeping' && status !== 'error';
  const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.sleeping;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
      {!isSupported && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(212,145,42,0.1)',
          border: '1px solid rgba(212,145,42,0.3)',
          borderRadius: 'var(--radius)',
          fontSize: 12,
          color: 'var(--accent)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          请使用 Chrome 浏览器，或使用下方文字输入。
        </div>
      )}

      {assistantText && (
        <div style={{
          padding: '10px 18px',
          background: 'var(--ink-light)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          fontSize: 13,
          color: 'var(--text-primary)',
          textAlign: 'center',
          maxWidth: 260,
          lineHeight: 1.6,
          fontFamily: 'var(--font-body)',
        }}>
          {assistantText}
        </div>
      )}

      <button
        onClick={handleToggleMic}
        disabled={!isSupported}
        style={{
          width: 76,
          height: 76,
          borderRadius: '50%',
          border: `2px solid ${statusInfo.dotColor}`,
          cursor: isSupported ? 'pointer' : 'not-allowed',
          background: status === 'listening'
            ? 'radial-gradient(circle, rgba(90,154,90,0.15), transparent)'
            : status === 'sleeping'
              ? 'radial-gradient(circle, rgba(212,145,42,0.1), transparent)'
              : 'radial-gradient(circle, rgba(232,168,76,0.1), transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          animation: isActive ? 'listen-pulse 2s ease-in-out infinite' : 'breathe 3s ease-in-out infinite',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-primary)', opacity: 0.9 }}>
          {isActive ? (
            <><rect x="6" y="6" width="4" height="12" rx="1" /><rect x="14" y="6" width="4" height="12" rx="1" /></>
          ) : (
            <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>
          )}
        </svg>
      </button>

      <span style={{
        fontSize: 12,
        color: statusInfo.dotColor,
        textAlign: 'center',
        maxWidth: 200,
        lineHeight: 1.6,
        fontFamily: 'var(--font-body)',
      }}>
        {statusInfo.label}
      </span>

      <div
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'var(--ink-light)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text-muted)',
          fontSize: 12,
          lineHeight: 1.8,
          fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>可直接说：</div>
        <div>画一个蓝色圆形</div>
        <div>画蓝天白云和太阳</div>
        <div>撤销、重做、清空画布</div>
        <div>停止、不画了</div>
      </div>
    </div>
  );
}
