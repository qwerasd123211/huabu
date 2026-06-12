import crypto from 'crypto';
import WebSocket from 'ws';

const APPID = process.env.IFLYTEK_APPID || 'b7ee4ef1';
const API_KEY = process.env.IFLYTEK_API_KEY || 'ab4fda4db76fb6b7aba9d5f8d456eeda';
const API_SECRET = process.env.IFLYTEK_API_SECRET || 'ZDQxMmNmMmY5MDRmZTVjZGJjMWJlNDQ2';

const HOST = 'ws-api.xfyun.cn';
const PATH = '/v2/iat';
const IAT_URL = `wss://${HOST}${PATH}`;

function buildAuthUrl(): string {
  const date = new Date().toUTCString();
  const signatureOrigin = `host: ${HOST}\ndate: ${date}\nGET ${PATH} HTTP/1.1`;
  const signature = crypto.createHmac('sha256', API_SECRET).update(signatureOrigin).digest('base64');
  const authorization = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;

  const params = new URLSearchParams({
    appid: APPID,
    host: HOST,
    date,
    authorization: Buffer.from(authorization).toString('base64'),
  });
  return `${IAT_URL}?${params.toString()}`;
}

export interface IatRecognitionResult {
  text: string;
  isFinal: boolean;
}

function bufToBase64(buf: Buffer): string {
  return buf.toString('base64');
}

export function createIatConnection(
  onResult: (result: IatRecognitionResult) => void,
  onError: (error: string) => void,
  onClose: () => void
): { sendAudio: (buf: Buffer) => void; close: () => void } {
  const url = buildAuthUrl();
  const ws = new WebSocket(url);
  let firstFrameSent = false;
  let connected = false;
  const pendingAudio: Buffer[] = [];

  ws.onopen = () => {
    console.log('[IAT] Connected to iFlytek');
    connected = true;
    // Flush buffered audio
    for (const buf of pendingAudio) {
      sendFrame(1, buf);
    }
    pendingAudio.length = 0;
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string);
      console.log('[IAT] Message:', JSON.stringify(msg).slice(0, 300));

      if (msg.code !== 0 && msg.code !== undefined) {
        console.error('[IAT] Error:', msg.code, msg.message);
        onError(msg.message || `Error ${msg.code}`);
        return;
      }

      const data = msg.data?.result;
      if (!data) return;

      let text = '';
      const wsArr = data.ws || [];
      for (const wsItem of wsArr) {
        const cw = wsItem.cw || [];
        for (const cwItem of cw) {
          text += cwItem.w || '';
        }
      }

      const isFinal = data.status === 2;

      if (text) {
        console.log(`[IAT] Recognized${isFinal ? ' (final)' : ''}: "${text}"`);
        onResult({ text, isFinal });
      }
    } catch (err) {
      console.error('[IAT] Parse error:', err);
    }
  };

  ws.onerror = (err) => {
    console.error('[IAT] WebSocket error:', err.message);
    onError('web_socket_error');
  };

  ws.onclose = (event) => {
    console.log(`[IAT] Connection closed (code=${event.code}, reason=${event.reason || 'none'})`);
    onClose();
  };

  function sendFrame(status: 0 | 1 | 2, audio?: Buffer) {
    if (ws.readyState !== WebSocket.OPEN) return;

    const frame: Record<string, unknown> = {
      common: { app_id: APPID },
      business: {
        language: 'zh_cn',
        domain: 'iat',
        accent: 'mandarin',
        vad_eos: 1500,
        dwa: 'wpgs',
      },
      data: {
        status,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: audio ? bufToBase64(audio) : '',
      },
    };

    ws.send(JSON.stringify(frame));
  }

  return {
    sendAudio: (buf: Buffer) => {
      if (!connected) {
        // Buffer until connection opens
        pendingAudio.push(buf);
        if (pendingAudio.length === 1) {
          // Send first frame to establish stream
          ws.once('open', () => {
            sendFrame(0, buf);
          });
        }
        return;
      }
      if (!firstFrameSent) {
        firstFrameSent = true;
        sendFrame(0, buf);
      } else {
        sendFrame(1, buf);
      }
    },
    close: () => {
      if (ws.readyState === WebSocket.OPEN) {
        sendFrame(2);
        ws.close();
      }
    },
  };
}
