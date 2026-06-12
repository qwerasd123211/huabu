import type { ParseCommandRequest, ParseCommandResponse } from '../types/dsl';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function parseCommand(data: ParseCommandRequest): Promise<ParseCommandResponse> {
  return request<ParseCommandResponse>('/parse-command', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function healthCheck(): Promise<{ status: string }> {
  return request('/health');
}

export interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  revisedPrompt?: string;
  explanation?: string;
  error?: string;
}

export async function generateImage(prompt: string, history: string[]): Promise<GenerateImageResponse> {
  return request<GenerateImageResponse>('/generate-image', {
    method: 'POST',
    body: JSON.stringify({ prompt, history }),
  });
}

export function proxyImageUrl(url: string): string {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}
