import { generate } from '@genkit-ai/ai';
import { defineFlow } from '@genkit-ai/flow';
import { google } from '@genkit-ai/google-genai';
import { z } from 'zod';

// ユーザーからの入力を受け取るための型定義
const PixelArtInputSchema = z.object({
  prompt: z.string(),
  movement: z.string(),
});

// AIからの出力を定義する型スキーマ
const PixelArtOutputSchema = z.object({
  pixelMap: z.array(z.array(z.number())).describe('ドット絵のピクセル配置を表す32x32の2次元配列。0は透明。'),
  palette: z.array(z.string()).describe('使用する色の配列。例: ["#FFFFFF", ...]'),
  description: z.string().describe('生成したドット絵の短い説明。'),
  svgString: z.string().describe('プレビュー表示用のSVG文字列。'),
});

// ドット絵生成フローの定義
export const pixelArtGenerator = defineFlow(
  {
    name: 'pixelArtGenerator',
    inputSchema: PixelArtInputSchema,
    outputSchema: PixelArtOutputSchema,
  },
  async ({ prompt, movement }) => {
    // AIへの指示を記述したプロンプト
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

    const llmResponse = await generate({
      model: google('gemini-1.5-pro-latest'),
      prompt: promptText,
      output: {
        schema: PixelArtOutputSchema,
      },
    });

    return llmResponse.output();
  }
);
