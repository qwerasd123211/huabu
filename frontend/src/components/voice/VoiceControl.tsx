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

  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [assistantText, setAssistantText] = useState('');

  const statusRef = useRef(status);
  statusRef.current = status;
  const resetForCmdRef = useRef<() => void>(() => {});

  const [cooldown, setCooldown] = useState(false);

  // Cooldown: 3s after speaking done, ignore voice input
  const startCooldown = useCallback(() => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), 3000);
  }, []);

  const processCommand = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Handle stop commands immediately
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

      setTextInput('');
      setGenerating(false);
      setStatus('speaking');

      const doneReply = DONE_REPLIES[Math.floor(Math.random() * DONE_REPLIES.length)];
      setAssistantText(doneReply);
      wrappedSpeak(doneReply, () => {
        // Back to listening — mic was never stopped
        setStatus('listening');
        resetForCmdRef.current();
        // Start cooldown after TTS finishes
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
      // Extract command after wake word
      const cleaned = fullText.replace(/^[，,。.！!？?、\s]+/, '').replace(/[，,。.！!？?、\s]+$/, '');
      for (const w of ['小花', '笑话', '小化', '消化']) {
        const idx = cleaned.indexOf(w);
        if (idx !== -1) {
          const afterWake = cleaned.substring(idx + w.length).replace(/^[，,。.！!？?、\s]+/, '');
          if (afterWake && afterWake.length > 1) {
            // Wake word + command in one breath
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

    // Just wake word
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
    // Ignore wake word during processing or cooldown
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
      // Ignore input while generating or in cooldown
      if (statusRef.current === 'processing' || statusRef.current === 'speaking') return;
      if (cooldown) return; // 3s cooldown after TTS
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
        setShowTextInput(true);
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

  // Wrap speak to suspend/resume mic input
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

  const statusLabel = (() => {
    switch (status) {
      case 'sleeping': return '说"小花小花"唤醒我';
      case 'waking': return '唤醒了！';
      case 'greeting': return '小花：我在，请问有什么可以帮您的？';
      case 'listening': return '正在聆听...说出你想画的内容';
      case 'processing': return '正在画到画布上...';
      case 'speaking': return '小花回复中...';
      case 'error': return '出错了，点击重试';
      default: return '说"小花小花"唤醒我';
    }
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {!isSupported && (
        <div style={{ padding: '8px 12px', background: 'rgba(255,167,38,0.15)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--warning)', textAlign: 'center' }}>
          请使用 Chrome 浏览器，或使用下方文字输入。
        </div>
      )}

      {assistantText && (
        <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, rgba(108,92,231,0.2), rgba(0,206,201,0.15))', border: '1px solid var(--accent-glow)', borderRadius: '16px', fontSize: 13, color: '#dfe6e9', textAlign: 'center', maxWidth: 240, animation: 'fadeIn 0.3s ease' }}>
          🤖 {assistantText}
        </div>
      )}

      <button
        onClick={handleToggleMic}
        disabled={!isSupported}
        style={{
          width: 72, height: 72, borderRadius: '50%', border: 'none',
          cursor: isSupported ? 'pointer' : 'not-allowed',
          background: isActive ? '#ef5350' : status === 'sleeping' ? 'linear-gradient(135deg, #6c5ce7, #a29bfe)' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))',
          boxShadow: isActive ? '0 0 30px rgba(239,83,80,0.5)' : '0 0 25px rgba(108,92,231,0.6), 0 0 60px rgba(108,92,231,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--transition)',
          animation: isActive ? 'voice-pulse 1.5s ease-in-out infinite' : 'wake-pulse 2.5s ease-in-out infinite',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isActive ? (
            <><rect x="6" y="6" width="4" height="12" rx="1" /><rect x="14" y="6" width="4" height="12" rx="1" /></>
          ) : (
            <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>
          )}
        </svg>
      </button>

      <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 200, lineHeight: 1.5 }}>
        {statusLabel}
      </span>

      <button onClick={() => setShowTextInput(!showTextInput)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
        {showTextInput ? '收起' : '或直接输入文字指令'}
      </button>

      {showTextInput && (
        <div style={{ width: '100%', display: 'flex', gap: 8 }}>
          <input
            type="text" value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && textInput.trim()) processCommand(textInput.trim()); }}
            placeholder='输入指令，如"画一个红色的房子"'
            disabled={status === 'processing'}
            style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
          />
          <button onClick={() => textInput.trim() && processCommand(textInput.trim())} disabled={status === 'processing' || !textInput.trim()}
            style={{ padding: '8px 14px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            发送
          </button>
        </div>
      )}
    </div>
  );
}
