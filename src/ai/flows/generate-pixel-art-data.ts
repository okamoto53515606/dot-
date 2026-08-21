'use server';

import { ai, MODEL_NAME } from '@/ai/client';
import { Type } from '@google/genai';
import {
  PixelArtInputSchema,
  PixelArtDataSchema,
  type PixelArtInput,
  type PixelArtData,
} from '@/lib/types';

/**
 * @fileoverview Google GenAI SDK (@google/genai) を使用して
 * ユーザーの指示に基づいたドット絵の各種データ（ピクセルマップ、パレット、SVG）を生成します。
 */

export async function generatePixelArtData(input: PixelArtInput): Promise<PixelArtData> {
  const validatedInput = PixelArtInputSchema.parse(input);

  const prompt = `ユーザーの指示に基づいて、16x16のドット絵を生成してください。

### ユーザーの指示:
- ドット絵のモチーフ: ${validatedInput.prompt}
- 動き: ${validatedInput.movement}

### 出力要件:
1.  **pixelMap**: 16x16の2次元配列で、各セルには対応するpaletteのインデックスが入ります。透明な部分は0にしてください。
2.  **palette**: 色の配列です。0番目の色は常に透明を意味する 'transparent' にしてください。実際の色の指定は1番目から始めてください。HEX形式で色を指定してください。
3.  **description**: 生成したドット絵の短い説明（日本語で100文字以内）。
4.  **svgString**: 上記のpixelMapとpaletteを基に、プレビュー用のSVG文字列を生成してください。SVGの各ピクセルは10x10の<rect>要素で表現してください。SVGのルート要素は <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" style="image-rendering: pixelated;"> のようになっている必要があります。

### 例:
もしpixelMapの(0,0)が1で、paletteの1が#FF0000なら、SVGには<rect x="0" y="0" width="10" height="10" fill="#FF0000" />が含まれます。pixelMapの値が0のセルに対応する<rect>は含めないでください。`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
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
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('AIから応答を取得できませんでした。');
  }

  const parsedJson = JSON.parse(responseText);
  return PixelArtDataSchema.parse(parsedJson);
}
