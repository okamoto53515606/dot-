import { streamObject } from 'ai';
import { google } from '@genkit-ai/google-genai';
import { z } from 'zod';

// ユーザーからの入力を受け取るための型定義
export type PixelArtInput = {
  prompt: string;
  movement: string;
};

/**
 * AIを呼び出し、ユーザーのプロンプトに基づいてドット絵のデータを生成します。
 * これには、ピクセルマップ、カラーパレット、説明、そしてプレビュー用のSVG文字列が含まれます。
 * @param {PixelArtInput} input - ユーザーが入力したプロンプトと動きのパターン。
 * @returns {Promise<object>} 生成されたドット絵データとSVG文字列を含むオブジェクト。
 */
export async function generatePixelArtData({ prompt, movement }: PixelArtInput) {

  // AIへの指示を記述したプロンプト文字列
  const promptText = `ユーザーの指示に基づいて、ユニークで魅力的な32x32のドット絵キャラクターを生成してください。

### ユーザーの指示:
- キャラクター: ${prompt}
- 動き: ${movement}

### 出力要件:
1.  **pixelMap**: 32x32の2次元配列で、各セルには対応するpaletteのインデックスが入ります。透明な部分は0にしてください。
2.  **palette**: 色の配列です。0番目の色は常に透明を意味するため、実際の色の指定は1番目から始めてください。HEX形式で色を指定してください。
3.  **description**: 生成したドット絵の創造的で短い説明（日本語で100文字以内）。
4.  **svgString**: 上記のpixelMapとpaletteを基に、プレビュー用のSVG文字列を生成してください。SVGの各ピクセルは10x10の<rect>要素で表現してください。viewBoxは0 0 320 320に設定し、image-rendering: pixelated;スタイルを適用してください。

### 例:
もしpixelMapの(0,0)が1で、paletteの1が#FF0000なら、SVGには<rect x="0" y="0" width="10" height="10" fill="#FF0000" />が含まれます。pixelMapの値が0のセルに対応する<rect>は含めないでください。`;

  const result = await streamObject({
    model: google('gemini-1.5-pro-latest'),
    schema: z.object({
      pixelMap: z.array(z.array(z.number())).describe('ドット絵のピクセル配置を表す2次元配列。32x32のグリッド。0は透明。'),
      palette: z.array(z.string()).describe('使用する色の配列。例: ["#FFFFFF", "#000000", ...]'),
      description: z.string().describe('生成したドット絵の簡単な説明。'),
      svgString: z.string().describe('プレビュー表示用のSVG文字列。<svg ...>...</svg>の形式。pixelMapとpaletteに基づいて生成する。'),
    }),
    prompt: promptText,
  });

  // streamObjectは部分的なオブジェクトのストリームを返すが、
  // ここでは最後の完全なオブジェクトだけを待って返す
  let finalObject: any = {};
  for await (const partialObject of result.partialObjectStream) {
    finalObject = partialObject;
  }

  return finalObject;
}
