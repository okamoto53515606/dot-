'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';

/**
 * @fileoverview Genkitフローを定義し、Google AI (Gemini) を使用して
 * ユーザーの指示に基づいたドット絵の各種データ（ピクセルマップ、パレット、SVG）を生成します。
 */

// フローへの入力データ構造をZodスキーマで定義します。
export const PixelArtInputSchema = z.object({
  prompt: z.string().describe('ドット絵のデザインに関するユーザーからの指示（例：「サングラスをかけた猫」）'),
  movement: z.string().describe('ドット絵に適用する動きのパターン（例：「上下に動く」）'),
});
export type PixelArtInput = z.infer<typeof PixelArtInputSchema>;


// フローからの出力データ構造をZodスキーマで定義します。
export const PixelArtOutputSchema = z.object({
  pixelMap: z.array(z.array(z.number())).describe('ドット絵のピクセル配置を表す16x16の2次元配列。0は透明ピクセル。'),
  palette: z.array(z.string()).describe('使用する色の配列（HEX形式）。例: ["transparent", "#000000"]'),
  description: z.string().describe('AIが生成したドット絵の創造的な短い説明。'),
  svgString: z.string().describe('プレビュー表示用のSVGイメージ文字列。<svg>...</svg>の形式。'),
});
export type PixelArtOutput = z.infer<typeof PixelArtOutputSchema>;


// AIに渡すプロンプトテンプレートを定義します。
// これにより、プロンプトの管理とフローのロジックを分離します。
const pixelArtPrompt = ai.definePrompt({
  name: 'pixelArtPrompt',
  input: { schema: PixelArtInputSchema },
  output: { schema: PixelArtOutputSchema },
  prompt: `ユーザーの指示に基づいて、ユニークで魅力的な16x16のドット絵キャラクターを生成してください。

### ユーザーの指示:
- キャラクター: {{{prompt}}}
- 動き: {{{movement}}}

### 出力要件:
1.  **pixelMap**: 16x16の2次元配列で、各セルには対応するpaletteのインデックスが入ります。透明な部分は0にしてください。
2.  **palette**: 色の配列です。0番目の色は常に透明を意味する 'transparent' にしてください。実際の色の指定は1番目から始めてください。HEX形式で色を指定してください。
3.  **description**: 生成したドット絵の創造的で短い説明（日本語で100文字以内）。
4.  **svgString**: 上記のpixelMapとpaletteを基に、プレビュー用のSVG文字列を生成してください。SVGの各ピクセルは10x10の<rect>要素で表現してください。viewBoxは0 0 160 160に設定し、style="image-rendering: pixelated;" を<svg>要素に適用してください。

### 例:
もしpixelMapの(0,0)が1で、paletteの1が#FF0000なら、SVGには<rect x="0" y="0" width="10" height="10" fill="#FF0000" />が含まれます。pixelMapの値が0のセルに対応する<rect>は含めないでください。`,
});

/**
 * ドット絵生成フロー本体。
 * Genkitの `ai.defineFlow` を使用して、再利用可能で監視可能なAI処理の単位を定義します。
 */
const pixelArtGeneratorFlow = ai.defineFlow(
  {
    name: 'pixelArtGeneratorFlow',
    inputSchema: PixelArtInputSchema,
    outputSchema: PixelArtOutputSchema,
  },
  async (input) => {
    // 定義済みのプロンプトテンプレートを実行し、整形された出力を待ちます。
    const { output } = await pixelArtPrompt(input);
    // スキーマ検証済みのデータを安全に返します。
    return output!;
  }
);

export async function generatePixelArtData(input: PixelArtInput): Promise<PixelArtOutput> {
  return pixelArtGeneratorFlow(input);
}