import { z } from 'zod';

/**
 * ドット絵生成への入力データ構造をZodスキーマで定義します。
 */
export const PixelArtInputSchema = z.object({
  prompt: z.string().describe('ドット絵のデザインに関するユーザーからの指示（例：「サングラスをかけた猫」）'),
  movement: z.string().describe('ドット絵に適用する動きのパターン（例：「上下に動く」）'),
});
export type PixelArtInput = z.infer<typeof PixelArtInputSchema>;

/**
 * ドット絵生成の出力データ構造をZodスキーマで定義します。
 * これがAIによって生成されるドット絵の構造になります。
 */
export const PixelArtDataSchema = z.object({
  pixelMap: z.array(z.array(z.number())).describe('ドット絵のピクセル配置を表す16x16の2次元配列。0は透明ピクセル。'),
  palette: z.array(z.string()).describe('使用する色の配列（HEX形式）。例: ["transparent", "#000000"]'),
  description: z.string().describe('AIが生成したドット絵の創造的な短い説明。'),
  svgString: z.string().describe('プレビュー表示用のSVGイメージ文字列。<svg>...</svg>の形式。'),
});
export type PixelArtData = z.infer<typeof PixelArtDataSchema>;


/**
 * ドット絵の動きのパターンを定義する型。
 */
export type MovementPattern = 'walking' | 'jumping' | 'idle';

/**
 * 動きのパターンの定義
 */
export interface MovementPatternDefinition {
  value: MovementPattern;
  label: string;
}
