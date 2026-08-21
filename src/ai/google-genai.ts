import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = 'gemini-3.1-flash-lite';

let client: GoogleGenAI | undefined;

/**
 * Gemini API クライアント（@google/genai）を返す。
 * API キーは既存の GOOGLE_GENAI_API_KEY を使用する。
 */
export function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GENAI_API_KEY is not set');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}
