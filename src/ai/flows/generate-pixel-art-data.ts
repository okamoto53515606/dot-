'use server';

import { Type } from '@google/genai';
import { GEMINI_MODEL, getGenAI } from '@/ai/google-genai';
import {
  PixelArtInputSchema,
  PixelArtDataSchema,
  type PixelArtInput,
  type PixelArtData,
} from '@/lib/types';

/**
 * @fileoverview @google/genai で Gemini を呼び出し、
 * ユーザー指示に基づくドット絵データ（ピクセルマップ、パレット、SVG）を生成します。
 */

const PIXEL_ART_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    pixelMap: {
      type: Type.ARRAY,
      items: {
        type: Type.ARRAY,
        items: { type: Type.INTEGER },
      },
      description: 'ドット絵のピクセル配置を表す16x16の2次元配列。0は透明ピクセル。',
    },
    palette: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '使用する色の配列（HEX形式）。例: ["transparent", "#000000"]',
    },
    description: {
      type: Type.STRING,
      description: 'AIが生成したドット絵の創造的な短い説明。',
    },
    svgString: {
      type: Type.STRING,
      description: 'プレビュー表示用のSVGイメージ文字列。<svg>...</svg>の形式。',
    },
  },
  required: ['pixelMap', 'palette', 'description', 'svgString'],
};

function buildPrompt(prompt: string, movement: string): string {
  return `ユーザーの指示に基づいて、16x16のドット絵を生成してください。

### ユーザーの指示:
- ドット絵のモチーフ: ${prompt}
- 動き: ${movement}

### 出力要件:
1.  **pixelMap**: 16x16の2次元配列で、各セルには対応するpaletteのインデックスが入ります。透明な部分は0にしてください。
2.  **palette**: 色の配列です。0番目の色は常に透明を意味する 'transparent' にしてください。実際の色の指定は1番目から始めてください。HEX形式で色を指定してください。
3.  **description**: 生成したドット絵の短い説明（日本語で100文字以内）。
4.  **svgString**: 上記のpixelMapとpaletteを基に、プレビュー用のSVG文字列を生成してください。SVGの各ピクセルは10x10の<rect>要素で表現してください。SVGのルート要素は <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" style="image-rendering: pixelated;"> のようになっている必要があります。

### 例:
もしpixelMapの(0,0)が1で、paletteの1が#FF0000なら、SVGには<rect x="0" y="0" width="10" height="10" fill="#FF0000" />が含まれます。pixelMapの値が0のセルに対応する<rect>は含めないでください。`;
}

export async function generatePixelArtData(input: PixelArtInput): Promise<PixelArtData> {
  const parsedInput = PixelArtInputSchema.safeParse(input);
  if (!parsedInput.success) {
    const error = new Error('Invalid input');
    (error as Error & { details: unknown }).details = parsedInput.error.flatten();
    throw error;
  }

  const response = await getGenAI().models.generateContent({
    model: GEMINI_MODEL,
    contents: buildPrompt(parsedInput.data.prompt, parsedInput.data.movement),
    config: {
      responseMimeType: 'application/json',
      responseSchema: PIXEL_ART_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Schema validation failed: response was not valid JSON');
  }

  const parsedOutput = PixelArtDataSchema.safeParse(json);
  if (!parsedOutput.success) {
    const error = new Error('Schema validation failed');
    (error as Error & { details: unknown }).details = parsedOutput.error.flatten();
    throw error;
  }

  return parsedOutput.data;
}
